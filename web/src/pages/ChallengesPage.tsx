import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  Paper,
  Grid,
  Chip,
  Stack,
  IconButton,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import { useAuth } from "../AuthContext";
import { canWriteTasks } from "../components/RoleGuard";
import { usePresenting } from "../components/AppLayout";
import { useMeetings, useCreateMeeting, useChallenges, useCreateChallenge, useDeleteChallenge } from "../api/hooks";
import { formatDateAr } from "../utils/formatDate";
import { cleanLongText } from "../utils/textUtils";
import type { Challenge } from "../api/types";

function ChallengeCard({ challenge, canEdit, onDelete }: { challenge: Challenge; canEdit: boolean; onDelete: () => void }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        position: "relative",
        border: "1px solid",
        borderColor: "warning.light",
        backgroundColor: "rgba(254, 169, 43, 0.03)",
        "&:hover": { boxShadow: 2, borderColor: "warning.main" },
        transition: "all 0.2s",
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start" justifyContent="space-between">
        <Stack sx={{ flex: 1 }}>
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <WarningRoundedIcon sx={{ color: "warning.main", mt: 0.3 }} />
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{
                wordBreak: "break-word",
                overflowWrap: "break-word",
                hyphens: "auto"
              }}
            >
              {cleanLongText(challenge.description)}
            </Typography>
          </Stack>

          {challenge.supportNeeded && (
            <Box sx={{ mt: 1.5, ml: 4 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                الدعم المطلوب:
              </Typography>
              <Chip
                size="small"
                label={challenge.supportNeeded}
                variant="outlined"
                sx={{ backgroundColor: "rgba(26, 192, 130, 0.08)" }}
              />
            </Box>
          )}
        </Stack>

        {canEdit && (
          <IconButton
            size="small"
            onClick={onDelete}
            sx={{ mt: -0.5, color: "error.main", "&:hover": { backgroundColor: "error.lighter" } }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>
    </Paper>
  );
}

export function ChallengesPage() {
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

  const { data: challenges } = useChallenges(meetingId || undefined);
  const createChallenge = useCreateChallenge();
  const deleteChallenge = useDeleteChallenge();

  const [description, setDescription] = useState("");
  const [support, setSupport] = useState("");

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>
          التحديات والدعم المطلوب
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

      <Grid container spacing={2} sx={{ mb: 4 }}>
        {challenges?.length ? (
          challenges.map((c) => (
            <Grid item xs={12} sm={6} md={4} key={c.id}>
              <ChallengeCard challenge={c} canEdit={canEdit} onDelete={() => deleteChallenge.mutate(c.id)} />
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
              <Typography color="text.secondary">لا توجد تحديات مسجلة لهذا الاجتماع</Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {canEdit && meetingId && (
        <Paper variant="outlined" sx={{ p: 3, backgroundColor: "rgba(27, 22, 81, 0.02)" }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
            إضافة تحدي جديد
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Stack spacing={2}>
            <TextField
              label="التحدي"
              placeholder="صِف التحدي أو المشكلة..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              minRows={2}
              variant="outlined"
            />
            <TextField
              label="الدعم المطلوب"
              placeholder="ما نوع الدعم اللازم؟"
              value={support}
              onChange={(e) => setSupport(e.target.value)}
              fullWidth
              multiline
              minRows={2}
              variant="outlined"
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              disabled={!description.trim()}
              onClick={() => {
                createChallenge.mutate(
                  { meetingId, data: { description: description.trim(), supportNeeded: support.trim() || undefined } },
                  {
                    onSuccess: () => {
                      setDescription("");
                      setSupport("");
                    },
                  }
                );
              }}
              sx={{ alignSelf: "flex-start" }}
            >
              إضافة التحدي
            </Button>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
