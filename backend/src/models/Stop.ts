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

const stopSchema = new Schema(
  {
    routeId: {
      type: Schema.Types.ObjectId,
      ref: "Route",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      required: true,
      min: 0,
    },
    isMajor: {
      type: Boolean,
      default: false,
    },
    coords: {
      type: pointSchema,
      required: true,
    },
  },
  { timestamps: true },
);

export type StopDocument = InferSchemaType<typeof stopSchema>;

export const Stop =
  (models.Stop as Model<StopDocument> | undefined) ||
  model<StopDocument>("Stop", stopSchema);
