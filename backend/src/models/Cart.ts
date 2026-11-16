import mongoose, { model, Schema, type Model, type Types } from "mongoose";

export interface ICartItem {
  variant: Types.ObjectId;
  quantity: number;
}

export interface ICart {
  user: Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    variant: {
      type: Schema.Types.ObjectId,
      ref: "Variant",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false },
);

const cartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true },
);

const Cart =
  (mongoose.models.Cart as Model<ICart> | undefined) ??
  model<ICart>("Cart", cartSchema);

export default Cart;
