import mongoose, { model, Schema, type Document, type Types } from "mongoose";

export interface IVariantDocument extends Document {
  product: Types.ObjectId;
  sku: string;
  attributes: Map<string, string>;
  price: number;
  compareAtPrice?: number;
  stock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const variantSchema = new Schema<IVariantDocument>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
    },
    attributes: {
      type: Map,
      of: String,
      default: {},
    },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0, default: undefined },
    stock: { type: Number, required: true, min: 0, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

variantSchema.index({ product: 1, isActive: 1 });

const Variant = mongoose.models.Variant || model("Variant", variantSchema);

export default Variant;
