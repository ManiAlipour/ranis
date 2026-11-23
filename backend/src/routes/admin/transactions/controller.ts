import Transaction, {
  type TransactionStatus,
} from "../../../models/Transaction";
import Controller from "../../../utils/baseController";
import type { Request, Response } from "express";

const controller = new (class extends Controller {
  async list(_req: Request, res: Response) {
    const query = res.locals.validatedQuery as {
      page: number;
      limit: number;
      status?: TransactionStatus;
      provider?: string;
    };
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.provider) filter.provider = query.provider;
    const [items, total] = await Promise.all([
      Transaction.find(filter as never)
        .populate("user", "firstName lastName phoneNumber")
        .populate("order", "orderNumber status total currency")
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit),
      Transaction.countDocuments(filter as never),
    ]);
    return this.response({
      res,
      data: {
        items,
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    });
  }

  async get(req: Request, res: Response) {
    const { transactionId } = res.locals.validatedParams as {
      transactionId: string;
    };
    const transaction = await Transaction.findById(transactionId)
      .populate("user", "firstName lastName phoneNumber")
      .populate("order", "orderNumber status items total currency createdAt");
    if (!transaction) return this.error(404, "تراکنش پیدا نشد.");
    return this.response({ res, data: transaction });
  }
})();

export default controller;
