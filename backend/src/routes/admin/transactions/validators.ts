import type { RequestHandler } from "express";
import { transactionStatuses } from "@models/Transaction";
import { z } from "zod";

export const adminTransactionListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(transactionStatuses).optional(),
  provider: z.string().trim().min(1).max(80).optional(),
});

export const adminTransactionParamsSchema = z.object({
  transactionId: z.string().regex(/^[\da-f]{24}$/i),
});

export const validateAdminTransaction =
  <T extends z.ZodType>(
    schema: T,
    source: "query" | "params",
  ): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) return next(result.error);
    res.locals[source === "query" ? "validatedQuery" : "validatedParams"] =
      result.data;
    next();
  };
