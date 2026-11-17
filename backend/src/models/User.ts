import mongoose, { model, Schema, type Model, type Types } from "mongoose";

export interface IUser {
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
    codeSentAt?: Date;
    attempts: number;
  };

  isVerifiedPhone: boolean;

  loginWithCode?: {
    codeHash: string;
    codeExpireAt: Date;
    codeSentAt?: Date;
    attempts: number;
  };

  authSessions: {
    tokenHash: string;
    expiresAt: Date;
  }[];
}

const authSessionSchema = new Schema(
  {
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { _id: false },
);

const userSchema = new Schema<IUser>(
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
        codeSentAt: { type: Date, required: false },
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
        codeSentAt: { type: Date, required: false },
        attempts: { type: Number, required: true, default: 0 },
      },
      required: false,
      default: undefined,
    },

    authSessions: { type: [authSessionSchema], default: [] },
  },
  { timestamps: true },
);

const User =
  (mongoose.models.User as Model<IUser> | undefined) ??
  model<IUser>("User", userSchema);

export default User;
