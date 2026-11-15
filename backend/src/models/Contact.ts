import mongoose, { model, Schema, type Document } from "mongoose";

export const contactStatuses = [
  "new",
  "in_progress",
  "resolved",
  "closed",
] as const;
export type ContactStatus = (typeof contactStatuses)[number];

export interface IContactDocument extends Document {
  firstName: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
  subject: string;
  message: string;
  status: ContactStatus;
  createdAt: Date;
  updatedAt: Date;
}

const contactSchema = new Schema<IContactDocument>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true, default: undefined },
    phoneNumber: { type: String, trim: true, default: undefined },
    email: { type: String, trim: true, lowercase: true, default: undefined },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: contactStatuses,
      default: "new",
      index: true,
    },
  },
  { timestamps: true },
);

const Contact = mongoose.models.Contact || model("Contact", contactSchema);

export default Contact;
