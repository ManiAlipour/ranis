import type { RequestHandler } from "express";
import { z } from "zod";

export const adminUserListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).max(100).optional(),
  role: z.enum(["user", "admin", "owner"]).optional(),
  active: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
});

export const adminUserParamsSchema = z.object({
  userId: z.string().regex(/^[\da-f]{24}$/i),
});

export const updateUserActiveBodySchema = z
  .object({ isActive: z.boolean() })
  .strict();

export const updateUserRoleBodySchema = z
  .object({ role: z.enum(["user", "admin"]) })
  .strict();

export const validateAdminUser =
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
