import Address from "../../models/Address";
import Comment from "../../models/Comment";
import Order from "../../models/Order";
import Transaction from "../../models/Transaction";
import User from "../../models/User";
import Controller from "../../utils/baseController";
import type { Request, Response } from "express";

const getCurrentUser = (res: Response) =>
  res.locals.authUser as InstanceType<typeof User>;

const getPagination = (req: Request) => {
  const query = req.query as Record<string, string | undefined>;
  return {
    page: Number(query.page ?? 1),
    limit: Number(query.limit ?? 20),
  };
};

const userController = new (class extends Controller {
  async getProfile(_req: Request, res: Response) {
    const user = getCurrentUser(res);
    return this.response({
      res,
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        role: user.role,
        isVerifiedPhone: user.isVerifiedPhone,
        createdAt: user.createdAt,
      },
    });
  }

  async updateProfile(req: Request, res: Response) {
    const user = getCurrentUser(res);
    Object.assign(user, req.body);
    await user.save();

    return this.response({
      res,
      message: "اطلاعات حساب با موفقیت ویرایش شد.",
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        role: user.role,
        isVerifiedPhone: user.isVerifiedPhone,
        createdAt: user.createdAt,
      },
    });
  }

  async listAddresses(_req: Request, res: Response) {
    const user = getCurrentUser(res);
    const addresses = await Address.find({ _id: { $in: user.address } }).sort({
      createdAt: -1,
    });
    return this.response({ res, data: addresses });
  }

  async createAddress(req: Request, res: Response) {
    const user = getCurrentUser(res);
    const address = await Address.create(req.body);
    user.address.push(address._id);
    await user.save();

    return this.response({
      res,
      status: 201,
      message: "نشانی با موفقیت ثبت شد.",
      data: address,
    });
  }

  async updateAddress(req: Request, res: Response) {
    const user = getCurrentUser(res);
    const { addressId } = req.params as { addressId: string };
    const ownsAddress = user.address.some((id) => id.toString() === addressId);
    if (!ownsAddress) return this.error(404, "نشانی پیدا نشد.");

    const address = await Address.findByIdAndUpdate(
      addressId,
      { $set: req.body },
      { new: true, runValidators: true },
    );
    if (!address) return this.error(404, "نشانی پیدا نشد.");

    return this.response({
      res,
      message: "نشانی با موفقیت ویرایش شد.",
      data: address,
    });
  }

  async deleteAddress(req: Request, res: Response) {
    const user = getCurrentUser(res);
    const { addressId } = req.params as { addressId: string };
    const ownsAddress = user.address.some((id) => id.toString() === addressId);
    if (!ownsAddress) return this.error(404, "نشانی پیدا نشد.");

    user.address = user.address.filter((id) => id.toString() !== addressId);
    await user.save();
    await Address.deleteOne({ _id: addressId });

    return this.response({ res, message: "نشانی حذف شد." });
  }

  async listOrders(req: Request, res: Response) {
    const user = getCurrentUser(res);
    const { page, limit } = getPagination(req);
    const filter = { user: user._id };
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    return this.response({
      res,
      data: {
        items: orders,
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }

  async getOrder(req: Request, res: Response) {
    const user = getCurrentUser(res);
    const { orderId } = req.params as { orderId: string };
    const order = await Order.findOne({ _id: orderId, user: user._id });
    if (!order) return this.error(404, "سفارش پیدا نشد.");
    return this.response({ res, data: order });
  }

  async listTransactions(req: Request, res: Response) {
    const user = getCurrentUser(res);
    const { page, limit } = getPagination(req);
    const filter = { user: user._id };
    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .select(
          "order amount currency provider status paidAt createdAt updatedAt",
        )
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Transaction.countDocuments(filter),
    ]);

    return this.response({
      res,
      data: {
        items: transactions,
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }

  async listComments(req: Request, res: Response) {
    const user = getCurrentUser(res);
    const { page, limit } = getPagination(req);
    const filter = { user: user._id };
    const [comments, total] = await Promise.all([
      Comment.find(filter)
        .select(
          "product rating title body status isVerifiedPurchase createdAt updatedAt",
        )
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Comment.countDocuments(filter),
    ]);

    return this.response({
      res,
      data: {
        items: comments,
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }
})();

export default userController;
