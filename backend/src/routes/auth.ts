import bcrypt from "bcryptjs";
import { Request, Response, Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { User } from "../models";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/auth";
import { AppUserRole } from "../types/auth";
import { validateLoginBody, validateRegisterBody } from "../validation/requestSchemas";

const authRouter = Router();
const REFRESH_TOKEN_COOKIE_NAME = process.env.REFRESH_TOKEN_COOKIE_NAME || "naija_refresh_token";
const REFRESH_COOKIE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;
const REFRESH_COOKIE_SECURE = process.env.NODE_ENV === "production";

const sanitizeUser = (user: {
  _id: unknown;
  fullName: string;
  email: string;
  role: AppUserRole;
}) => ({
  id: String(user._id),
  fullName: user.fullName,
  email: user.email,
  role: user.role,
});

const setRefreshCookie = (res: Response, refreshToken: string) => {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: REFRESH_COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  });
};

authRouter.post("/register", async (req: Request, res: Response) => {
  try {
    const validated = validateRegisterBody(req.body);
    if (!validated.success) {
      return res.status(400).json({ error: validated.error });
    }

    const { fullName, email, password } = validated.data;

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return res.status(409).json({ error: "email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const created = await User.create({
      fullName,
      email,
      passwordHash,
      role: "user",
      isActive: true,
      savedRoutes: [],
      lastLoginAt: new Date(),
    });

    const token = signAccessToken({
      sub: String(created._id),
      email: created.email,
      role: created.role,
    });
    const refreshToken = signRefreshToken({
      sub: String(created._id),
      email: created.email,
      role: created.role,
    });
    setRefreshCookie(res, refreshToken);

    return res.status(201).json({ token, accessToken: token, user: sanitizeUser(created) });
  } catch (error) {
    return res.status(500).json({ error: "failed to register user" });
  }
});

authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const validated = validateLoginBody(req.body);
    if (!validated.success) {
      return res.status(400).json({ error: validated.error });
    }

    const { email, password } = validated.data;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "invalid email or password" });
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
      return res.status(401).json({ error: "invalid email or password" });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = signAccessToken({
      sub: String(user._id),
      email: user.email,
      role: user.role,
    });
    const refreshToken = signRefreshToken({
      sub: String(user._id),
      email: user.email,
      role: user.role,
    });
    setRefreshCookie(res, refreshToken);

    return res.status(200).json({ token: accessToken, accessToken, user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ error: "failed to login user" });
  }
});

authRouter.post("/refresh", async (req: Request, res: Response) => {
  try {
    const refreshTokenRaw = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
    const refreshToken = typeof refreshTokenRaw === "string" ? refreshTokenRaw.trim() : "";
    if (!refreshToken) {
      return res.status(401).json({ error: "refresh token missing" });
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ error: "invalid refresh token" });
    }

    const user = await User.findById(payload.sub).select("_id fullName email role isActive");
    if (!user || user.isActive === false) {
      return res.status(401).json({ error: "user not found or inactive" });
    }

    const accessToken = signAccessToken({
      sub: String(user._id),
      email: user.email,
      role: user.role,
    });
    const nextRefreshToken = signRefreshToken({
      sub: String(user._id),
      email: user.email,
      role: user.role,
    });
    setRefreshCookie(res, nextRefreshToken);

    return res.status(200).json({ token: accessToken, accessToken, user: sanitizeUser(user) });
  } catch {
    return res.status(500).json({ error: "failed to refresh token" });
  }
});

authRouter.get("/me", authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "authentication required" });
    }

    const user = await User.findById(req.user.id).select("_id fullName email role");
    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    return res.status(200).json({ user: sanitizeUser(user) });
  } catch (_error) {
    return res.status(500).json({ error: "failed to fetch profile" });
  }
});

export { authRouter };
