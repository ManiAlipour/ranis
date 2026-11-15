import mongoose, { model, Schema, type Document, type Types } from "mongoose";

export interface IUserDocument extends Document {
  firstName: string;
  lastName?: string;
  phoneNumber: string;
  password?: string;
  address: Types.ObjectId[];
  isActive: boolean;
  role: "user" | "admin" | "owner";
  createdAt: Date;
  updatedAt: Date;

  passwordReset?: {
    tokenHash: string;
    expiresAt: Date;
  };

  verifyPhone?: {
    codeHash: string;
    codeExpireAt: Date;
    attempts: number;
  };

  isVerifiedPhone: boolean;

  loginWithCode?: {
    codeHash: string;
    codeExpireAt: Date;
    attempts: number;
  };
}

const userSchema = new Schema<IUserDocument>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, default: "" },

    phoneNumber: { type: String, required: true, unique: true, index: true },
    password: { type: String, default: undefined },

    address: [{ type: Schema.ObjectId, ref: "Address" }],

    isActive: { type: Boolean, default: true },

    role: { type: String, enum: ["user", "admin", "owner"], default: "user" },

    passwordReset: {
      type: {
        tokenHash: { type: String, required: true },
        expiresAt: { type: Date, required: true },
      },
      required: false,
      default: undefined,
    },

    verifyPhone: {
      type: {
        codeHash: { type: String, required: true },
        codeExpireAt: { type: Date, required: true },
        attempts: { type: Number, required: true, default: 0 },
      },
      required: false,
      default: undefined,
    },

    isVerifiedPhone: { type: Boolean, default: false },

    loginWithCode: {
      type: {
        codeHash: { type: String, required: true },
        codeExpireAt: { type: Date, required: true },
        attempts: { type: Number, required: true, default: 0 },
      },
      required: false,
      default: undefined,
    },
  },
  { timestamps: true },
);

const User = mongoose.models.User || model("User", userSchema);

export default User;
