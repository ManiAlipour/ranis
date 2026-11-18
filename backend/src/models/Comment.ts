import mongoose, { model, Schema, type Model, type Types } from "mongoose";

export const commentStatuses = ["pending", "approved", "rejected"] as const;
export type CommentStatus = (typeof commentStatuses)[number];

export interface IComment {
  user: Types.ObjectId;
  product: Types.ObjectId;
  rating: number;
  title?: string;
  body: string;
  status: CommentStatus;
  isVerifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, default: undefined },
    body: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: commentStatuses,
      default: "pending",
      index: true,
    },
    isVerifiedPurchase: { type: Boolean, default: false },
  },
  { timestamps: true },
);

commentSchema.index({ product: 1, status: 1, createdAt: -1 });
commentSchema.index({ user: 1, product: 1 }, { unique: true });

const Comment =
  (mongoose.models.Comment as Model<IComment> | undefined) ??
  model<IComment>("Comment", commentSchema);

export default Comment;
