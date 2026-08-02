import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireEmployeeOrAdmin, type AuthedRequest } from "../middleware/auth";
import * as taskService from "../services/taskService";
import { PRIORITY_LEVELS, TASK_STATUSES } from "@app/shared";

export const tasksRouter = Router();

tasksRouter.get("/", requireAuth, async (req, res) => {
  const { categoryId, status, priorityLevel, q } = req.query as Record<string, string | undefined>;
  const tasks = await taskService.listTasks({ categoryId, status, priorityLevel, q });
  res.json(tasks);
});

tasksRouter.get("/:id", requireAuth, async (req, res) => {
  const task = await taskService.getTask(req.params.id);
  if (!task) return res.status(404).json({ error: "المهمة غير موجودة" });
  res.json(task);
});

tasksRouter.get("/:id/history", requireAuth, async (req, res) => {
  const history = await taskService.getTaskHistory(req.params.id);
  res.json(history);
});

const assigneeSchema = z.object({
  userId: z.string().optional(),
  displayName: z.string().min(1),
});

const milestoneSchema = z.object({
  label: z.string().min(1),
  isDone: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

const taskCreateSchema = z.object({
  title: z.string().min(1),
  categoryId: z.string().nullable().optional(),
  priorityLevel: z.enum(PRIORITY_LEVELS as [string, ...string[]]).optional(),
  status: z.enum(TASK_STATUSES as [string, ...string[]]).optional(),
  completionPercent: z.number().int().min(0).optional(),
  latestUpdateNote: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  dueDateRaw: z.string().nullable().optional(),
  isOngoing: z.boolean().optional(),
  assignees: z.array(assigneeSchema).optional(),
  milestones: z.array(milestoneSchema).optional(),
});

tasksRouter.post("/", requireAuth, requireEmployeeOrAdmin, async (req: AuthedRequest, res) => {
  const parsed = taskCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" });
  }
  const { dueDate, assignees, milestones, ...rest } = parsed.data;
  const task = await taskService.createTask(
    {
      ...rest,
      dueDate: dueDate ? new Date(dueDate) : null,
      // Zod validates these fields at runtime. The explicit mapping also
      // preserves their required shape under TypeScript 5.9's inference.
      assignees: assignees?.map(({ userId, displayName }) => ({ userId, displayName: displayName! })),
      milestones: milestones?.map(({ label, isDone, sortOrder }) => ({ label: label!, isDone, sortOrder })),
    },
    req.user!.id
  );
  res.status(201).json(task);
});

const taskUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  categoryId: z.string().nullable().optional(),
  priorityLevel: z.enum(PRIORITY_LEVELS as [string, ...string[]]).optional(),
  status: z.enum(TASK_STATUSES as [string, ...string[]]).optional(),
  completionPercent: z.number().int().min(0).optional(),
  latestUpdateNote: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  dueDateRaw: z.string().nullable().optional(),
  isOngoing: z.boolean().optional(),
  expectedUpdatedAt: z.string().optional(),
});

tasksRouter.patch("/:id", requireAuth, requireEmployeeOrAdmin, async (req: AuthedRequest, res) => {
  const parsed = taskUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "بيانات غير صحيحة" });
  }
  const { expectedUpdatedAt, dueDate, ...rest } = parsed.data;
  try {
    const updated = await taskService.updateTask(
      req.params.id,
      { ...rest, ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}) },
      req.user!.id,
      expectedUpdatedAt
    );
    if (!updated) return res.status(404).json({ error: "المهمة غير موجودة" });
    res.json(updated);
  } catch (err) {
    if (err instanceof taskService.ConflictError) {
      const fresh = await taskService.getTask(req.params.id);
      return res.status(409).json({ error: err.message, current: fresh });
    }
    throw err;
  }
});

tasksRouter.delete("/:id", requireAuth, requireEmployeeOrAdmin, async (req: AuthedRequest, res) => {
  const deleted = await taskService.softDeleteTask(req.params.id, req.user!.id);
  if (!deleted) return res.status(404).json({ error: "المهمة غير موجودة" });
  res.status(204).end();
});

tasksRouter.post(
  "/:id/milestones",
  requireAuth,
  requireEmployeeOrAdmin,
  async (req: AuthedRequest, res) => {
    const parsed = milestoneSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
    const milestone = await taskService.addMilestone(
      req.params.id,
      parsed.data.label,
      req.user!.id,
      parsed.data.sortOrder
    );
    res.status(201).json(milestone);
  }
);

tasksRouter.patch(
  "/:id/milestones/:mid",
  requireAuth,
  requireEmployeeOrAdmin,
  async (req: AuthedRequest, res) => {
    const parsed = milestoneSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
    const updated = await taskService.updateMilestone(
      req.params.id,
      req.params.mid,
      parsed.data,
      req.user!.id
    );
    if (!updated) return res.status(404).json({ error: "المعلم غير موجود" });
    res.json(updated);
  }
);

tasksRouter.delete(
  "/:id/milestones/:mid",
  requireAuth,
  requireEmployeeOrAdmin,
  async (req: AuthedRequest, res) => {
    const deleted = await taskService.deleteMilestone(req.params.id, req.params.mid, req.user!.id);
    if (!deleted) return res.status(404).json({ error: "المعلم غير موجود" });
    res.status(204).end();
  }
);

tasksRouter.post(
  "/:id/assignees",
  requireAuth,
  requireEmployeeOrAdmin,
  async (req: AuthedRequest, res) => {
    const parsed = assigneeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
    const assignee = await taskService.addAssignee(
      req.params.id,
      { userId: parsed.data.userId, displayName: parsed.data.displayName! },
      req.user!.id
    );
    res.status(201).json(assignee);
  }
);

tasksRouter.delete(
  "/:id/assignees/:aid",
  requireAuth,
  requireEmployeeOrAdmin,
  async (req: AuthedRequest, res) => {
    const deleted = await taskService.removeAssignee(req.params.id, req.params.aid, req.user!.id);
    if (!deleted) return res.status(404).json({ error: "غير موجود" });
    res.status(204).end();
  }
);
