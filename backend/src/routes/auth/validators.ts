import type { RequestHandler } from "express";
import { z } from "zod";

const iranianMobileSchema = z
  .string()
  .trim()
  .transform((value) =>
    value
      .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
      .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
      .replace(/[\s()-]/g, ""),
  )
  .transform((value) => {
    if (value.startsWith("+98")) return `0${value.slice(3)}`;
    if (value.startsWith("0098")) return `0${value.slice(4)}`;
    if (value.startsWith("98")) return `0${value.slice(2)}`;
    return value;
  })
  .pipe(z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر نیست"));

const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{4,8}$/, "کد باید بین ۴ تا ۸ رقم باشد");

export const registerBodySchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, "نام باید حداقل ۲ حرف باشد.")
      .max(50, "نام نمی‌تواند بیشتر از ۵۰ حرف باشد."),
    lastName: z
      .string()
      .trim()
      .max(50, "نام خانوادگی نمی‌تواند بیشتر از ۵۰ حرف باشد.")
      .optional(),
    phoneNumber: iranianMobileSchema,
  });

export const requestLoginCodeBodySchema = z
  .object({ phoneNumber: iranianMobileSchema });

export const verifyLoginCodeBodySchema = z
  .object({ phoneNumber: iranianMobileSchema, code: otpSchema });

export const verifyPhoneBodySchema = z
  .object({ phoneNumber: iranianMobileSchema, code: otpSchema });

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type RequestLoginCodeBody = z.infer<typeof requestLoginCodeBodySchema>;
export type VerifyLoginCodeBody = z.infer<typeof verifyLoginCodeBodySchema>;
export type VerifyPhoneBody = z.infer<typeof verifyPhoneBodySchema>;

/** Validate and normalize req.body before it reaches the controller. */
export const validateBody =
  <T extends z.ZodType>(schema: T): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(result.error);
      return;
    }

    req.body = result.data;
    next();
  };
