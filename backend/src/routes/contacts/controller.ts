import Contact from "../../models/Contact";
import Controller from "../../utils/baseController";
import type { Request, Response } from "express";

const controller = new (class extends Controller {
  async create(req: Request, res: Response) {
    const contact = await Contact.create(req.body);
    return this.response({
      res,
      status: 201,
      message: "پیام شما با موفقیت ثبت شد.",
      data: { id: contact.id, status: contact.status },
    });
  }

  async list(_req: Request, res: Response) {
    const query = res.locals.validatedQuery as {
      page: number;
      limit: number;
      status?: "new" | "in_progress" | "resolved" | "closed";
    };
    const filter = query.status ? { status: query.status } : {};
    const [items, total] = await Promise.all([
      Contact.find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit),
      Contact.countDocuments(filter),
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
    const { contactId } = res.locals.validatedParams as { contactId: string };
    const contact = await Contact.findById(contactId);
    if (!contact) return this.error(404, "پیام پیدا نشد.");
    return this.response({ res, data: contact });
  }

  async updateStatus(req: Request, res: Response) {
    const { contactId } = res.locals.validatedParams as { contactId: string };
    const { status } = req.body as {
      status: "new" | "in_progress" | "resolved" | "closed";
    };
    const contact = await Contact.findByIdAndUpdate(
      contactId,
      { $set: { status } },
      { new: true, runValidators: true },
    );
    if (!contact) return this.error(404, "پیام پیدا نشد.");
    return this.response({
      res,
      message: "وضعیت پیام به‌روزرسانی شد.",
      data: contact,
    });
  }
})();

export default controller;
