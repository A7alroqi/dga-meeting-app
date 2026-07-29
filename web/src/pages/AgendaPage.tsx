import { useState } from "react";
import {
  Box,
  Typography,
  Stack,
  IconButton,
  TextField,
  Button,
  Tooltip,
} from "@mui/material";
import { Link } from "react-router-dom";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useAuth } from "../AuthContext";
import { isAdmin } from "../components/RoleGuard";
import { usePresenting } from "../components/AppLayout";
import { useAgendaItems, useCreateAgendaItem, useDeleteAgendaItem, useMeetingFiles } from "../api/hooks";
import { fileKind } from "./FilesPage";
import { DGA } from "../theme/rtlTheme";

// Styled to mirror the DGA deck's agenda slide: big navy title with a teal
// rule + dashed line, teal numbers, navy bold items, and a "files to be
// reviewed" section that auto-lists the uploaded meeting files.
export function AgendaPage() {
  const { user } = useAuth();
  const presenting = usePresenting();
  const canEdit = isAdmin(user?.role) && !presenting;

  const { data: items } = useAgendaItems();
  const { data: files } = useMeetingFiles();
  const createMutation = useCreateAgendaItem();
  const deleteMutation = useDeleteAgendaItem();
  const [draft, setDraft] = useState("");

  const sorted = [...(items ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const filesIndex = sorted.length + 1;

  return (
    <Box sx={{ maxWidth: 860, mx: "auto" }}>
      {/* Slide-style title */}
      <Box sx={{ mb: 5, mt: presenting ? 2 : 0 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 900,
            color: DGA.navy,
            letterSpacing: presenting ? 8 : 4,
            mb: 1.5,
          }}
        >
          الأجــــنــــدة
        </Typography>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ width: 180, height: 3, bgcolor: DGA.teal, borderRadius: 2 }} />
          <Box sx={{ flex: 1, maxWidth: 260, borderBottom: `3px dashed ${DGA.teal}`, opacity: 0.7 }} />
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: DGA.teal }} />
        </Stack>
      </Box>

      {/* Numbered agenda items */}
      <Stack spacing={presenting ? 3 : 2}>
        {sorted.map((item, i) => (
          <Stack key={item.id} direction="row" alignItems="center" spacing={2}>
            <Typography
              sx={{ color: DGA.teal, fontWeight: 900, fontSize: presenting ? 26 : 22, minWidth: 36 }}
            >
              .{i + 1}
            </Typography>
            <Typography sx={{ color: DGA.navy, fontWeight: 700, fontSize: presenting ? 24 : 19, flex: 1 }}>
              {item.label}
            </Typography>
            {canEdit && (
              <Tooltip title="حذف">
                <IconButton size="small" onClick={() => deleteMutation.mutate(item.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        ))}

        {/* Files section — mirrors "الملفات التي سيتم استعراضها" on the slide */}
        <Stack direction="row" alignItems="flex-start" spacing={2}>
          <Typography sx={{ color: DGA.teal, fontWeight: 900, fontSize: presenting ? 26 : 22, minWidth: 36 }}>
            .{filesIndex}
          </Typography>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ color: DGA.navy, fontWeight: 700, fontSize: presenting ? 24 : 19, mb: 1 }}>
              الملفات التي سيتم استعراضها :
            </Typography>
            <Stack spacing={1} sx={{ pr: 2 }}>
              {files?.map((f, j) => {
                const viewable = fileKind(f) === "pdf" || fileKind(f) === "image";
                return (
                  <Stack key={f.id} direction="row" alignItems="center" spacing={1.5}>
                    <Typography sx={{ color: DGA.teal, fontWeight: 700, fontSize: presenting ? 20 : 16 }}>
                      .{j + 1}
                    </Typography>
                    <Typography
                      component={viewable ? Link : "span"}
                      to={viewable ? `/files/${f.id}` : undefined}
                      sx={{
                        color: DGA.teal,
                        fontWeight: 700,
                        fontSize: presenting ? 20 : 16,
                        textDecoration: "none",
                        "&:hover": viewable ? { textDecoration: "underline" } : undefined,
                      }}
                    >
                      {f.title}
                    </Typography>
                  </Stack>
                );
              })}
              {files?.length === 0 && !presenting && (
                <Typography variant="body2" color="text.secondary">
                  لا توجد ملفات — تُضاف تلقائياً هنا عند رفعها في صفحة الملفات
                </Typography>
              )}
            </Stack>
          </Box>
        </Stack>
      </Stack>

      {canEdit && (
        <Stack direction="row" spacing={1} sx={{ mt: 5 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="عنصر أجندة جديد"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && draft.trim()) {
                createMutation.mutate(draft.trim());
                setDraft("");
              }
            }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            disabled={!draft.trim()}
            onClick={() => {
              createMutation.mutate(draft.trim());
              setDraft("");
            }}
          >
            إضافة
          </Button>
        </Stack>
      )}
    </Box>
  );
}
