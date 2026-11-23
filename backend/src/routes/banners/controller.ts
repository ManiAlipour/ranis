import Banner from "../../models/Banner";
import Controller from "../../utils/baseController";
import type { Request, Response } from "express";

const controller = new (class extends Controller {
  async list(_req: Request, res: Response) {
    const { placement } = res.locals.validatedQuery as { placement?: string };
    const now = new Date();
    const filter = {
      isActive: true,
      ...(placement ? { placement } : {}),
      $and: [
        {
          $or: [
            { startsAt: { $exists: false } },
            { startsAt: null },
            { startsAt: { $lte: now } },
          ],
        },
        {
          $or: [
            { endsAt: { $exists: false } },
            { endsAt: null },
            { endsAt: { $gt: now } },
          ],
        },
      ],
    };
    const banners = await Banner.find(filter)
      .select(
        "title subtitle imageUrl linkUrl placement sortOrder startsAt endsAt",
      )
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();
    return this.response({ res, data: banners });
  }
})();

export default controller;
