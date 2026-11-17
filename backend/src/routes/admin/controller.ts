import Category from "@models/Category";
import Product from "@models/Product";
import Variant from "@models/Variant";
import Controller from "@utils/baseController";
import type { Request, Response } from "express";
import type { Types } from "mongoose";
import type { z } from "zod";
import type {
  adminCategoryListQuerySchema,
  adminListQuerySchema,
} from "./validators";

type AdminListQuery = z.infer<typeof adminListQuerySchema>;
type AdminCategoryListQuery = z.infer<typeof adminCategoryListQuerySchema>;

const hasActiveCategoryDependents = async (categoryId: Types.ObjectId) => {
  const [activeProducts, activeChildren] = await Promise.all([
    Product.exists({ category: categoryId, status: "active" }),
    Category.exists({ parent: categoryId, isActive: true }),
  ]);
  return Boolean(activeProducts || activeChildren);
};

const adminController = new (class extends Controller {
  async listProducts(_req: Request, res: Response) {
    const { page, limit, search, status, category } = res.locals
      .validatedQuery as AdminListQuery;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: new RegExp(escapedSearch, "i") },
        { slug: new RegExp(escapedSearch, "i") },
      ];
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug isActive")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    return this.response({
      res,
      data: {
        items: products,
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }

  async getProduct(req: Request, res: Response) {
    const { productId } = req.params as { productId: string };
    const product = await Product.findById(productId).populate(
      "category",
      "name slug isActive",
    );
    if (!product) return this.error(404, "محصول پیدا نشد.");

    const variants = await Variant.find({ product: product._id }).sort({
      createdAt: -1,
    });
    return this.response({ res, data: { ...product.toObject(), variants } });
  }

  async createProduct(req: Request, res: Response) {
    const { category: categoryId, status } = req.body;
    const category = await Category.findById(categoryId);
    if (!category) return this.error(400, "دسته‌بندی انتخاب‌شده پیدا نشد.");
    if (status === "active" && !category.isActive)
      return this.error(400, "برای فعال‌کردن محصول، دسته‌بندی باید فعال باشد.");

    const product = await Product.create(req.body);
    return this.response({
      res,
      status: 201,
      message: "محصول ساخته شد.",
      data: product,
    });
  }

  async updateProduct(req: Request, res: Response) {
    const { productId } = req.params as { productId: string };
    const product = await Product.findById(productId);
    if (!product) return this.error(404, "محصول پیدا نشد.");

    const categoryId = req.body.category ?? product.category;
    const status = req.body.status ?? product.status;
    const category = await Category.findById(categoryId);
    if (!category) return this.error(400, "دسته‌بندی انتخاب‌شده پیدا نشد.");
    if (status === "active" && !category.isActive)
      return this.error(400, "برای فعال‌کردن محصول، دسته‌بندی باید فعال باشد.");

    Object.assign(product, req.body);
    await product.save();
    return this.response({
      res,
      message: "محصول ویرایش شد.",
      data: product,
    });
  }

  async archiveProduct(req: Request, res: Response) {
    const { productId } = req.params as { productId: string };
    const product = await Product.findByIdAndUpdate(
      productId,
      { $set: { status: "archived" } },
      { new: true, runValidators: true },
    );
    if (!product) return this.error(404, "محصول پیدا نشد.");
    return this.response({
      res,
      message: "محصول آرشیو شد.",
      data: product,
    });
  }

  async listCategories(_req: Request, res: Response) {
    const { page, limit, active } = res.locals
      .validatedQuery as AdminCategoryListQuery;
    const filter: Record<string, unknown> = {};
    if (active !== undefined) filter.isActive = active;

    const [categories, total] = await Promise.all([
      Category.find(filter)
        .populate("parent", "name slug")
        .sort({ sortOrder: 1, name: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Category.countDocuments(filter),
    ]);

    return this.response({
      res,
      data: {
        items: categories,
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }

  async getCategory(req: Request, res: Response) {
    const { id } = req.params as { id: string };
    const category = await Category.findById(id).populate(
      "parent",
      "name slug",
    );
    if (!category) return this.error(404, "دسته‌بندی پیدا نشد.");

    const [children, products] = await Promise.all([
      Category.find({ parent: category._id }).select(
        "name slug isActive sortOrder",
      ),
      Product.countDocuments({ category: category._id }),
    ]);

    return this.response({
      res,
      data: { ...category.toObject(), children, productCount: products },
    });
  }

  async createCategory(req: Request, res: Response) {
    const { parent } = req.body;
    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) return this.error(400, "دسته‌بندی والد پیدا نشد.");
      if (!parentCategory.isActive)
        return this.error(400, "دسته‌بندی والد غیرفعال است.");
    }

    const category = await Category.create({
      ...req.body,
      parent: parent ?? undefined,
    });
    return this.response({
      res,
      status: 201,
      message: "دسته‌بندی ساخته شد.",
      data: category,
    });
  }

  async updateCategory(req: Request, res: Response) {
    const { id } = req.params as { id: string };
    const category = await Category.findById(id);
    if (!category) return this.error(404, "دسته‌بندی پیدا نشد.");

    if (req.body.parent !== undefined && req.body.parent !== null) {
      const parentId = req.body.parent as string;
      if (parentId === id)
        return this.error(400, "دسته‌بندی نمی‌تواند والد خودش باشد.");

      let parentCategory =
        await Category.findById(parentId).select("parent isActive");
      if (!parentCategory) return this.error(400, "دسته‌بندی والد پیدا نشد.");
      if (!parentCategory.isActive)
        return this.error(400, "دسته‌بندی والد غیرفعال است.");

      for (let depth = 0; parentCategory?.parent && depth < 100; depth += 1) {
        if (parentCategory.parent.toString() === id)
          return this.error(400, "انتخاب این والد باعث ایجاد چرخه می‌شود.");
        parentCategory = await Category.findById(parentCategory.parent).select(
          "parent isActive",
        );
      }
    }

    if (req.body.isActive === false && category.isActive) {
      if (await hasActiveCategoryDependents(category._id))
        return this.error(
          409,
          "ابتدا محصولات فعال و زیردسته‌های فعال را غیرفعال کنید.",
        );
    }

    if (req.body.isActive === true) {
      const parentId =
        req.body.parent === null
          ? undefined
          : (req.body.parent ?? category.parent);
      if (parentId) {
        const parentCategory =
          await Category.findById(parentId).select("isActive");
        if (!parentCategory?.isActive)
          return this.error(
            400,
            "برای فعال‌کردن دسته‌بندی، والد باید فعال باشد.",
          );
      }
    }

    const update = { ...req.body };
    if (update.parent === null) update.parent = undefined;
    Object.assign(category, update);
    await category.save();
    return this.response({
      res,
      message: "دسته‌بندی ویرایش شد.",
      data: category,
    });
  }

  async deactivateCategory(req: Request, res: Response) {
    const { id } = req.params as { id: string };
    const category = await Category.findById(id);
    if (!category) return this.error(404, "دسته‌بندی پیدا نشد.");

    if (await hasActiveCategoryDependents(category._id))
      return this.error(
        409,
        "ابتدا محصولات فعال و زیردسته‌های فعال را غیرفعال کنید.",
      );

    category.isActive = false;
    await category.save();
    return this.response({
      res,
      message: "دسته‌بندی غیرفعال شد.",
      data: category,
    });
  }

  async listVariants(req: Request, res: Response) {
    const { productId } = req.params as { productId: string };
    const productExists = await Product.exists({ _id: productId });
    if (!productExists) return this.error(404, "محصول پیدا نشد.");
    const variants = await Variant.find({ product: productId }).sort({
      createdAt: -1,
    });
    return this.response({ res, data: variants });
  }

  async createVariant(req: Request, res: Response) {
    const { productId } = req.params as { productId: string };
    const productExists = await Product.exists({ _id: productId });
    if (!productExists) return this.error(404, "محصول پیدا نشد.");

    const variant = await Variant.create({ ...req.body, product: productId });
    return this.response({
      res,
      status: 201,
      message: "واریانت ساخته شد.",
      data: variant,
    });
  }

  async updateVariant(req: Request, res: Response) {
    const { variantId } = req.params as { variantId: string };
    const variant = await Variant.findById(variantId);
    if (!variant) return this.error(404, "واریانت پیدا نشد.");

    Object.assign(variant, req.body);
    await variant.save();
    return this.response({
      res,
      message: "واریانت ویرایش شد.",
      data: variant,
    });
  }

  async deactivateVariant(req: Request, res: Response) {
    const { variantId } = req.params as { variantId: string };
    const variant = await Variant.findByIdAndUpdate(
      variantId,
      { $set: { isActive: false } },
      { new: true, runValidators: true },
    );
    if (!variant) return this.error(404, "واریانت پیدا نشد.");
    return this.response({
      res,
      message: "واریانت غیرفعال شد.",
      data: variant,
    });
  }
})();

export default adminController;
