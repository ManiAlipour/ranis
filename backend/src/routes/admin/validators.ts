import type { RequestHandler } from "express";
import { z } from "zod";

const objectIdSchema = z.string().regex(/^[\da-f]{24}$/i);
const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u)
  .transform((slug) => slug.toLowerCase());

const productFields = {
  name: z.string().trim().min(2).max(160),
  slug: slugSchema,
  description: z.string().trim().min(1).max(20_000),
  category: objectIdSchema,
  images: z.array(z.string().trim().min(1).max(2_048)).max(20),
  tags: z.array(z.string().trim().min(1).max(50)).max(50),
  status: z.enum(["draft", "active", "archived"]),
};

export const createProductBodySchema = z
  .object({
    ...productFields,
    images: productFields.images.default([]),
    tags: productFields.tags.default([]),
    status: productFields.status.default("draft"),
  })
  .strict();

export const updateProductBodySchema = z
  .object(productFields)
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0);

const categoryFields = {
  name: z.string().trim().min(2).max(120),
  slug: slugSchema,
  description: z.string().trim().max(2_000).optional(),
  imageUrl: z.string().trim().max(2_048).optional(),
  parent: objectIdSchema.nullable().optional(),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(-10_000).max(10_000),
};

export const createCategoryBodySchema = z
  .object({
    ...categoryFields,
    isActive: categoryFields.isActive.default(true),
    sortOrder: categoryFields.sortOrder.default(0),
  })
  .strict();

export const updateCategoryBodySchema = z
  .object(categoryFields)
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0);

const variantFields = {
  sku: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .transform((sku) => sku.toUpperCase()),
  attributes: z.record(z.string().trim().min(1), z.string().trim().max(100)),
  price: z.number().finite().min(0),
  compareAtPrice: z.number().finite().min(0).optional(),
  stock: z.number().int().min(0),
  isActive: z.boolean(),
};

export const createVariantBodySchema = z
  .object({
    ...variantFields,
    attributes: variantFields.attributes.default({}),
    stock: variantFields.stock.default(0),
    isActive: variantFields.isActive.default(true),
  })
  .strict();

export const updateVariantBodySchema = z
  .object(variantFields)
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0);

export const adminListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).max(100).optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  category: objectIdSchema.optional(),
});

export const adminCategoryListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(100),
  active: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

export const idParamsSchema = z.object({ id: objectIdSchema });
export const productParamsSchema = z.object({ productId: objectIdSchema });
export const variantParamsSchema = z.object({ variantId: objectIdSchema });

const validate =
  <T extends z.ZodType>(
    schema: T,
    source: "body" | "query" | "params",
  ): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(result.error);
      return;
    }
    if (source === "body") req.body = result.data;
    else
      res.locals[source === "query" ? "validatedQuery" : "validatedParams"] =
        result.data;
    next();
  };

export const validateBody = <T extends z.ZodType>(schema: T): RequestHandler =>
  validate(schema, "body");
export const validateQuery = <T extends z.ZodType>(schema: T): RequestHandler =>
  validate(schema, "query");
export const validateParams = <T extends z.ZodType>(
  schema: T,
): RequestHandler => validate(schema, "params");
