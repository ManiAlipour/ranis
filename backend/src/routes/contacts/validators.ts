import type { RequestHandler } from "express";
import { z } from "zod";

export const createContactBodySchema = z
  .object({
    firstName: z.string().trim().min(2).max(80),
    lastName: z.string().trim().max(80).optional(),
    phoneNumber: z.string().trim().min(8).max(20).optional(),
    email: z.email().trim().max(254).optional(),
    subject: z.string().trim().min(2).max(160),
    message: z.string().trim().min(10).max(5000),
  })
  .strict()
  .refine((value) => value.phoneNumber || value.email, {
    message: "شماره تماس یا ایمیل را وارد کنید.",
    path: ["phoneNumber"],
  });

export const contactParamsSchema = z.object({
  contactId: z.string().regex(/^[\da-f]{24}$/i),
});

export const contactListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["new", "in_progress", "resolved", "closed"]).optional(),
});

export const updateContactStatusBodySchema = z
  .object({
    status: z.enum(["new", "in_progress", "resolved", "closed"]),
  })
  .strict();

export const validateContact =
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
