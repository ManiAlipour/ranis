import mongoose, { model, Schema, type Document } from "mongoose";

export interface IAddressDocument extends Document {
  recipientFirstName: string;
  recipientLastName: string;
  phoneNumber: string;
  province: string;
  city: string;
  addressLine: string;
  postalCode: string;
  plaque?: string;
  unit?: string;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddressDocument>(
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
  { timestamps: true },
);

const Address = mongoose.models.Address || model("Address", addressSchema);

export default Address;
