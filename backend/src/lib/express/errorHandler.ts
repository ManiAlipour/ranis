import type { ErrorRequestHandler } from "express";
import mongoose from "mongoose";
import { ZodError, type ZodIssue } from "zod";

const fieldLabels: Record<string, string> = {
  firstName: "نام",
  lastName: "نام خانوادگی",
  phoneNumber: "شماره موبایل",
  code: "کد تأیید",
};

const getFieldLabel = (path: PropertyKey[]): string => {
  const field = path.map(String).join(".");
  return (fieldLabels[field] ?? field) || "بدنهٔ درخواست";
};

const formatZodIssue = (issue: ZodIssue) => {
  if (issue.code === "unrecognized_keys") {
    return issue.keys.map((key) => ({
      field: key,
      message: `فیلد ${key} در این درخواست پشتیبانی نمی‌شود.`,
    }));
  }

  const field = getFieldLabel(issue.path);
  let message = issue.message;

  if (issue.code === "invalid_type") {
    message =
      issue.input === undefined
        ? `وارد کردن ${field} الزامی است.`
        : `مقدار ${field} باید متن باشد.`;
  }

  return [{ field: issue.path.map(String).join(".") || "body", message }];
};

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
    Error.captureStackTrace(this, HttpError);
  }
}

const isHttpError = (error: unknown): error is HttpError =>
  error instanceof HttpError;

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  let statusCode = 500;
  let message = "خطای داخلی سرور رخ داده است.";
  let errors: { field: string; message: string }[] | undefined;

  if (isHttpError(error)) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = "اطلاعات واردشده معتبر نیست.";
    errors = error.issues.flatMap(formatZodIssue);
  } else if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = "اطلاعات واردشده معتبر نیست.";
    errors = Object.values(error.errors).map((issue) => ({
      field: issue.path,
      message: `${fieldLabels[issue.path] ?? issue.path} معتبر نیست.`,
    }));
  } else if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `مقدار واردشده برای ${fieldLabels[error.path] ?? error.path} معتبر نیست.`;
  } else if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  ) {
    statusCode = 409;
    message = "رکوردی با این مقدار از قبل وجود دارد.";
  }

  if (statusCode >= 500) {
    message = "خطای داخلی سرور رخ داده است.";
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
    ...(process.env.NODE_ENV === "development" && error instanceof Error
      ? { stack: error.stack }
      : {}),
  });
};

export default errorHandler;
