import type { RequestHandler } from "express";
import { z } from "zod";

const schema = z
  .object({
    addressId: z.string().regex(/^[\da-f]{24}$/i),
    customerNote: z.string().trim().max(1000).optional(),
  })
  .strict();

const validateCheckout: RequestHandler = (req, _res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) return next(result.error);
  req.body = result.data;
  next();
};

export default validateCheckout;
