import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, requireEmployeeOrAdmin, type AuthedRequest } from "../middleware/auth";

export const meetingsRouter = Router();

meetingsRouter.get("/", requireAuth, async (_req, res) => {
  const meetings = await prisma.meeting.findMany({ orderBy: { meetingDate: "desc" } });
  res.json(meetings);
});

const meetingSchema = z.object({
  meetingDate: z.string(),
  title: z.string().nullable().optional(),
});

meetingsRouter.post("/", requireAuth, requireEmployeeOrAdmin, async (req: AuthedRequest, res) => {
  const parsed = meetingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  const meeting = await prisma.meeting.create({
    data: {
      meetingDate: new Date(parsed.data.meetingDate),
      title: parsed.data.title,
      createdById: req.user!.id,
    },
  });
  res.status(201).json(meeting);
});

meetingsRouter.get("/:id/challenges", requireAuth, async (req, res) => {
  const challenges = await prisma.challenge.findMany({
    where: { meetingId: req.params.id },
    orderBy: { sortOrder: "asc" },
  });
  res.json(challenges);
});

const challengeSchema = z.object({
  description: z.string().min(1),
  supportNeeded: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

meetingsRouter.post(
  "/:id/challenges",
  requireAuth,
  requireEmployeeOrAdmin,
  async (req: AuthedRequest, res) => {
    const parsed = challengeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
    const challenge = await prisma.challenge.create({
      data: { ...parsed.data, meetingId: req.params.id, createdById: req.user!.id },
    });
    res.status(201).json(challenge);
  }
);

export const challengesRouter = Router();

const challengePatchSchema = z.object({
  description: z.string().min(1).optional(),
  supportNeeded: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

challengesRouter.patch("/:id", requireAuth, requireEmployeeOrAdmin, async (req, res) => {
  const parsed = challengePatchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  const updated = await prisma.challenge.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(updated);
});

challengesRouter.delete("/:id", requireAuth, requireEmployeeOrAdmin, async (req, res) => {
  await prisma.challenge.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
