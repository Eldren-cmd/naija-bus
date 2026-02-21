import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const fareSchema = new Schema(
  {
    routeId: {
      type: Schema.Types.ObjectId,
      ref: "Route",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "NGN",
      trim: true,
      uppercase: true,
    },
    source: {
      type: String,
      enum: ["system", "user_report", "admin_update"],
      default: "user_report",
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5,
    },
    trafficLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true },
);

export type FareDocument = InferSchemaType<typeof fareSchema>;

export const Fare =
  (models.Fare as Model<FareDocument> | undefined) ||
  model<FareDocument>("Fare", fareSchema);
