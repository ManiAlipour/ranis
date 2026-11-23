import type { RequestHandler } from "express";
import { orderStatuses } from "../../../models/Order";
import { z } from "zod";

export const orderListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(orderStatuses).optional(),
  search: z.string().trim().min(1).max(80).optional(),
});

export const orderParamsSchema = z.object({
  orderId: z.string().regex(/^[\da-f]{24}$/i),
});

export const updateOrderStatusBodySchema = z
  .object({ status: z.enum(orderStatuses) })
  .strict();

export const validateOrder =
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
