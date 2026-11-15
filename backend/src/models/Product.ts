import mongoose, { model, Schema, type Document, type Types } from "mongoose";

export const productStatuses = ["draft", "active", "archived"] as const;
export type ProductStatus = (typeof productStatuses)[number];

export interface IProductDocument extends Document {
  name: string;
  slug: string;
  description: string;
  category: Types.ObjectId;
  images: string[];
  tags: string[];
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProductDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    description: { type: String, required: true, trim: true },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    images: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    status: {
      type: String,
      enum: productStatuses,
      default: "draft",
      index: true,
    },
  },
  { timestamps: true },
);

productSchema.index({ name: "text", description: "text", tags: "text" });

const Product = mongoose.models.Product || model("Product", productSchema);

export default Product;
