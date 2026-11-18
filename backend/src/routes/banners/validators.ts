import type { RequestHandler } from "express";
import { z } from "zod";

export const publicBannerQuerySchema = z.object({
  placement: z.string().trim().min(1).max(80).optional(),
});

export const bannerParamsSchema = z.object({
  bannerId: z.string().regex(/^[\da-f]{24}$/i),
});

const bannerFields = {
  title: z.string().trim().min(2).max(160),
  subtitle: z.string().trim().max(300).optional(),
  imageUrl: z.string().trim().min(1).max(2048),
  linkUrl: z.string().trim().max(2048).optional(),
  placement: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[\w-]+$/),
  isActive: z.boolean(),
  sortOrder: z.number().int().min(-10000).max(10000),
  startsAt: z.iso.datetime().optional(),
  endsAt: z.iso.datetime().optional(),
};

const dateRangeIsValid = (value: { startsAt?: string; endsAt?: string }) =>
  !value.startsAt ||
  !value.endsAt ||
  Date.parse(value.startsAt) < Date.parse(value.endsAt);

export const createBannerBodySchema = z
  .object({
    ...bannerFields,
    isActive: bannerFields.isActive.default(true),
    sortOrder: bannerFields.sortOrder.default(0),
  })
  .strict()
  .refine(dateRangeIsValid, {
    message: "تاریخ پایان باید بعد از تاریخ شروع باشد.",
  });

export const updateBannerBodySchema = z
  .object(bannerFields)
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0)
  .refine(dateRangeIsValid, {
    message: "تاریخ پایان باید بعد از تاریخ شروع باشد.",
  });

export const adminBannerQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  placement: z.string().trim().min(1).max(80).optional(),
  active: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

export const validateBanner =
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
