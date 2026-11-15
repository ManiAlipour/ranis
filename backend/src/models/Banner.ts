import mongoose, { model, Schema, type Document } from "mongoose";

export interface IBannerDocument extends Document {
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  placement: string;
  isActive: boolean;
  sortOrder: number;
  startsAt?: Date;
  endsAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const bannerSchema = new Schema<IBannerDocument>(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true, default: undefined },
    imageUrl: { type: String, required: true, trim: true },
    linkUrl: { type: String, trim: true, default: undefined },
    placement: { type: String, required: true, trim: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
    startsAt: { type: Date, default: undefined },
    endsAt: { type: Date, default: undefined },
  },
  { timestamps: true },
);

bannerSchema.index({ placement: 1, isActive: 1, sortOrder: 1 });

const Banner = mongoose.models.Banner || model("Banner", bannerSchema);

export default Banner;
