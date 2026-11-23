import Comment from "../../models/Comment";
import Order from "../../models/Order";
import Product from "../../models/Product";
import User from "../../models/User";
import Controller from "../../utils/baseController";
import type { Request, Response } from "express";

const controller = new (class extends Controller {
  async list(_req: Request, res: Response) {
    const { productSlug } = res.locals.validatedParams as {
      productSlug: string;
    };
    const { page, limit } = res.locals.validatedQuery as {
      page: number;
      limit: number;
    };
    const product = await Product.findOne({
      slug: productSlug,
      status: "active",
    }).select("_id");
    if (!product) return this.error(404, "محصول پیدا نشد.");
    const filter = { product: product._id, status: "approved" } as never;
    const [items, total, ratingSummary] = await Promise.all([
      Comment.find(filter)
        .select("rating title body isVerifiedPurchase createdAt")
        .populate("user", "firstName lastName")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Comment.countDocuments(filter),
      Comment.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            average: { $avg: "$rating" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);
    return this.response({
      res,
      data: {
        items,
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        rating: { average: ratingSummary[0]?.average ?? 0, count: total },
      },
    });
  }

  async create(req: Request, res: Response) {
    const { productSlug } = res.locals.validatedParams as {
      productSlug: string;
    };
    const user = res.locals.authUser as InstanceType<typeof User>;
    const product = await Product.findOne({
      slug: productSlug,
      status: "active",
    }).select("_id");
    if (!product) return this.error(404, "محصول پیدا نشد.");
    const deliveredOrder = await Order.exists({
      user: user._id,
      status: "delivered",
      "items.product": product._id,
    });
    if (!deliveredOrder)
      return this.error(403, "ثبت نظر پس از تحویل سفارش امکان‌پذیر است.");
    if (await Comment.exists({ user: user._id, product: product._id })) {
      return this.error(409, "برای این محصول قبلاً نظر ثبت کرده‌اید.");
    }
    const comment = await Comment.create({
      ...req.body,
      user: user._id,
      product: product._id,
      isVerifiedPurchase: true,
    });
    return this.response({
      res,
      status: 201,
      message: "نظر شما ثبت شد و پس از بررسی نمایش داده می‌شود.",
      data: comment,
    });
  }
})();

export default controller;
