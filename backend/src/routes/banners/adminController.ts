import Banner from "../../models/Banner";
import Controller from "../../utils/baseController";
import type { Request, Response } from "express";

const controller = new (class extends Controller {
  async list(_req: Request, res: Response) {
    const query = res.locals.validatedQuery as {
      page: number;
      limit: number;
      placement?: string;
      active?: boolean;
    };
    const filter = {
      ...(query.placement ? { placement: query.placement } : {}),
      ...(query.active === undefined ? {} : { isActive: query.active }),
    };
    const [items, total] = await Promise.all([
      Banner.find(filter)
        .sort({ placement: 1, sortOrder: 1, createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit),
      Banner.countDocuments(filter),
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
    const { bannerId } = res.locals.validatedParams as { bannerId: string };
    const banner = await Banner.findById(bannerId);
    if (!banner) return this.error(404, "بنر پیدا نشد.");
    return this.response({ res, data: banner });
  }

  async create(req: Request, res: Response) {
    const banner = await Banner.create({
      ...req.body,
      startsAt: req.body.startsAt ? new Date(req.body.startsAt) : undefined,
      endsAt: req.body.endsAt ? new Date(req.body.endsAt) : undefined,
    });
    return this.response({
      res,
      status: 201,
      message: "بنر ساخته شد.",
      data: banner,
    });
  }

  async update(req: Request, res: Response) {
    const { bannerId } = res.locals.validatedParams as { bannerId: string };
    const banner = await Banner.findById(bannerId);
    if (!banner) return this.error(404, "بنر پیدا نشد.");
    const update = { ...req.body };
    if (update.startsAt !== undefined)
      update.startsAt = update.startsAt ? new Date(update.startsAt) : undefined;
    if (update.endsAt !== undefined)
      update.endsAt = update.endsAt ? new Date(update.endsAt) : undefined;
    const startsAt = update.startsAt ?? banner.startsAt;
    const endsAt = update.endsAt ?? banner.endsAt;
    if (startsAt && endsAt && startsAt >= endsAt) {
      return this.error(400, "تاریخ پایان باید بعد از تاریخ شروع باشد.");
    }
    Object.assign(banner, update);
    await banner.save();
    return this.response({ res, message: "بنر ویرایش شد.", data: banner });
  }

  async deactivate(req: Request, res: Response) {
    const { bannerId } = res.locals.validatedParams as { bannerId: string };
    const banner = await Banner.findByIdAndUpdate(
      bannerId,
      { $set: { isActive: false } },
      { new: true, runValidators: true },
    );
    if (!banner) return this.error(404, "بنر پیدا نشد.");
    return this.response({ res, message: "بنر غیرفعال شد.", data: banner });
  }
})();

export default controller;
