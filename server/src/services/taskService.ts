import { prisma } from "../db";

const TRACKED_FIELDS = [
  "title",
  "categoryId",
  "priorityLevel",
  "status",
  "completionPercent",
  "latestUpdateNote",
  "dueDate",
  "dueDateRaw",
  "isOngoing",
] as const;

type TrackedField = (typeof TRACKED_FIELDS)[number];

function serializeForHistory(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export const taskInclude = {
  category: true,
  assignees: { include: { user: { select: { id: true, fullName: true, email: true } } } },
  milestones: { orderBy: { sortOrder: "asc" as const } },
};

export async function listTasks(filters: {
  categoryId?: string;
  status?: string;
  priorityLevel?: string;
  q?: string;
}) {
  return prisma.task.findMany({
    where: {
      deletedAt: null,
      isArchived: false,
      categoryId: filters.categoryId || undefined,
      status: filters.status || undefined,
      priorityLevel: filters.priorityLevel || undefined,
      title: filters.q ? { contains: filters.q } : undefined,
    },
    include: taskInclude,
    orderBy: { createdAt: "asc" },
  });
}

export async function getTask(id: string) {
  return prisma.task.findFirst({ where: { id, deletedAt: null, isArchived: false }, include: taskInclude });
}

export async function createTask(
  data: Partial<Record<TrackedField, unknown>> & {
    assignees?: { userId?: string; displayName: string }[];
    milestones?: { label: string; isDone?: boolean; sortOrder?: number }[];
  },
  actorId: string
) {
  const { assignees, milestones, ...scalars } = data;
  const task = await prisma.task.create({
    data: {
      ...(scalars as Record<string, unknown>),
      title: String(scalars.title ?? ""),
      createdById: actorId,
      updatedById: actorId,
      assignees: assignees?.length
        ? { create: assignees.map((a) => ({ userId: a.userId, displayName: a.displayName })) }
        : undefined,
      milestones: milestones?.length
        ? {
            create: milestones.map((m, i) => ({
              label: m.label,
              isDone: m.isDone ?? false,
              sortOrder: m.sortOrder ?? i,
            })),
          }
        : undefined,
    },
    include: taskInclude,
  });

  await prisma.taskHistory.create({
    data: {
      taskId: task.id,
      changedById: actorId,
      fieldName: "__created__",
      oldValue: null,
      newValue: task.title,
    },
  });

  return task;
}

export class ConflictError extends Error {}

export async function updateTask(
  id: string,
  data: Partial<Record<TrackedField, unknown>>,
  actorId: string,
  expectedUpdatedAt?: string
) {
  const existing = await prisma.task.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return null;

  if (expectedUpdatedAt && existing.updatedAt.toISOString() !== expectedUpdatedAt) {
    throw new ConflictError("تم تعديل هذه المهمة من قبل مستخدم آخر، يرجى تحديث الصفحة");
  }

  const historyEntries: {
    fieldName: string;
    oldValue: string | null;
    newValue: string | null;
  }[] = [];

  for (const field of TRACKED_FIELDS) {
    if (field in data) {
      const oldVal = serializeForHistory((existing as Record<string, unknown>)[field]);
      const newVal = serializeForHistory(data[field]);
      if (oldVal !== newVal) {
        historyEntries.push({ fieldName: field, oldValue: oldVal, newValue: newVal });
      }
    }
  }

  const updated = await prisma.task.update({
    where: { id },
    data: { ...(data as Record<string, unknown>), updatedById: actorId },
    include: taskInclude,
  });

  if (historyEntries.length > 0) {
    await prisma.taskHistory.createMany({
      data: historyEntries.map((h) => ({
        taskId: id,
        changedById: actorId,
        fieldName: h.fieldName,
        oldValue: h.oldValue,
        newValue: h.newValue,
      })),
    });
  }

  return updated;
}

export async function softDeleteTask(id: string, actorId: string) {
  const existing = await prisma.task.findFirst({ where: { id, deletedAt: null } });
  if (!existing) return null;
  const deleted = await prisma.task.update({
    where: { id },
    data: { deletedAt: new Date(), updatedById: actorId },
  });
  await prisma.taskHistory.create({
    data: {
      taskId: id,
      changedById: actorId,
      fieldName: "__deleted__",
      oldValue: null,
      newValue: null,
    },
  });
  return deleted;
}

export async function getTaskHistory(taskId: string) {
  return prisma.taskHistory.findMany({
    where: { taskId },
    include: { changedBy: { select: { id: true, fullName: true } } },
    orderBy: { changedAt: "desc" },
  });
}

export async function addMilestone(
  taskId: string,
  label: string,
  actorId: string,
  sortOrder?: number
) {
  const count = sortOrder ?? (await prisma.taskMilestone.count({ where: { taskId } }));
  const milestone = await prisma.taskMilestone.create({
    data: { taskId, label, sortOrder: count },
  });
  await prisma.taskHistory.create({
    data: {
      taskId,
      changedById: actorId,
      fieldName: "milestone_added",
      oldValue: null,
      newValue: label,
    },
  });
  return milestone;
}

export async function updateMilestone(
  taskId: string,
  milestoneId: string,
  data: { label?: string; isDone?: boolean; sortOrder?: number },
  actorId: string
) {
  const existing = await prisma.taskMilestone.findFirst({ where: { id: milestoneId, taskId } });
  if (!existing) return null;
  const updated = await prisma.taskMilestone.update({ where: { id: milestoneId }, data });
  if (data.isDone !== undefined && data.isDone !== existing.isDone) {
    await prisma.taskHistory.create({
      data: {
        taskId,
        changedById: actorId,
        fieldName: `milestone:${existing.label}`,
        oldValue: String(existing.isDone),
        newValue: String(data.isDone),
      },
    });
  }
  return updated;
}

export async function deleteMilestone(taskId: string, milestoneId: string, actorId: string) {
  const existing = await prisma.taskMilestone.findFirst({ where: { id: milestoneId, taskId } });
  if (!existing) return null;
  await prisma.taskMilestone.delete({ where: { id: milestoneId } });
  await prisma.taskHistory.create({
    data: {
      taskId,
      changedById: actorId,
      fieldName: "milestone_removed",
      oldValue: existing.label,
      newValue: null,
    },
  });
  return existing;
}

export async function addAssignee(
  taskId: string,
  data: { userId?: string; displayName: string },
  actorId: string
) {
  const assignee = await prisma.taskAssignee.create({ data: { taskId, ...data } });
  await prisma.taskHistory.create({
    data: {
      taskId,
      changedById: actorId,
      fieldName: "assignee_added",
      oldValue: null,
      newValue: data.displayName,
    },
  });
  return assignee;
}

export async function removeAssignee(taskId: string, assigneeId: string, actorId: string) {
  const existing = await prisma.taskAssignee.findFirst({ where: { id: assigneeId, taskId } });
  if (!existing) return null;
  await prisma.taskAssignee.delete({ where: { id: assigneeId } });
  await prisma.taskHistory.create({
    data: {
      taskId,
      changedById: actorId,
      fieldName: "assignee_removed",
      oldValue: existing.displayName,
      newValue: null,
    },
  });
  return existing;
}
