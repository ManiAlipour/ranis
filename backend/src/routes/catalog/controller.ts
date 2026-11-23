import Category from "../../models/Category";
import Product from "../../models/Product";
import Variant from "../../models/Variant";
import Controller from "../../utils/baseController";
import type { PipelineStage } from "mongoose";
import type { Request, Response } from "express";
import type { z } from "zod";
import type { productListQuerySchema, slugParamsSchema } from "./validators";

type ProductListQuery = z.infer<typeof productListQuerySchema>;
type SlugParams = z.infer<typeof slugParamsSchema>;

const parseProductQuery = (res: Response) =>
  res.locals.validatedQuery as ProductListQuery;

const parseSlug = (res: Response) => res.locals.validatedParams as SlugParams;

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const catalogController = new (class extends Controller {
  async listCategories(_req: Request, res: Response) {
    const [categories, productCounts] = await Promise.all([
      Category.find({ isActive: true })
        .select("name slug description imageUrl parent sortOrder")
        .sort({ sortOrder: 1, name: 1 })
        .lean(),
      Product.aggregate([
        { $match: { status: "active" } },
        {
          $lookup: {
            from: Variant.collection.name,
            let: { productId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$product", "$$productId"] },
                  isActive: true,
                },
              },
              { $limit: 1 },
            ],
            as: "activeVariants",
          },
        },
        { $match: { "activeVariants.0": { $exists: true } } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
    ]);

    const counts = new Map(
      productCounts.map((item: { _id: unknown; count: number }) => [
        String(item._id),
        item.count,
      ]),
    );

    return this.response({
      res,
      data: categories.map((category) => ({
        ...category,
        productCount: counts.get(String(category._id)) ?? 0,
      })),
    });
  }

  async getCategory(req: Request, res: Response) {
    const { slug } = parseSlug(res);
    const category = await Category.findOne({ slug, isActive: true })
      .select("name slug description imageUrl parent sortOrder createdAt")
      .lean();
    if (!category) return this.error(404, "دسته‌بندی پیدا نشد.");

    const [children, productCount] = await Promise.all([
      Category.find({ parent: category._id, isActive: true })
        .select("name slug description imageUrl parent sortOrder")
        .sort({ sortOrder: 1, name: 1 })
        .lean(),
      Product.aggregate([
        { $match: { category: category._id, status: "active" } },
        {
          $lookup: {
            from: Variant.collection.name,
            let: { productId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$product", "$$productId"] },
                  isActive: true,
                },
              },
              { $limit: 1 },
            ],
            as: "activeVariants",
          },
        },
        { $match: { "activeVariants.0": { $exists: true } } },
        { $count: "count" },
      ]),
    ]);

    return this.response({
      res,
      data: {
        ...category,
        children,
        productCount: productCount[0]?.count ?? 0,
      },
    });
  }

  async listProducts(_req: Request, res: Response) {
    const {
      page,
      limit,
      search,
      category: categorySlug,
      tag,
      minPrice,
      maxPrice,
      inStock,
      sort,
    } = parseProductQuery(res);

    const productMatch: Record<string, unknown> = { status: "active" };
    if (tag) productMatch.tags = tag;

    if (search) {
      const searchRegex = new RegExp(escapeRegex(search), "i");
      productMatch.$or = [
        { name: searchRegex },
        { slug: searchRegex },
        { description: searchRegex },
        { tags: searchRegex },
      ];
    }

    if (categorySlug) {
      const category = await Category.findOne({
        slug: categorySlug,
        isActive: true,
      }).select("_id");
      if (!category) {
        return this.response({
          res,
          data: { items: [], page, limit, total: 0, pages: 0 },
        });
      }
      productMatch.category = category._id;
    }

    const variantMatch: Record<string, unknown> = { isActive: true };
    if (inStock !== undefined) {
      variantMatch.stock = inStock ? { $gt: 0 } : 0;
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      variantMatch.price = {
        ...(minPrice !== undefined ? { $gte: minPrice } : {}),
        ...(maxPrice !== undefined ? { $lte: maxPrice } : {}),
      };
    }

    const sortStage: Record<string, 1 | -1> =
      sort === "price_asc"
        ? { minPrice: 1 as const, name: 1 as const }
        : sort === "price_desc"
          ? { minPrice: -1 as const, name: 1 as const }
          : { createdAt: -1 as const, name: 1 as const };

    const pipeline: PipelineStage[] = [
      { $match: productMatch },
      {
        $lookup: {
          from: Category.collection.name,
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      { $match: { "category.isActive": true } },
      {
        $lookup: {
          from: Variant.collection.name,
          let: { productId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$product", "$$productId"] },
                ...variantMatch,
              },
            },
            {
              $project: {
                sku: 1,
                attributes: 1,
                price: 1,
                compareAtPrice: 1,
                stock: 1,
              },
            },
          ],
          as: "variants",
        },
      },
      { $match: { "variants.0": { $exists: true } } },
      {
        $addFields: {
          minPrice: { $min: "$variants.price" },
          maxPrice: { $max: "$variants.price" },
        },
      },
      { $sort: sortStage },
      {
        $facet: {
          items: [
            { $skip: (page - 1) * limit },
            { $limit: limit },
            {
              $project: {
                name: 1,
                slug: 1,
                description: 1,
                images: 1,
                tags: 1,
                createdAt: 1,
                updatedAt: 1,
                category: {
                  _id: "$category._id",
                  name: "$category.name",
                  slug: "$category.slug",
                },
                variants: 1,
                minPrice: 1,
                maxPrice: 1,
              },
            },
          ],
          metadata: [{ $count: "total" }],
        },
      },
    ];

    const [result] = await Product.aggregate<{
      items: Record<string, unknown>[];
      metadata: { total: number }[];
    }>(pipeline);
    const total = result?.metadata[0]?.total ?? 0;

    return this.response({
      res,
      data: {
        items: result?.items ?? [],
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }

  async getProduct(req: Request, res: Response) {
    const { slug } = parseSlug(res);
    const product = await Product.findOne({ slug, status: "active" })
      .select("name slug description category images tags createdAt updatedAt")
      .lean();
    if (!product) return this.error(404, "محصول پیدا نشد.");

    const [category, variants] = await Promise.all([
      Category.findOne({ _id: product.category, isActive: true })
        .select("name slug imageUrl parent")
        .lean(),
      Variant.find({ product: product._id, isActive: true })
        .select("sku attributes price compareAtPrice stock")
        .sort({ price: 1 })
        .lean(),
    ]);

    if (!category) return this.error(404, "محصول پیدا نشد.");

    const prices = variants.map((variant) => variant.price);
    return this.response({
      res,
      data: {
        ...product,
        category,
        variants,
        minPrice: prices.length ? Math.min(...prices) : null,
        maxPrice: prices.length ? Math.max(...prices) : null,
      },
    });
  }
})();

export default catalogController;
