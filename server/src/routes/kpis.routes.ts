import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { requireAuth, requireAdmin, type AuthedRequest } from "../middleware/auth";

export const kpisRouter = Router();

kpisRouter.get("/", requireAuth, async (req, res) => {
  const { year } = req.query as Record<string, string | undefined>;
  const kpis = await prisma.kpi.findMany({
    where: { year: year ? Number(year) : undefined },
    include: { category: true },
    orderBy: { sortOrder: "asc" },
  });
  res.json(kpis);
});

const kpiSchema = z.object({
  categoryId: z.string().nullable().optional(),
  kpiType: z.enum(["strategic", "operational"]).optional(),
  name: z.string().min(1),
  targetValue: z.number().nullable().optional(),
  targetUnit: z.string().nullable().optional(),
  achievedValue: z.number().nullable().optional(),
  achievedUnit: z.string().nullable().optional(),
  displayPercent: z.number().int().nullable().optional(),
  year: z.number().int(),
  sortOrder: z.number().int().optional(),
  isDisplayed: z.boolean().optional(),
});

kpisRouter.post("/", requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  const parsed = kpiSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" });
  }
  const data = {
    categoryId: parsed.data.categoryId ?? null,
    kpiType: parsed.data.kpiType ?? "operational",
    name: parsed.data.name!,
    targetValue: parsed.data.targetValue ?? null,
    targetUnit: parsed.data.targetUnit ?? null,
    achievedValue: parsed.data.achievedValue ?? null,
    achievedUnit: parsed.data.achievedUnit ?? null,
    displayPercent: parsed.data.displayPercent ?? null,
    year: parsed.data.year!,
    sortOrder: parsed.data.sortOrder ?? 0,
    isDisplayed: parsed.data.isDisplayed ?? true,
    updatedById: req.user!.id,
  } satisfies Prisma.KpiUncheckedCreateInput;
  const created = await prisma.kpi.create({ data });
  res.status(201).json(created);
});

kpisRouter.patch("/:id", requireAuth, requireAdmin, async (req: AuthedRequest, res) => {
  const parsed = kpiSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  const updated = await prisma.kpi.update({
    where: { id: req.params.id },
    data: { ...parsed.data, updatedById: req.user!.id },
  });
  res.json(updated);
});

kpisRouter.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  await prisma.kpi.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
