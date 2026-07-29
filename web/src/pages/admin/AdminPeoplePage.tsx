import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  TextField,
  Button,
  IconButton,
  Chip,
  Tooltip,
  Alert,
  Switch,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import { usePeople, useCreatePerson, useUpdatePerson, useDeletePerson } from "../../api/hooks";
import { DGA } from "../../theme/rtlTheme";

export function AdminPeoplePage() {
  const { data: people } = usePeople();
  const createMutation = useCreatePerson();
  const updateMutation = useUpdatePerson();
  const deleteMutation = useDeletePerson();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  function addPerson() {
    const name = draft.trim();
    if (!name) return;
    setError(null);
    createMutation.mutate(name, {
      onSuccess: () => setDraft(""),
      onError: (err) => setError((err as Error).message),
    });
  }

  return (
    <Box sx={{ maxWidth: 640 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        إدارة الأشخاص
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        قائمة الأسماء المعتمدة لإسناد المهام — الموظفون يختارون من هذه القائمة فقط ولا يمكنهم كتابة
        أسماء جديدة. عطّل الاسم بدلاً من حذفه إذا كان مستخدماً في مهام سابقة.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={1}>
          <TextField
            size="small"
            fullWidth
            placeholder="اسم جديد"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPerson()}
          />
          <Button variant="contained" startIcon={<AddIcon />} disabled={!draft.trim()} onClick={addPerson}>
            إضافة
          </Button>
        </Stack>
      </Paper>

      <Stack spacing={1}>
        {people?.map((p) => (
          <Paper key={p.id} variant="outlined" sx={{ p: 1.5, display: "flex", alignItems: "center", gap: 1.5 }}>
            <PersonRoundedIcon sx={{ color: p.isActive ? DGA.teal : "text.disabled" }} />
            <Typography sx={{ flex: 1, opacity: p.isActive ? 1 : 0.5 }} fontWeight={600}>
              {p.name}
            </Typography>
            {!p.isActive && <Chip size="small" label="معطّل" variant="outlined" />}
            <Tooltip title={p.isActive ? "تعطيل" : "تفعيل"}>
              <Switch
                size="small"
                checked={p.isActive}
                onChange={(e) => updateMutation.mutate({ id: p.id, data: { isActive: e.target.checked } })}
              />
            </Tooltip>
            <Tooltip title="حذف نهائي">
              <IconButton size="small" color="error" onClick={() => deleteMutation.mutate(p.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Paper>
        ))}
        {people?.length === 0 && (
          <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
            <Typography color="text.secondary">لا توجد أسماء بعد</Typography>
          </Paper>
        )}
      </Stack>
    </Box>
  );
}
