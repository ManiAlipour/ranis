import type { RequestHandler } from "express";
import { z } from "zod";

export const uploadPurposeQuerySchema = z.object({
  purpose: z.enum(["products", "banners"]).default("products"),
});

export const validateUploadPurpose: RequestHandler = (req, res, next) => {
  const result = uploadPurposeQuerySchema.safeParse(req.query);
  if (!result.success) return next(result.error);
  res.locals.validatedQuery = result.data;
  next();
};
