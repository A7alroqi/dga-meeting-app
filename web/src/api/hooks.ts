import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import type {
  PriorityCategory,
  Task,
  TaskHistoryEntry,
  Kpi,
  Community,
  CommunityCapability,
  CommunityCapabilityValue,
  GovernanceItem,
  SimpleTextItem,
  AgendaItem,
  AppUser,
  Meeting,
  Challenge,
  MeetingFile,
  Person,
} from "./types";

// ---- Categories ----
export function useCategories() {
  return useQuery({ queryKey: ["categories"], queryFn: () => api.get<PriorityCategory[]>("/categories") });
}

// ---- Tasks ----
export function useTasks(filters: { categoryId?: string; status?: string; priorityLevel?: string; q?: string } = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
  const qs = params.toString();
  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: () => api.get<Task[]>(`/tasks${qs ? `?${qs}` : ""}`),
  });
}

export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: ["tasks", id],
    queryFn: () => api.get<Task>(`/tasks/${id}`),
    enabled: !!id,
  });
}

export function useTaskHistory(id: string | undefined) {
  return useQuery({
    queryKey: ["tasks", id, "history"],
    queryFn: () => api.get<TaskHistoryEntry[]>(`/tasks/${id}/history`),
    enabled: !!id,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      data: Omit<Partial<Task>, "assignees" | "milestones"> & {
        assignees?: { displayName: string }[];
        milestones?: { label: string }[];
      }
    ) => api.post<Task>("/tasks", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.patch<Task>(`/tasks/${id}`, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks", vars.id] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/tasks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useAddMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, label }: { taskId: string; label: string }) =>
      api.post(`/tasks/${taskId}/milestones`, { label }),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["tasks", vars.taskId] }),
  });
}

export function useUpdateMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      milestoneId,
      data,
    }: {
      taskId: string;
      milestoneId: string;
      data: { isDone?: boolean; label?: string };
    }) => api.patch(`/tasks/${taskId}/milestones/${milestoneId}`, data),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["tasks", vars.taskId] }),
  });
}

export function useDeleteMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, milestoneId }: { taskId: string; milestoneId: string }) =>
      api.delete(`/tasks/${taskId}/milestones/${milestoneId}`),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["tasks", vars.taskId] }),
  });
}

export function useAddAssignee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, displayName }: { taskId: string; displayName: string }) =>
      api.post(`/tasks/${taskId}/assignees`, { displayName }),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["tasks", vars.taskId] }),
  });
}

export function useRemoveAssignee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, assigneeId }: { taskId: string; assigneeId: string }) =>
      api.delete(`/tasks/${taskId}/assignees/${assigneeId}`),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["tasks", vars.taskId] }),
  });
}

// ---- KPIs ----
export function useKpis(year?: number) {
  return useQuery({
    queryKey: ["kpis", year],
    queryFn: () => api.get<Kpi[]>(`/kpis${year ? `?year=${year}` : ""}`),
  });
}

export function useUpdateKpi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Kpi> }) => api.patch<Kpi>(`/kpis/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kpis"] }),
  });
}

// ---- Communities ----
export function useCommunities() {
  return useQuery({ queryKey: ["communities"], queryFn: () => api.get<Community[]>("/communities") });
}

export function useCapabilities() {
  return useQuery({ queryKey: ["capabilities"], queryFn: () => api.get<CommunityCapability[]>("/capabilities") });
}

export function useCapabilityMatrix() {
  return useQuery({
    queryKey: ["capability-matrix"],
    queryFn: () => api.get<CommunityCapabilityValue[]>("/capability-matrix"),
  });
}

// ---- Reference content ----
export function useGovernanceItems() {
  return useQuery({ queryKey: ["governance-items"], queryFn: () => api.get<GovernanceItem[]>("/governance-items") });
}

export function useCreateGovernanceItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { responsibilityTask: string; responsibleText: string }) =>
      api.post("/governance-items", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["governance-items"] }),
  });
}

export function useDeleteGovernanceItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/governance-items/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["governance-items"] }),
  });
}

export function useAgendaItems() {
  return useQuery({ queryKey: ["agenda-items"], queryFn: () => api.get<AgendaItem[]>("/agenda-items") });
}

export function useCreateAgendaItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (label: string) => api.post("/agenda-items", { label }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agenda-items"] }),
  });
}

export function useDeleteAgendaItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/agenda-items/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agenda-items"] }),
  });
}

export function useObjectives() {
  return useQuery({
    queryKey: ["meeting-objectives"],
    queryFn: () => api.get<SimpleTextItem[]>("/meeting-objectives"),
  });
}
export function useCreateObjective() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => api.post("/meeting-objectives", { text }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meeting-objectives"] }),
  });
}
export function useDeleteObjective() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/meeting-objectives/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meeting-objectives"] }),
  });
}

export function useGroundRules() {
  return useQuery({ queryKey: ["ground-rules"], queryFn: () => api.get<SimpleTextItem[]>("/ground-rules") });
}
export function useCreateGroundRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => api.post("/ground-rules", { text }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ground-rules"] }),
  });
}
export function useDeleteGroundRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/ground-rules/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ground-rules"] }),
  });
}

export function useSettings() {
  return useQuery({ queryKey: ["settings"], queryFn: () => api.get<Record<string, string>>("/settings") });
}

// ---- Users (admin) ----
export function useUsers() {
  return useQuery({ queryKey: ["users"], queryFn: () => api.get<AppUser[]>("/users") });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { email: string; password: string; fullName: string; role: string }) =>
      api.post<AppUser>("/users", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AppUser> }) => api.patch<AppUser>(`/users/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

// ---- Meetings & challenges ----
export function useMeetings() {
  return useQuery({ queryKey: ["meetings"], queryFn: () => api.get<Meeting[]>("/meetings") });
}

export function useCreateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { meetingDate: string; title?: string }) => api.post<Meeting>("/meetings", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings"] }),
  });
}

export function useChallenges(meetingId: string | undefined) {
  return useQuery({
    queryKey: ["challenges", meetingId],
    queryFn: () => api.get<Challenge[]>(`/meetings/${meetingId}/challenges`),
    enabled: !!meetingId,
  });
}

export function useCreateChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      meetingId,
      data,
    }: {
      meetingId: string;
      data: { description: string; supportNeeded?: string };
    }) => api.post<Challenge>(`/meetings/${meetingId}/challenges`, data),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["challenges", vars.meetingId] }),
  });
}

// ---- People directory (names only, admin-managed) ----
export function usePeople() {
  return useQuery({ queryKey: ["people"], queryFn: () => api.get<Person[]>("/people") });
}

export function useCreatePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post<Person>("/people", { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["people"] }),
  });
}

export function useUpdatePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Person> }) =>
      api.patch<Person>(`/people/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["people"] }),
  });
}

export function useDeletePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/people/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["people"] }),
  });
}

// ---- Meeting files (documents presented in the meeting) ----
export function useMeetingFiles() {
  return useQuery({ queryKey: ["files"], queryFn: () => api.get<MeetingFile[]>("/files") });
}

export function useUploadFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, title }: { file: File; title?: string }) => {
      const form = new FormData();
      form.append("file", file);
      if (title) form.append("title", title);
      const res = await fetch("/api/files", { method: "POST", body: form, credentials: "include" });
      const body = await res.json().catch(() => undefined);
      if (!res.ok) {
        throw new Error((body as { error?: string } | undefined)?.error ?? "فشل رفع الملف");
      }
      return body as MeetingFile;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["files"] }),
  });
}

export function useDeleteFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/files/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["files"] }),
  });
}

export function useDeleteChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/challenges/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["challenges"] }),
  });
}
