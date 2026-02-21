import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/auth";
import { User } from "../models";
import { AppUserRole } from "../types/auth";

const readBearerToken = (headerValue?: string): string | null => {
  if (!headerValue) return null;
  const [scheme, token] = headerValue.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token.trim();
};

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = readBearerToken(req.header("authorization"));
  if (!token) {
    return res.status(401).json({ error: "missing or invalid authorization header" });
  }

  try {
    const claims = verifyAccessToken(token);
    const user = await User.findById(claims.sub).select("_id email role isActive").lean();

    if (!user || user.isActive === false) {
      return res.status(401).json({ error: "user not found or inactive" });
    }

    req.user = {
      id: String(user._id),
      email: user.email,
      role: user.role,
    };

    return next();
  } catch (_error) {
    return res.status(401).json({ error: "invalid or expired token" });
  }
};

export const requireRoles =
  (roles: AppUserRole[]) => (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "authentication required" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "forbidden" });
    }
    return next();
  };
