import jwt from "jsonwebtoken";

type JwtPayload = {
  sub: string;
  email: string;
  role: "user" | "champion" | "conductor" | "admin";
};

export const signAccessToken = (payload: JwtPayload): string => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = (process.env.JWT_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"];

  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }

  return jwt.sign(payload, secret, { expiresIn });
};
