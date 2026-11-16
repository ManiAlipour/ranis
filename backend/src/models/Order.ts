import mongoose, { model, Schema, type Model, type Types } from "mongoose";

export const orderStatuses = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export interface IOrderShippingAddress {
  recipientFirstName: string;
  recipientLastName: string;
  phoneNumber: string;
  province: string;
  city: string;
  addressLine: string;
  postalCode: string;
  plaque?: string;
  unit?: string;
}

export interface IOrderItem {
  product: Types.ObjectId;
  variant: Types.ObjectId;
  productName: string;
  sku: string;
  imageUrl?: string;
  attributes: Map<string, string>;
  quantity: number;
  unitPrice: number;
}

export interface IOrder {
  orderNumber: string;
  user: Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IOrderShippingAddress;
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  currency: string;
  status: OrderStatus;
  customerNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const shippingAddressSchema = new Schema<IOrderShippingAddress>(
  {
    recipientFirstName: { type: String, required: true, trim: true },
    recipientLastName: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    province: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    addressLine: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    plaque: { type: String, trim: true, default: undefined },
    unit: { type: String, trim: true, default: undefined },
  },
  { _id: false },
);

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variant: { type: Schema.Types.ObjectId, ref: "Variant", required: true },
    productName: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    imageUrl: { type: String, trim: true, default: undefined },
    attributes: { type: Map, of: String, default: {} },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, trim: true, unique: true },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [
        (items: unknown[]) => items.length > 0,
        "Order must contain at least one item",
      ],
    },
    shippingAddress: { type: shippingAddressSchema, required: true },
    subtotal: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, required: true, min: 0, default: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, trim: true, uppercase: true },
    status: { type: String, enum: orderStatuses, default: "pending", index: true },
    customerNote: { type: String, trim: true, default: undefined },
  },
  { timestamps: true },
);

orderSchema.index({ user: 1, createdAt: -1 });

const Order =
  (mongoose.models.Order as Model<IOrder> | undefined) ??
  model<IOrder>("Order", orderSchema);

export default Order;
