import mongoose, { model, Schema, type Model, type Types } from "mongoose";

export const transactionStatuses = [
  "pending",
  "succeeded",
  "failed",
  "refunded",
] as const;
export type TransactionStatus = (typeof transactionStatuses)[number];

export interface ITransaction {
  order: Types.ObjectId;
  user: Types.ObjectId;
  amount: number;
  currency: string;
  provider: string;
  providerTransactionId?: string;
  status: TransactionStatus;
  failureReason?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, trim: true, uppercase: true },
    provider: { type: String, required: true, trim: true },
    providerTransactionId: { type: String, trim: true, default: undefined },
    status: {
      type: String,
      enum: transactionStatuses,
      default: "pending",
      index: true,
    },
    failureReason: { type: String, trim: true, default: undefined },
    paidAt: { type: Date, default: undefined },
  },
  { timestamps: true },
);

transactionSchema.index(
  { provider: 1, providerTransactionId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      providerTransactionId: { $type: "string" },
    },
  },
);

const Transaction =
  (mongoose.models.Transaction as Model<ITransaction> | undefined) ??
  model<ITransaction>("Transaction", transactionSchema);

export default Transaction;
