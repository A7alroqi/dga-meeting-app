import { useState } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Grid,
  Paper,
  Chip,
  LinearProgress,
  Stack,
  TextField,
  MenuItem,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useAuth } from "../AuthContext";
import { canWriteTasks } from "../components/RoleGuard";
import { usePresenting } from "../components/AppLayout";
import { useCategories, useTasks, useUpdateTask } from "../api/hooks";
import type { Task } from "../api/types";
import { PRIORITY_LEVEL_LABELS_AR, TASK_STATUS_LABELS_AR } from "@app/shared";
import { formatDateAr } from "../utils/formatDate";
import { TaskDetailDialog } from "../components/TaskDetailDialog";
import { CreateTaskDialog } from "../components/CreateTaskDialog";
import { cleanLongText } from "../utils/textUtils";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import UndoIcon from "@mui/icons-material/Undo";
import ArchiveIcon from "@mui/icons-material/Archive";

const PRIORITY_COLORS: Record<string, "error" | "warning" | "success"> = {
  high: "error",
  medium: "warning",
  low: "success",
};

function TaskCard({ task, onClick, canMarkComplete }: { task: Task; onClick: () => void; canMarkComplete?: boolean }) {
  const doneMilestones = task.milestones.filter((m) => m.isDone).length;
  const updateTask = useUpdateTask();
  const isCompleted = task.status === "completed";
  const completionPercent = Math.min(100, task.completionPercent);

  const handleCompleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateTask.mutate({
      id: task.id,
      data: {
        status: "completed",
        completionPercent: 100,
        expectedUpdatedAt: task.updatedAt
      }
    });
  };

  const handleUndoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateTask.mutate({
      id: task.id,
      data: {
        status: "in_progress",
        expectedUpdatedAt: task.updatedAt
      }
    });
  };

  const handleArchiveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateTask.mutate({
      id: task.id,
      data: {
        isArchived: true,
        expectedUpdatedAt: task.updatedAt
      }
    });
  };

  const getProgressColor = () => {
    if (completionPercent >= 100) return "#4CAF50";
    if (completionPercent >= 75) return "#1AC082";
    if (completionPercent >= 50) return "#FF9800";
    if (completionPercent >= 25) return "#FFC107";
    return "#F44336";
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        cursor: "pointer",
        "&:hover": { boxShadow: 3 },
        border: isCompleted ? "2px solid #4CAF50" : "1px solid #ddd",
        overflow: "hidden",
        display: "flex",
        flexDirection: "row",
        height: "100%"
      }}
      onClick={onClick}
    >
      {/* Left: Large Progress Visual */}
      <Box
        sx={{
          width: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: getProgressColor(),
          color: "white",
          position: "relative",
          flexShrink: 0
        }}
      >
        <Stack alignItems="center" spacing={0.5}>
          <Typography variant="h5" fontWeight={700}>
            {completionPercent}%
          </Typography>
          <Typography variant="caption" sx={{ fontSize: "0.65rem", opacity: 0.9 }}>
            مكتمل
          </Typography>
        </Stack>
      </Box>

      {/* Right: Task Details */}
      <Box sx={{ p: 2, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        {/* Title + Actions */}
        <Stack direction="row" justifyContent="space-between" spacing={1}>
          <Typography
            variant="subtitle2"
            fontWeight={600}
            sx={{
              flex: 1,
              wordBreak: "break-word",
              overflowWrap: "break-word",
              textDecoration: isCompleted ? "line-through" : "none",
              color: isCompleted ? "text.secondary" : "inherit",
              lineHeight: 1.3
            }}
          >
            {cleanLongText(task.title)}
          </Typography>
          <Stack direction="row" spacing={0.25} flexShrink={0}>
            {canMarkComplete && !isCompleted && (
              <IconButton
                size="small"
                onClick={handleCompleteClick}
                sx={{ color: "success.main" }}
                title="إنهاء المهمة"
              >
                <CheckCircleIcon fontSize="small" />
              </IconButton>
            )}
            {canMarkComplete && isCompleted && (
              <>
                <IconButton
                  size="small"
                  onClick={handleArchiveClick}
                  sx={{ color: "info.main" }}
                  title="إخفاء المهمة"
                >
                  <ArchiveIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={handleUndoClick}
                  sx={{ color: "warning.main" }}
                  title="إرجاع المهمة"
                >
                  <UndoIcon fontSize="small" />
                </IconButton>
              </>
            )}
          </Stack>
        </Stack>

        {/* Status Row */}
        <Stack direction="row" spacing={0.5} sx={{ mt: 1 }} flexWrap="wrap">
          <Chip size="small" variant="filled" label={TASK_STATUS_LABELS_AR[task.status]} sx={{ height: 24 }} />
          <Chip size="small" label={PRIORITY_LEVEL_LABELS_AR[task.priorityLevel]} color={PRIORITY_COLORS[task.priorityLevel]} sx={{ height: 24 }} />
          {task.category && <Chip size="small" variant="outlined" label={task.category.nameAr} sx={{ height: 24 }} />}
        </Stack>

        {/* Details Footer */}
        <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {task.milestones.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                معالم: {doneMilestones}/{task.milestones.length}
              </Typography>
            )}
            {task.assignees.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                {task.assignees.map((a) => a.displayName).join("، ")}
              </Typography>
            )}
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
            {task.isOngoing ? "مستمر" : task.dueDate ? formatDateAr(task.dueDate) : task.dueDateRaw ?? ""}
          </Typography>
        </Stack>
      </Box>
    </Paper>
  );
}

export function TasksPage() {
  const { user } = useAuth();
  const presenting = usePresenting();
  const canEdit = canWriteTasks(user?.role) && !presenting;
  const { data: categories } = useCategories();
  const [categoryId, setCategoryId] = useState<string>("all");
  const [status, setStatus] = useState<string>("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: tasks, isLoading } = useTasks({
    categoryId: categoryId === "all" ? undefined : categoryId,
    status: status || undefined,
  });

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>
          متابعة المهام
        </Typography>
        {canEdit && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreating(true)}>
            مهمة جديدة
          </Button>
        )}
      </Stack>

      <Tabs
        value={categoryId}
        onChange={(_e, v) => setCategoryId(v)}
        sx={{ mb: 2 }}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab value="all" label="الكل" />
        {categories?.map((c) => (
          <Tab key={c.id} value={c.id} label={c.nameAr} />
        ))}
      </Tabs>

      <TextField
        select
        size="small"
        label="الحالة"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        sx={{ minWidth: 180, mb: 2 }}
      >
        <MenuItem value="">الكل</MenuItem>
        {Object.entries(TASK_STATUS_LABELS_AR).map(([value, label]) => (
          <MenuItem key={value} value={value}>
            {label}
          </MenuItem>
        ))}
      </TextField>

      {isLoading && <LinearProgress />}

      <Grid container spacing={2}>
        {tasks?.map((task) => (
          <Grid item xs={12} md={6} lg={4} key={task.id}>
            <TaskCard
              task={task}
              onClick={() => setSelectedTaskId(task.id)}
              canMarkComplete={canEdit && task.status !== "completed"}
            />
          </Grid>
        ))}
        {tasks?.length === 0 && (
          <Grid item xs={12}>
            <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
              لا توجد مهام مطابقة
            </Typography>
          </Grid>
        )}
      </Grid>

      {selectedTaskId && (
        <TaskDetailDialog taskId={selectedTaskId} canEdit={canEdit} onClose={() => setSelectedTaskId(null)} />
      )}
      {creating && <CreateTaskDialog onClose={() => setCreating(false)} />}
    </Box>
  );
}
