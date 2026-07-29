import { useRef, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Stack,
  Tooltip,
  Alert,
  Chip,
} from "@mui/material";
import { Link } from "react-router-dom";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import DeleteIcon from "@mui/icons-material/Delete";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import SlideshowRoundedIcon from "@mui/icons-material/SlideshowRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import TableChartRoundedIcon from "@mui/icons-material/TableChartRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import { useAuth } from "../AuthContext";
import { canWriteTasks } from "../components/RoleGuard";
import { usePresenting } from "../components/AppLayout";
import { useMeetingFiles, useUploadFile, useDeleteFile } from "../api/hooks";
import type { MeetingFile } from "../api/types";
import { DGA } from "../theme/rtlTheme";

export function fileKind(f: MeetingFile): "pdf" | "slides" | "doc" | "sheet" | "image" {
  const name = f.originalName.toLowerCase();
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".ppt") || name.endsWith(".pptx")) return "slides";
  if (name.endsWith(".xls") || name.endsWith(".xlsx")) return "sheet";
  if (name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image";
  return "doc";
}

const KIND_META = {
  pdf: { icon: PictureAsPdfRoundedIcon, label: "PDF", color: "#B30001" },
  slides: { icon: SlideshowRoundedIcon, label: "عرض تقديمي", color: DGA.amber },
  doc: { icon: DescriptionRoundedIcon, label: "مستند", color: DGA.navyLight },
  sheet: { icon: TableChartRoundedIcon, label: "جدول", color: DGA.green },
  image: { icon: ImageRoundedIcon, label: "صورة", color: DGA.teal },
} as const;

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} كيلوبايت`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} ميجابايت`;
}

export function FilesPage() {
  const { user } = useAuth();
  const presenting = usePresenting();
  const canEdit = canWriteTasks(user?.role) && !presenting;
  const { data: files } = useMeetingFiles();
  const uploadMutation = useUploadFile();
  const deleteMutation = useDeleteFile();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    uploadMutation.mutate({ file }, { onError: (err) => setError((err as Error).message) });
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>
          الملفات التي سيتم استعراضها
        </Typography>
        {canEdit && (
          <>
            <input
              ref={inputRef}
              type="file"
              hidden
              accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              onChange={onPickFile}
            />
            <Button
              variant="contained"
              startIcon={<UploadFileRoundedIcon />}
              onClick={() => inputRef.current?.click()}
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? "جاري الرفع..." : "رفع ملف"}
            </Button>
          </>
        )}
      </Stack>

      {canEdit && (
        <Alert severity="info" sx={{ mb: 2 }}>
          ملفات PDF والصور تُعرض مباشرة داخل وضع العرض. ملفات PowerPoint وWord تُحمّل للفتح في
          برنامجها — يُفضّل تصديرها PDF قبل الرفع إذا أردت عرضها داخل الاجتماع.
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Stack spacing={1.5}>
        {files?.map((f) => {
          const kind = fileKind(f);
          const meta = KIND_META[kind];
          const Icon = meta.icon;
          const viewable = kind === "pdf" || kind === "image";
          return (
            <Paper key={f.id} variant="outlined" sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: `${meta.color}22`,
                  color: meta.color,
                  flexShrink: 0,
                }}
              >
                <Icon />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography fontWeight={700} noWrap>
                  {f.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {meta.label} · {formatSize(f.sizeBytes)}
                </Typography>
              </Box>
              {viewable ? (
                <Button
                  component={Link}
                  to={`/files/${f.id}`}
                  variant="outlined"
                  startIcon={<PlayArrowRoundedIcon />}
                  size="small"
                >
                  عرض
                </Button>
              ) : (
                <Chip size="small" label="غير قابل للعرض المباشر" variant="outlined" />
              )}
              <Tooltip title="تحميل">
                <IconButton component="a" href={`/api/files/${f.id}/content?download=1`} size="small">
                  <DownloadRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              {canEdit && (
                <Tooltip title="حذف">
                  <IconButton size="small" color="error" onClick={() => deleteMutation.mutate(f.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Paper>
          );
        })}
        {files?.length === 0 && (
          <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary">
              لا توجد ملفات بعد — الملفات المرفوعة هنا تظهر تلقائياً في أجندة الاجتماع
            </Typography>
          </Paper>
        )}
      </Stack>
    </Box>
  );
}
