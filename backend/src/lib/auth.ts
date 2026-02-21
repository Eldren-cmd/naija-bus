import jwt from "jsonwebtoken";
import { AppUserRole } from "../types/auth";

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: AppUserRole;
};

export type RefreshTokenPayload = AccessTokenPayload;

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

export const signRefreshToken = (payload: RefreshTokenPayload): string => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  const expiresIn = (process.env.JWT_REFRESH_EXPIRES_IN || "30d") as jwt.SignOptions["expiresIn"];

  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }

  return jwt.sign(payload, secret, { expiresIn });
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
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
