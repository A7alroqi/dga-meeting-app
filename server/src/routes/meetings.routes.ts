import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
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
    const data = {
      meetingId: req.params.id,
      description: parsed.data.description!,
      supportNeeded: parsed.data.supportNeeded ?? null,
      sortOrder: parsed.data.sortOrder ?? 0,
      createdById: req.user!.id,
    } satisfies Prisma.ChallengeUncheckedCreateInput;
    const challenge = await prisma.challenge.create({ data });
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

meetingsRouter.get("/:id/action-points", requireAuth, async (req, res) => {
  const actionPoints = await prisma.actionPoint.findMany({
    where: { meetingId: req.params.id },
    orderBy: { sortOrder: "asc" },
  });
  res.json(actionPoints);
});

const actionPointSchema = z.object({
  text: z.string().min(1),
  sortOrder: z.number().int().optional(),
});

meetingsRouter.post(
  "/:id/action-points",
  requireAuth,
  requireEmployeeOrAdmin,
  async (req: AuthedRequest, res) => {
    const parsed = actionPointSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
    const data = {
      meetingId: req.params.id,
      text: parsed.data.text!,
      sortOrder: parsed.data.sortOrder ?? 0,
      createdById: req.user!.id,
    } satisfies Prisma.ActionPointUncheckedCreateInput;
    const actionPoint = await prisma.actionPoint.create({ data });
    res.status(201).json(actionPoint);
  }
);

export const actionPointsRouter = Router();

const actionPointPatchSchema = z.object({
  text: z.string().min(1).optional(),
  isDone: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

actionPointsRouter.patch("/:id", requireAuth, requireEmployeeOrAdmin, async (req, res) => {
  const parsed = actionPointPatchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  const updated = await prisma.actionPoint.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(updated);
});

actionPointsRouter.delete("/:id", requireAuth, requireEmployeeOrAdmin, async (req, res) => {
  await prisma.actionPoint.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
