import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  Paper,
  Stack,
  IconButton,
  Checkbox,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAuth } from "../AuthContext";
import { canWriteTasks } from "../components/RoleGuard";
import { usePresenting } from "../components/AppLayout";
import {
  useMeetings,
  useCreateMeeting,
  useActionPoints,
  useCreateActionPoint,
  useUpdateActionPoint,
  useDeleteActionPoint,
} from "../api/hooks";
import { formatDateAr } from "../utils/formatDate";
import type { ActionPoint } from "../api/types";

function ActionPointRow({
  actionPoint,
  canEdit,
  onToggle,
  onDelete,
}: {
  actionPoint: ActionPoint;
  canEdit: boolean;
  onToggle: (isDone: boolean) => void;
  onDelete: () => void;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        px: 2,
        py: 1,
        display: "flex",
        alignItems: "center",
        gap: 1,
        "&:hover": { boxShadow: 1 },
      }}
    >
      <Checkbox
        checked={actionPoint.isDone}
        onChange={(e) => onToggle(e.target.checked)}
        disabled={!canEdit}
      />
      <Typography
        sx={{
          flex: 1,
          textDecoration: actionPoint.isDone ? "line-through" : "none",
          color: actionPoint.isDone ? "text.secondary" : "text.primary",
          wordBreak: "break-word",
        }}
      >
        {actionPoint.text}
      </Typography>
      {canEdit && (
        <IconButton size="small" onClick={onDelete} sx={{ color: "error.main" }}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      )}
    </Paper>
  );
}

export function MinutesPage() {
  const { user } = useAuth();
  const presenting = usePresenting();
  const canEdit = canWriteTasks(user?.role) && !presenting;
  const { data: meetings } = useMeetings();
  const createMeeting = useCreateMeeting();
  const [meetingId, setMeetingId] = useState<string>("");

  useEffect(() => {
    if (!meetingId && meetings && meetings.length > 0) {
      setMeetingId(meetings[0].id);
    }
  }, [meetings, meetingId]);

  const { data: actionPoints } = useActionPoints(meetingId || undefined);
  const createActionPoint = useCreateActionPoint();
  const updateActionPoint = useUpdateActionPoint();
  const deleteActionPoint = useDeleteActionPoint();

  const [text, setText] = useState("");

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>
          محضر الاجتماع - نقاط العمل
        </Typography>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mb: 3 }} alignItems="center" flexWrap="wrap">
        <TextField
          select
          size="small"
          label="الاجتماع"
          value={meetingId}
          onChange={(e) => setMeetingId(e.target.value)}
          sx={{ minWidth: 220 }}
        >
          {meetings?.map((m) => (
            <MenuItem key={m.id} value={m.id}>
              {m.title ?? formatDateAr(m.meetingDate)}
            </MenuItem>
          ))}
        </TextField>
        {canEdit && (
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() =>
              createMeeting.mutate(
                { meetingDate: new Date().toISOString() },
                { onSuccess: (m) => setMeetingId(m.id) }
              )
            }
          >
            اجتماع جديد
          </Button>
        )}
      </Stack>

      <Stack spacing={1.5} sx={{ mb: 4 }}>
        {actionPoints?.length ? (
          actionPoints.map((ap) => (
            <ActionPointRow
              key={ap.id}
              actionPoint={ap}
              canEdit={canEdit}
              onToggle={(isDone) =>
                updateActionPoint.mutate({ id: ap.id, meetingId, data: { isDone } })
              }
              onDelete={() => deleteActionPoint.mutate({ id: ap.id, meetingId })}
            />
          ))
        ) : (
          <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
            <Typography color="text.secondary">لا توجد نقاط عمل مسجلة لهذا الاجتماع</Typography>
          </Paper>
        )}
      </Stack>

      {canEdit && meetingId && (
        <Paper variant="outlined" sx={{ p: 3, backgroundColor: "rgba(27, 22, 81, 0.02)" }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
            إضافة نقطة عمل جديدة
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack direction="row" spacing={2}>
            <TextField
              placeholder="صِف نقطة العمل..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              fullWidth
              variant="outlined"
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              disabled={!text.trim()}
              onClick={() => {
                createActionPoint.mutate(
                  { meetingId, text: text.trim() },
                  { onSuccess: () => setText("") }
                );
              }}
            >
              إضافة
            </Button>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
