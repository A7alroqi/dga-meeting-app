import { Router } from "express";
import type { ZodSchema } from "zod";
import { requireAuth, requireAdmin, requireEmployeeOrAdmin } from "../middleware/auth";
import { prisma } from "../db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Delegate = {
  findMany: (args: any) => Promise<any[]>;
  create: (args: any) => Promise<any>;
  update: (args: any) => Promise<any>;
  delete: (args: any) => Promise<any>;
};

// Generic admin-write / any-authenticated-read CRUD router for the deck's
// simple ordered reference-content lists (governance, agenda, objectives,
// ground rules, categories, communities, capabilities).
export function simpleCrudRouter(delegate: Delegate, createSchema: ZodSchema, updateSchema: ZodSchema, employeeWrite = false) {
  const router = Router();
  const writeMiddleware = employeeWrite ? requireEmployeeOrAdmin : requireAdmin;

  router.get("/", requireAuth, async (_req, res) => {
    const items = await delegate.findMany({ orderBy: { sortOrder: "asc" } });
    res.json(items);
  });

  router.post("/", requireAuth, writeMiddleware, async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" });
    }
    const created = await delegate.create({ data: parsed.data });
    res.status(201).json(created);
  });

  router.patch("/:id", requireAuth, writeMiddleware, async (req, res) => {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" });
    }
    const updated = await delegate.update({ where: { id: req.params.id }, data: parsed.data });
    res.json(updated);
  });

  router.delete("/:id", requireAuth, writeMiddleware, async (req, res) => {
    await delegate.delete({ where: { id: req.params.id } });
    res.status(204).end();
  });

  return router;
}

export { prisma };
