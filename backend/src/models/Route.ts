import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const lineStringSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["LineString"],
      required: true,
      default: "LineString",
    },
    coordinates: {
      type: [[Number]],
      required: true,
      default: [],
    },
  },
  { _id: false },
);

const routeSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    origin: {
      type: String,
      required: true,
      trim: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    corridor: {
      type: String,
      trim: true,
      default: "",
    },
    aliases: {
      type: [String],
      default: [],
    },
    transportType: {
      type: String,
      enum: ["danfo", "brt", "keke", "bus", "ferry", "mixed"],
      default: "danfo",
    },
    baseFare: {
      type: Number,
      required: true,
      min: 0,
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5,
    },
    polyline: {
      type: lineStringSchema,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export type RouteDocument = InferSchemaType<typeof routeSchema>;

export const Route =
  (models.Route as Model<RouteDocument> | undefined) ||
  model<RouteDocument>("Route", routeSchema);
