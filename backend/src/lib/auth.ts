import jwt from "jsonwebtoken";
import { AppUserRole } from "../types/auth";

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: AppUserRole;
};

const isAppUserRole = (value: unknown): value is AppUserRole =>
  value === "user" || value === "champion" || value === "conductor" || value === "admin";

export const signAccessToken = (payload: AccessTokenPayload): string => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = (process.env.JWT_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"];

  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }

  return jwt.sign(payload, secret, { expiresIn });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }

  const decoded = jwt.verify(token, secret);
  if (typeof decoded === "string") {
    throw new Error("Invalid token payload");
  }

  const { sub, email, role } = decoded;
  if (typeof sub !== "string" || typeof email !== "string" || !isAppUserRole(role)) {
    throw new Error("Invalid token claims");
  }

  return { sub, email, role };
};
