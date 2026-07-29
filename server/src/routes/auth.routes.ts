import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { verifyPassword } from "../utils/password";
import { attachUser, type AuthedRequest } from "../middleware/auth";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "بيانات الدخول غير صحيحة" });
  }
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
  }
  req.session.userId = user.id;
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  res.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  });
});

authRouter.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.status(204).end();
  });
});

authRouter.get("/me", attachUser, (req: AuthedRequest, res) => {
  if (!req.user) return res.status(401).json({ error: "غير مسجل الدخول" });
  res.json(req.user);
});
