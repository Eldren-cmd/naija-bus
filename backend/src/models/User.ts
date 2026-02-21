import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "champion", "conductor", "admin"],
      default: "user",
    },
    phone: {
      type: String,
      trim: true,
      required: false,
      unique: true,
      sparse: true,
    },
    source: {
      type: String,
      enum: ["app", "web", "whatsapp", "ussd", "bot"],
      default: "app",
    },
    championRoutes: {
      type: [{ type: Schema.Types.ObjectId, ref: "Route" }],
      default: [],
    },
    reportCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    streak: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastReportDate: {
      type: Date,
      required: false,
    },
    airtimeEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    badges: {
      type: [String],
      default: [],
    },
    referralCode: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },
    referredBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    referralPaid: {
      type: Boolean,
      default: false,
    },
    conductorToken: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      trim: true,
    },
    savedRoutes: {
      type: [{ type: Schema.Types.ObjectId, ref: "Route" }],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      required: false,
    },
  },
  { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof userSchema>;

export const User =
  (models.User as Model<UserDocument> | undefined) ||
  model<UserDocument>("User", userSchema);
