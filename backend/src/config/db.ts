import mongoose from "mongoose";
import { Report, Route, Stop } from "../models";

export const connectToDatabase = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI is not defined");
  }

  await mongoose.connect(mongoUri);
};

export const getDatabaseStatus = (): "connected" | "disconnected" => {
  return mongoose.connection.readyState === 1 ? "connected" : "disconnected";
};

export const ensureCoreIndexes = async (): Promise<void> => {
  await Promise.all([Route.createIndexes(), Stop.createIndexes(), Report.createIndexes()]);
};
