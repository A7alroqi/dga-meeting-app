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

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        cursor: "pointer",
        "&:hover": { boxShadow: 2 },
        border: isCompleted ? "2px solid #4CAF50" : undefined
      }}
      onClick={onClick}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Typography
          variant="subtitle1"
          fontWeight={700}
          sx={{
            flex: 1,
            wordBreak: "break-word",
            overflowWrap: "break-word",
            hyphens: "auto",
            textDecoration: isCompleted ? "line-through" : "none",
            color: isCompleted ? "text.secondary" : "inherit"
          }}
        >
          {cleanLongText(task.title)}
        </Typography>
        <Stack direction="row" spacing={0.5}>
          {canMarkComplete && !isCompleted && (
            <IconButton
              size="small"
              onClick={handleCompleteClick}
              sx={{
                color: "success.main",
                "&:hover": { bgcolor: "success.lighter" }
              }}
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
                sx={{
                  color: "info.main",
                  "&:hover": { bgcolor: "info.lighter" }
                }}
                title="إخفاء المهمة"
              >
                <ArchiveIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={handleUndoClick}
                sx={{
                  color: "warning.main",
                  "&:hover": { bgcolor: "warning.lighter" }
                }}
                title="إرجاع المهمة"
              >
                <UndoIcon fontSize="small" />
              </IconButton>
            </>
          )}
          <Chip size="small" label={PRIORITY_LEVEL_LABELS_AR[task.priorityLevel]} color={PRIORITY_COLORS[task.priorityLevel]} />
        </Stack>
      </Stack>
      <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
        <Chip size="small" variant="outlined" label={TASK_STATUS_LABELS_AR[task.status]} />
        {task.category && <Chip size="small" variant="outlined" label={task.category.nameAr} />}
        {task.milestones.length > 0 && (
          <Chip size="small" variant="outlined" label={`معالم: ${doneMilestones}/${task.milestones.length}`} />
        )}
      </Stack>
      <Box sx={{ mt: 1.5 }}>
        <LinearProgress
          variant="determinate"
          value={Math.min(100, task.completionPercent)}
          sx={{ height: 6, borderRadius: 3 }}
        />
        <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            {task.completionPercent}%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {task.isOngoing ? "مستمر" : task.dueDate ? formatDateAr(task.dueDate) : task.dueDateRaw ?? ""}
          </Typography>
        </Stack>
      </Box>
      {task.assignees.length > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          {task.assignees.map((a) => a.displayName).join("، ")}
        </Typography>
      )}
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
