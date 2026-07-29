import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, requireAdmin } from "../middleware/auth";

export const capabilityMatrixRouter = Router();

capabilityMatrixRouter.get("/", requireAuth, async (_req, res) => {
  const values = await prisma.communityCapabilityValue.findMany();
  res.json(values);
});

const valueSchema = z.object({ value: z.enum(["yes", "no", "partial"]) });

capabilityMatrixRouter.put(
  "/:communityId/:capabilityId",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    const parsed = valueSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "قيمة غير صحيحة" });
    const { communityId, capabilityId } = req.params;
    const upserted = await prisma.communityCapabilityValue.upsert({
      where: { communityId_capabilityId: { communityId, capabilityId } },
      create: { communityId, capabilityId, value: parsed.data.value },
      update: { value: parsed.data.value },
    });
    res.json(upserted);
  }
);
