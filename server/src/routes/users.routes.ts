import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, requireAdmin, type AuthedRequest } from "../middleware/auth";
import { hashPassword, verifyPassword } from "../utils/password";
import { ROLES } from "@app/shared";

export const usersRouter = Router();

function serializeUser(u: {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    role: u.role,
    isActive: u.isActive,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
  };
}

usersRouter.get("/", requireAuth, requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  res.json(users.map(serializeUser));
});

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  fullName: z.string().min(1),
  role: z.enum(ROLES as [string, ...string[]]),
});

usersRouter.post("/", requireAuth, requireAdmin, async (req, res) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" });
  }
  const { email, password, fullName, role } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "البريد الإلكتروني مستخدم بالفعل" });
  }
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, fullName, role },
  });
  res.status(201).json(serializeUser(user));
});

const patchUserSchema = z.object({
  fullName: z.string().min(1).optional(),
  role: z.enum(ROLES as [string, ...string[]]).optional(),
  isActive: z.boolean().optional(),
});

usersRouter.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  const parsed = patchUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "بيانات غير صحيحة" });
  }
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json(serializeUser(user));
});

usersRouter.post("/:id/reset-password", requireAuth, requireAdmin, async (req, res) => {
  const schema = z.object({ password: z.string().min(8) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" });
  }
  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.update({ where: { id: req.params.id }, data: { passwordHash } });
  res.status(204).end();
});

usersRouter.post("/me/password", requireAuth, async (req: AuthedRequest, res) => {
  const schema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "بيانات غير صحيحة" });
  }
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
  const ok = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: "كلمة المرور الحالية غير صحيحة" });
  }
  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  res.status(204).end();
});
