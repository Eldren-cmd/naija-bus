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

const checkpointSchema = new Schema(
  {
    coords: {
      type: pointSchema,
      required: true,
    },
    recordedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { _id: false },
);

const tripRecordSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    routeId: {
      type: Schema.Types.ObjectId,
      ref: "Route",
      required: false,
    },
    checkpoints: {
      type: [checkpointSchema],
      default: [],
    },
    polyline: {
      type: lineStringSchema,
      required: true,
    },
    distanceMeters: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    durationSeconds: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    startedAt: {
      type: Date,
      required: true,
    },
    endedAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

export type TripRecordDocument = InferSchemaType<typeof tripRecordSchema>;

export const TripRecord =
  (models.TripRecord as Model<TripRecordDocument> | undefined) ||
  model<TripRecordDocument>("TripRecord", tripRecordSchema);
