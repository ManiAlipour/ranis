import mongoose, { model, Schema, type Model, type Types } from "mongoose";

export interface ICategory {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parent?: Types.ObjectId;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    description: { type: String, trim: true, default: undefined },
    imageUrl: { type: String, trim: true, default: undefined },
    parent: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: undefined,
      index: true,
    },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const Category =
  (mongoose.models.Category as Model<ICategory> | undefined) ??
  model<ICategory>("Category", categorySchema);

export default Category;
