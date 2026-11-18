import Comment from "@models/Comment";
import Controller from "@utils/baseController";
import type { Request, Response } from "express";

const controller = new (class extends Controller {
  async list(_req: Request, res: Response) {
    const query = res.locals.validatedQuery as {
      page: number;
      limit: number;
      status?: "pending" | "approved" | "rejected";
    };
    const filter = query.status ? { status: query.status } : {};
    const [items, total] = await Promise.all([
      Comment.find(filter)
        .populate("user", "firstName lastName phoneNumber")
        .populate("product", "name slug")
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit),
      Comment.countDocuments(filter),
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

  async updateStatus(req: Request, res: Response) {
    const { commentId } = res.locals.validatedParams as { commentId: string };
    const { status } = req.body as {
      status: "pending" | "approved" | "rejected";
    };
    const comment = await Comment.findByIdAndUpdate(
      commentId,
      { $set: { status } },
      { new: true, runValidators: true },
    );
    if (!comment) return this.error(404, "نظر پیدا نشد.");
    return this.response({
      res,
      message: "وضعیت نظر به‌روزرسانی شد.",
      data: comment,
    });
  }
})();

export default controller;
