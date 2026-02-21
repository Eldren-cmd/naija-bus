import bcrypt from "bcryptjs";
import { Request, Response, Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { User } from "../models";
import { signAccessToken } from "../lib/auth";
import { AppUserRole } from "../types/auth";

const authRouter = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

authRouter.post("/register", async (req: Request, res: Response) => {
  try {
    const { fullName, email, password } = req.body ?? {};

    if (
      typeof fullName !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({ error: "fullName, email, and password are required" });
    }

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      return res.status(400).json({ error: "fullName cannot be empty" });
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ error: "email is invalid" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "password must be at least 8 characters" });
    }

    const existing = await User.findOne({ email: cleanEmail }).lean();
    if (existing) {
      return res.status(409).json({ error: "email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const created = await User.create({
      fullName: cleanName,
      email: cleanEmail,
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

    return res.status(201).json({ token, user: sanitizeUser(created) });
  } catch (error) {
    return res.status(500).json({ error: "failed to register user" });
  }
});

authRouter.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body ?? {};

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "email and password are required" });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({ error: "invalid email or password" });
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
      return res.status(401).json({ error: "invalid email or password" });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = signAccessToken({
      sub: String(user._id),
      email: user.email,
      role: user.role,
    });

    return res.status(200).json({ token, user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ error: "failed to login user" });
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
