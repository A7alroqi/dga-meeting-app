import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, requireAdmin } from "../middleware/auth";

export const settingsRouter = Router();

settingsRouter.get("/", requireAuth, async (_req, res) => {
  const settings = await prisma.appSetting.findMany();
  const asObject = Object.fromEntries(settings.map((s: { key: string; value: string }) => [s.key, s.value]));
  res.json(asObject);
});

const patchSchema = z.record(z.string());

settingsRouter.patch("/", requireAuth, requireAdmin, async (req, res) => {
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  const entries = Object.entries(parsed.data);
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.appSetting.upsert({ where: { key }, create: { key, value }, update: { value } })
    )
  );
  const settings = await prisma.appSetting.findMany();
  res.json(Object.fromEntries(settings.map((s: { key: string; value: string }) => [s.key, s.value])));
});
