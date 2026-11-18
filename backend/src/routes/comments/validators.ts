import type { RequestHandler } from "express";
import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u)
  .transform((slug) => slug.toLowerCase());

export const productSlugParamsSchema = z.object({ productSlug: slugSchema });
export const commentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export const createCommentBodySchema = z
  .object({
    rating: z.number().int().min(1).max(5),
    title: z.string().trim().min(2).max(160).optional(),
    body: z.string().trim().min(3).max(5000),
  })
  .strict();

export const validate =
  <T extends z.ZodType>(
    schema: T,
    source: "body" | "query" | "params",
  ): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) return next(result.error);
    if (source === "body") req.body = result.data;
    else
      res.locals[source === "query" ? "validatedQuery" : "validatedParams"] =
        result.data;
    next();
  };
