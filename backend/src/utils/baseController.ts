import { HttpError } from "@lib/express/errorHandler";
import autoBind from "auto-bind";
import type { Response } from "express";

interface IResponse {
  res: Response;
  message?: string;
  status?: number;
  data?: unknown;
}

class Controller {
  constructor() {
    autoBind(this);
  }

  protected error(statusCode: number, message: string): never {
    throw new HttpError(statusCode, message);
  }

  protected response({
    res,
    status = 200,
    message = "عملیات با موفقیت انجام شد.",
    data = undefined,
  }: IResponse) {
    return res.status(status).json({ data, message });
  }
}

export default Controller;
