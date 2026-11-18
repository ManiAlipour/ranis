import type { RequestHandler } from "express";
import { z } from "zod";

export const commentParamsSchema = z.object({
  commentId: z.string().regex(/^[\da-f]{24}$/i),
});
export const adminCommentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
});
export const updateCommentStatusSchema = z
  .object({ status: z.enum(["pending", "approved", "rejected"]) })
  .strict();

export const validateAdminComment =
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
