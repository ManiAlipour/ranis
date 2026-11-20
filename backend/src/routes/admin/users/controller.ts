import User from "@models/User";
import Controller from "@utils/baseController";
import type { Request, Response } from "express";

const controller = new (class extends Controller {
  async list(_req: Request, res: Response) {
    const query = res.locals.validatedQuery as {
      page: number;
      limit: number;
      search?: string;
      role?: "user" | "admin" | "owner";
      active?: boolean;
    };
    const filter: Record<string, unknown> = {};
    if (query.role) filter.role = query.role;
    if (query.active !== undefined) filter.isActive = query.active;
    if (query.search) {
      const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { firstName: new RegExp(escaped, "i") },
        { lastName: new RegExp(escaped, "i") },
        { phoneNumber: new RegExp(escaped, "i") },
      ];
    }
    const [items, total] = await Promise.all([
      User.find(filter as never)
        .select(
          "firstName lastName phoneNumber role isActive isVerifiedPhone createdAt updatedAt",
        )
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit),
      User.countDocuments(filter as never),
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
    const { userId } = res.locals.validatedParams as { userId: string };
    const user = await User.findById(userId)
      .select(
        "firstName lastName phoneNumber role isActive isVerifiedPhone address createdAt updatedAt",
      )
      .populate("address");
    if (!user) return this.error(404, "کاربر پیدا نشد.");
    return this.response({ res, data: user });
  }

  async updateActive(req: Request, res: Response) {
    const { userId } = res.locals.validatedParams as { userId: string };
    const { isActive } = req.body as { isActive: boolean };
    const actor = res.locals.authUser as InstanceType<typeof User>;
    const target = await User.findById(userId);
    if (!target) return this.error(404, "کاربر پیدا نشد.");
    if (target._id.equals(actor._id))
      return this.error(400, "امکان غیرفعال‌کردن حساب خودتان وجود ندارد.");
    if (target.role === "owner")
      return this.error(403, "تغییر وضعیت حساب مالک امکان‌پذیر نیست.");
    if (target.role === "admin" && actor.role !== "owner") {
      return this.error(403, "فقط مالک می‌تواند وضعیت مدیران را تغییر دهد.");
    }
    target.isActive = isActive;
    await target.save();
    return this.response({
      res,
      message: isActive ? "حساب کاربر فعال شد." : "حساب کاربر غیرفعال شد.",
      data: {
        id: target.id,
        firstName: target.firstName,
        lastName: target.lastName,
        phoneNumber: target.phoneNumber,
        role: target.role,
        isActive: target.isActive,
      },
    });
  }

  async updateRole(req: Request, res: Response) {
    const { userId } = res.locals.validatedParams as { userId: string };
    const { role } = req.body as { role: "user" | "admin" };
    const actor = res.locals.authUser as InstanceType<typeof User>;
    if (actor.role !== "owner")
      return this.error(403, "فقط مالک می‌تواند نقش کاربران را تغییر دهد.");
    const target = await User.findById(userId);
    if (!target) return this.error(404, "کاربر پیدا نشد.");
    if (target.role === "owner")
      return this.error(403, "نقش مالک قابل تغییر نیست.");
    if (target._id.equals(actor._id))
      return this.error(400, "امکان تغییر نقش حساب خودتان وجود ندارد.");
    target.role = role;
    await target.save();
    return this.response({
      res,
      message: "نقش کاربر به‌روزرسانی شد.",
      data: {
        id: target.id,
        firstName: target.firstName,
        lastName: target.lastName,
        role: target.role,
      },
    });
  }
})();

export default controller;
