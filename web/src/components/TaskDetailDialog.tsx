import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Checkbox,
  FormControlLabel,
  Typography,
  Chip,
  IconButton,
  Divider,
  Box,
  List,
  ListItem,
  ListItemText,
  Slider,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import MessageIcon from "@mui/icons-material/Message";
import Autocomplete from "@mui/material/Autocomplete";
import {
  useTask,
  useTaskHistory,
  useUpdateTask,
  useDeleteTask,
  useAddMilestone,
  useUpdateMilestone,
  useDeleteMilestone,
  useAddAssignee,
  useRemoveAssignee,
  useCategories,
  usePeople,
  useTaskComments,
  useCreateComment,
  useDeleteComment,
} from "../api/hooks";
import { PRIORITY_LEVEL_LABELS_AR, TASK_STATUS_LABELS_AR, type PriorityLevel, type TaskStatus } from "@app/shared";
import { formatDateAr, formatDateTimeAr } from "../utils/formatDate";

export function TaskDetailDialog({
  taskId,
  canEdit,
  onClose,
}: {
  taskId: string;
  canEdit: boolean;
  onClose: () => void;
}) {
  const { data: task } = useTask(taskId);
  const { data: history } = useTaskHistory(taskId);
  const { data: categories } = useCategories();
  const { data: people } = usePeople();
  const { data: comments } = useTaskComments(taskId);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const addMilestone = useAddMilestone();
  const updateMilestone = useUpdateMilestone();
  const deleteMilestone = useDeleteMilestone();
  const addAssignee = useAddAssignee();
  const removeAssignee = useRemoveAssignee();
  const createComment = useCreateComment();
  const deleteCommentMutation = useDeleteComment();

  const [newMilestone, setNewMilestone] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [newComment, setNewComment] = useState("");

  if (!task) return null;

  function patch(data: Record<string, unknown>) {
    if (!task) return;
    updateTask.mutate({ id: task.id, data: { ...data, expectedUpdatedAt: task.updatedAt } });
  }

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <TextField
          variant="standard"
          fullWidth
          value={task.title}
          disabled={!canEdit}
          onChange={(e) => patch({ title: e.target.value })}
          sx={{ "& .MuiInputBase-input": { fontWeight: 700, fontSize: "1.15rem" } }}
        />
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2}>
            <TextField
              select
              label="التصنيف"
              fullWidth
              disabled={!canEdit}
              value={task.categoryId ?? ""}
              onChange={(e) => patch({ categoryId: e.target.value || null })}
            >
              <MenuItem value="">عام</MenuItem>
              {categories?.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.nameAr}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="الأولوية"
              fullWidth
              disabled={!canEdit}
              value={task.priorityLevel}
              onChange={(e) => patch({ priorityLevel: e.target.value as PriorityLevel })}
            >
              {Object.entries(PRIORITY_LEVEL_LABELS_AR).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField
              select
              label="الحالة"
              fullWidth
              disabled={!canEdit}
              value={task.status}
              onChange={(e) => patch({ status: e.target.value as TaskStatus })}
            >
              {Object.entries(TASK_STATUS_LABELS_AR).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              type="date"
              label="تاريخ الإنجاز"
              fullWidth
              disabled={!canEdit}
              InputLabelProps={{ shrink: true }}
              value={task.dueDate ? task.dueDate.slice(0, 10) : ""}
              onChange={(e) => patch({ dueDate: e.target.value || null })}
            />
          </Stack>
          {task.dueDateRaw && (
            <Typography variant="caption" color="text.secondary">
              التاريخ الأصلي من العرض التقديمي: {task.dueDateRaw}
              {task.isOngoing ? " (مستمر)" : ""}
            </Typography>
          )}

          <Box>
            <Typography variant="body2" gutterBottom>
              نسبة الإنجاز: {task.completionPercent}%
            </Typography>
            <Slider
              value={Math.min(100, task.completionPercent)}
              disabled={!canEdit}
              onChangeCommitted={(_e, value) => patch({ completionPercent: value as number })}
            />
          </Box>

          <TextField
            label="آخر تحديث"
            multiline
            minRows={2}
            fullWidth
            disabled={!canEdit}
            value={task.latestUpdateNote ?? ""}
            onChange={(e) => patch({ latestUpdateNote: e.target.value })}
          />

          <Divider />
          <Typography variant="subtitle2" fontWeight={700}>
            المسؤولون
          </Typography>
          <Autocomplete
            multiple
            size="small"
            disabled={!canEdit}
            options={Array.from(
              new Set([
                ...(people ?? []).filter((p) => p.isActive).map((p) => p.name),
                ...task.assignees.map((a) => a.displayName),
              ])
            )}
            value={task.assignees.map((a) => a.displayName)}
            onChange={(_e, newNames) => {
              const current = task.assignees.map((a) => a.displayName);
              for (const name of newNames) {
                if (!current.includes(name)) {
                  addAssignee.mutate({ taskId: task.id, displayName: name });
                }
              }
              for (const a of task.assignees) {
                if (!newNames.includes(a.displayName)) {
                  removeAssignee.mutate({ taskId: task.id, assigneeId: a.id });
                }
              }
            }}
            noOptionsText="لا توجد أسماء متاحة — تُدار القائمة من إدارة الأشخاص"
            renderInput={(params) => <TextField {...params} placeholder="اختر المسؤولين من القائمة" />}
          />

          <Divider />
          <Typography variant="subtitle2" fontWeight={700}>
            معالم المهمة
          </Typography>
          <List dense disablePadding>
            {task.milestones.map((m) => (
              <ListItem
                key={m.id}
                disableGutters
                secondaryAction={
                  canEdit ? (
                    <IconButton
                      size="small"
                      onClick={() => deleteMilestone.mutate({ taskId: task.id, milestoneId: m.id })}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  ) : undefined
                }
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={m.isDone}
                      disabled={!canEdit}
                      onChange={(e) =>
                        updateMilestone.mutate({
                          taskId: task.id,
                          milestoneId: m.id,
                          data: { isDone: e.target.checked },
                        })
                      }
                    />
                  }
                  label={<ListItemText primary={m.label} />}
                />
              </ListItem>
            ))}
          </List>
          {canEdit && (
            <Stack direction="row" spacing={1}>
              <TextField
                size="small"
                fullWidth
                placeholder="معلم جديد"
                value={newMilestone}
                onChange={(e) => setNewMilestone(e.target.value)}
              />
              <Button
                startIcon={<AddIcon />}
                disabled={!newMilestone.trim()}
                onClick={() => {
                  addMilestone.mutate({ taskId: task.id, label: newMilestone.trim() });
                  setNewMilestone("");
                }}
              >
                إضافة
              </Button>
            </Stack>
          )}

          <Divider />
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <MessageIcon fontSize="small" />
              <Typography variant="subtitle2" fontWeight={600}>
                الملاحظات ({comments?.length ?? 0})
              </Typography>
            </Stack>

            {comments && comments.length > 0 && (
              <List dense sx={{ bgcolor: "background.paper", borderRadius: 1, border: "1px solid", borderColor: "divider" }}>
                {comments.map((c) => (
                  <ListItem
                    key={c.id}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => deleteCommentMutation.mutate({ taskId, commentId: c.id })}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={c.text}
                      secondary={`${c.user?.fullName ?? "غير معروف"} · ${formatDateTimeAr(c.createdAt)}`}
                      primaryTypographyProps={{ sx: { wordBreak: "break-word" } }}
                    />
                  </ListItem>
                ))}
              </List>
            )}

            {!comments || comments.length === 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
                لا توجد ملاحظات بعد
              </Typography>
            )}

            {canEdit && (
              <Stack direction="row" spacing={1}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="أضف ملاحظة..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  multiline
                  minRows={2}
                />
                <Button
                  variant="contained"
                  size="small"
                  disabled={!newComment.trim()}
                  onClick={() => {
                    createComment.mutate(
                      { taskId, text: newComment.trim() },
                      { onSuccess: () => setNewComment("") }
                    );
                  }}
                  sx={{ alignSelf: "flex-end" }}
                >
                  إضافة
                </Button>
              </Stack>
            )}
          </Stack>

          <Divider />
          <Button size="small" onClick={() => setShowHistory((s) => !s)}>
            {showHistory ? "إخفاء سجل التعديلات" : "عرض سجل التعديلات"}
          </Button>
          {showHistory && (
            <List dense>
              {history?.map((h) => (
                <ListItem key={h.id} disableGutters>
                  <ListItemText
                    primary={`${h.fieldName}: ${h.oldValue ?? "-"} ← ${h.newValue ?? "-"}`}
                    secondary={`${h.changedBy?.fullName ?? "غير معروف"} · ${formatDateTimeAr(h.changedAt)}`}
                  />
                </ListItem>
              ))}
              {history?.length === 0 && (
                <ListItem>
                  <ListItemText primary="لا يوجد سجل بعد" />
                </ListItem>
              )}
            </List>
          )}

          <Typography variant="caption" color="text.secondary">
            آخر تحديث: {formatDateAr(task.updatedAt)}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        {canEdit && (
          <Button
            color="error"
            onClick={() => {
              if (confirm("هل أنت متأكد من حذف هذه المهمة؟")) {
                deleteTask.mutate(task.id);
                onClose();
              }
            }}
          >
            حذف المهمة
          </Button>
        )}
        <Button onClick={onClose}>إغلاق</Button>
      </DialogActions>
    </Dialog>
  );
}
