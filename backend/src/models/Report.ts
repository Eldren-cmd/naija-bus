import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const pointSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
      default: "Point",
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: (coords: number[]) => Array.isArray(coords) && coords.length === 2,
        message: "Point coordinates must be [lng, lat]",
      },
    },
  },
  { _id: false },
);

const reportSchema = new Schema(
  {
    routeId: {
      type: Schema.Types.ObjectId,
      ref: "Route",
      required: false,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["traffic", "police", "roadblock", "accident", "hazard", "other"],
      required: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
      default: "medium",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    coords: {
      type: pointSchema,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

reportSchema.index({ coords: "2dsphere" });
reportSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

export type ReportDocument = InferSchemaType<typeof reportSchema>;

export const Report =
  (models.Report as Model<ReportDocument> | undefined) ||
  model<ReportDocument>("Report", reportSchema);
