export type Role = "admin" | "employee" | "guest";

export const ROLES: Role[] = ["admin", "employee", "guest"];

export type PriorityLevel = "high" | "medium" | "low";

export const PRIORITY_LEVELS: PriorityLevel[] = ["high", "medium", "low"];

export type TaskStatus = "not_started" | "in_progress" | "completed" | "blocked";

export const TASK_STATUSES: TaskStatus[] = [
  "not_started",
  "in_progress",
  "completed",
  "blocked",
];

export type KpiType = "strategic" | "operational";

export type CapabilityValue = "yes" | "no" | "partial";

export const PRIORITY_LEVEL_LABELS_AR: Record<PriorityLevel, string> = {
  high: "عالية",
  medium: "متوسطة",
  low: "منخفضة",
};

export const TASK_STATUS_LABELS_AR: Record<TaskStatus, string> = {
  not_started: "لم تبدأ",
  in_progress: "جارية",
  completed: "مكتملة",
  blocked: "متعثرة",
};

export const ROLE_LABELS_AR: Record<Role, string> = {
  admin: "مدير النظام",
  employee: "موظف",
  guest: "زائر",
};

export const CAPABILITY_VALUE_LABELS_AR: Record<CapabilityValue, string> = {
  yes: "نعم",
  no: "لا",
  partial: "جزئي",
};
