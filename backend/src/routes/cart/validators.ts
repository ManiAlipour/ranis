import type { RequestHandler } from "express";
import { z } from "zod";

const objectIdSchema = z.string().regex(/^[\da-f]{24}$/i);

export const addItemBodySchema = z
  .object({
    variantId: objectIdSchema,
    quantity: z.coerce.number().int().min(1).max(100).default(1),
  })
  .strict();

export const updateItemBodySchema = z
  .object({ quantity: z.coerce.number().int().min(1).max(100) })
  .strict();

export const variantParamsSchema = z.object({ variantId: objectIdSchema });

export const validateBody =
  <T extends z.ZodType>(schema: T): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) return next(result.error);
    req.body = result.data;
    next();
  };

export const validateParams =
  <T extends z.ZodType>(schema: T): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) return next(result.error);
    req.params = result.data as typeof req.params;
    next();
  };
