import Order, { type OrderStatus } from "@models/Order";
import Variant from "@models/Variant";
import Controller from "@utils/baseController";
import type { Request, Response } from "express";

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};

const controller = new (class extends Controller {
  async list(_req: Request, res: Response) {
    const query = res.locals.validatedQuery as {
      page: number;
      limit: number;
      status?: OrderStatus;
      search?: string;
    };
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.orderNumber = new RegExp(
        query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );
    }
    const [items, total] = await Promise.all([
      Order.find(filter as never)
        .populate("user", "firstName lastName phoneNumber")
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit),
      Order.countDocuments(filter as never),
    ]);
    return this.response({
      res,
      data: {
        items,
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    });
  }

  async get(req: Request, res: Response) {
    const { orderId } = res.locals.validatedParams as { orderId: string };
    const order = await Order.findById(orderId).populate(
      "user",
      "firstName lastName phoneNumber",
    );
    if (!order) return this.error(404, "سفارش پیدا نشد.");
    return this.response({ res, data: order });
  }

  async updateStatus(req: Request, res: Response) {
    const { orderId } = res.locals.validatedParams as { orderId: string };
    const { status: nextStatus } = req.body as { status: OrderStatus };
    const order = await Order.findById(orderId);
    if (!order) return this.error(404, "سفارش پیدا نشد.");
    if (!allowedTransitions[order.status].includes(nextStatus)) {
      return this.error(409, "تغییر وضعیت سفارش با وضعیت فعلی آن سازگار نیست.");
    }

    const previousStatus = order.status;
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: order._id, status: previousStatus } as never,
      { $set: { status: nextStatus } },
      { new: true, runValidators: true },
    );
    if (!updatedOrder) {
      return this.error(
        409,
        "وضعیت سفارش هم‌زمان تغییر کرده است؛ دوباره تلاش کنید.",
      );
    }

    if (nextStatus === "cancelled") {
      await Promise.all(
        order.items.map((item) =>
          Variant.updateOne(
            { _id: item.variant },
            { $inc: { stock: item.quantity } },
          ),
        ),
      );
    }

    return this.response({
      res,
      message: "وضعیت سفارش به‌روزرسانی شد.",
      data: updatedOrder,
    });
  }
})();

export default controller;
