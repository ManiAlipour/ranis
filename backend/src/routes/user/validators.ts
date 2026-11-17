import type { RequestHandler } from "express";
import { z } from "zod";

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const objectIdSchema = z.string().regex(/^[\da-f]{24}$/i, "شناسه معتبر نیست.");

export const updateProfileBodySchema = z
  .object({
    firstName: z.string().trim().min(2).max(50).optional(),
    lastName: z.string().trim().max(50).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "حداقل یک فیلد برای ویرایش ارسال کنید.",
  });

export const addressBodySchema = z
  .object({
    recipientFirstName: z.string().trim().min(2).max(50),
    recipientLastName: z.string().trim().min(2).max(50),
    phoneNumber: z.string().trim().min(8).max(20),
    province: z.string().trim().min(2).max(80),
    city: z.string().trim().min(2).max(80),
    addressLine: z.string().trim().min(5).max(500),
    postalCode: z
      .string()
      .trim()
      .regex(/^\d{10}$/),
    plaque: z.string().trim().max(20).optional(),
    unit: z.string().trim().max(20).optional(),
  })
  .strict();

export const updateAddressBodySchema = addressBodySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "حداقل یک فیلد برای ویرایش ارسال کنید.",
  });

export const paginationQuerySchema = paginationSchema;
export const addressParamsSchema = z.object({ addressId: objectIdSchema });
export const orderParamsSchema = z.object({ orderId: objectIdSchema });

const createValidator =
  <T extends z.ZodType>(
    schema: T,
    source: "body" | "query" | "params",
  ): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(result.error);
      return;
    }

    if (source === "body") req.body = result.data;
    next();
  };

export const validateBody = <T extends z.ZodType>(schema: T): RequestHandler =>
  createValidator(schema, "body");

export const validateQuery = <T extends z.ZodType>(schema: T): RequestHandler =>
  createValidator(schema, "query");

export const validateParams = <T extends z.ZodType>(
  schema: T,
): RequestHandler => createValidator(schema, "params");
