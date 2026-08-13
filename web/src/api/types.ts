import type { PriorityLevel, TaskStatus, KpiType, CapabilityValue } from "@app/shared";

export interface PriorityCategory {
  id: string;
  code: string;
  nameAr: string;
  descriptionAr: string | null;
  sortOrder: number;
}

export interface TaskAssignee {
  id: string;
  taskId: string;
  userId: string | null;
  displayName: string;
  user?: { id: string; fullName: string; email: string } | null;
}

export interface TaskMilestone {
  id: string;
  taskId: string;
  label: string;
  isDone: boolean;
  sortOrder: number;
}

export interface Task {
  id: string;
  title: string;
  categoryId: string | null;
  category: PriorityCategory | null;
  priorityLevel: PriorityLevel;
  status: TaskStatus;
  completionPercent: number;
  latestUpdateNote: string | null;
  dueDate: string | null;
  dueDateRaw: string | null;
  isOngoing: boolean;
  isArchived?: boolean;
  assignees: TaskAssignee[];
  milestones: TaskMilestone[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskHistoryEntry {
  id: string;
  taskId: string;
  changedById: string | null;
  changedBy?: { id: string; fullName: string } | null;
  changedAt: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  note: string | null;
}

export interface Kpi {
  id: string;
  categoryId: string | null;
  category?: PriorityCategory | null;
  kpiType: KpiType;
  name: string;
  targetValue: number | null;
  targetUnit: string | null;
  achievedValue: number | null;
  achievedUnit: string | null;
  displayPercent: number | null;
  year: number;
  sortOrder: number;
  isDisplayed?: boolean;
}

export interface Community {
  id: string;
  name: string;
  sourceUrl: string | null;
  statValue: string | null;
  statLabel: string | null;
  statCaption: string | null;
  whatIsIt: string | null;
  whatItDoes: string | null;
  sortOrder: number;
}

export interface CommunityCapability {
  id: string;
  name: string;
  sortOrder: number;
}

export interface CommunityCapabilityValue {
  id: string;
  communityId: string;
  capabilityId: string;
  value: CapabilityValue;
}

export interface GovernanceItem {
  id: string;
  responsibilityTask: string;
  responsibleText: string;
  sortOrder: number;
}

export interface SimpleTextItem {
  id: string;
  text: string;
  sortOrder: number;
}

export interface AgendaItem {
  id: string;
  label: string;
  sortOrder: number;
}

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface Meeting {
  id: string;
  meetingDate: string;
  title: string | null;
}

export interface Person {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
}

export interface MeetingFile {
  id: string;
  title: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  sortOrder: number;
  createdAt: string;
}

export interface Challenge {
  id: string;
  meetingId: string;
  description: string;
  supportNeeded: string | null | undefined;
  sortOrder: number;
}

export interface ActionPoint {
  id: string;
  meetingId: string;
  text: string;
  isDone: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string | null;
  text: string;
  createdAt: string;
  user?: { id: string; fullName: string } | null;
}
