import type { RequestHandler } from "express";
import { z } from "zod";

export const productListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().min(1).max(100).optional(),
    category: z.string().trim().min(1).max(160).optional(),
    tag: z.string().trim().min(1).max(50).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    inStock: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),
    sort: z.enum(["newest", "price_asc", "price_desc"]).default("newest"),
  })
  .refine(
    ({ minPrice, maxPrice }) =>
      minPrice === undefined || maxPrice === undefined || minPrice <= maxPrice,
    { message: "حداقل قیمت نباید از حداکثر قیمت بیشتر باشد." },
  );

export const slugParamsSchema = z.object({
  slug: z.string().trim().min(1).max(160),
});

const validate =
  <T extends z.ZodType>(
    schema: T,
    source: "query" | "params",
  ): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(result.error);
      return;
    }
    res.locals[source === "query" ? "validatedQuery" : "validatedParams"] =
      result.data;
    next();
  };

export const validateQuery = <T extends z.ZodType>(schema: T): RequestHandler =>
  validate(schema, "query");

export const validateParams = <T extends z.ZodType>(
  schema: T,
): RequestHandler => validate(schema, "params");
