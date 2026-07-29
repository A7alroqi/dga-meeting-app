import { Box, Typography, Button, Paper, Stack } from "@mui/material";
import { Link, useParams } from "react-router-dom";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import { useMeetingFiles } from "../api/hooks";
import { usePresenting } from "../components/AppLayout";
import { fileKind } from "./FilesPage";

export function FileViewerPage() {
  const { id } = useParams<{ id: string }>();
  const { data: files } = useMeetingFiles();
  const presenting = usePresenting();
  const file = files?.find((f) => f.id === id);

  if (!file) return null;

  const kind = fileKind(file);
  const contentUrl = `/api/files/${file.id}/content`;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>
          {file.title}
        </Typography>
        <Button component={Link} to="/files" startIcon={<ArrowForwardRoundedIcon />}>
          عودة للملفات
        </Button>
      </Stack>

      {kind === "pdf" && (
        <Box
          component="iframe"
          src={contentUrl}
          title={file.title}
          sx={{
            width: "100%",
            height: presenting ? "78vh" : "75vh",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            bgcolor: "#fff",
          }}
        />
      )}

      {kind === "image" && (
        <Paper variant="outlined" sx={{ p: 2, textAlign: "center" }}>
          <Box component="img" src={contentUrl} alt={file.title} sx={{ maxWidth: "100%", maxHeight: "75vh" }} />
        </Paper>
      )}

      {kind !== "pdf" && kind !== "image" && (
        <Paper variant="outlined" sx={{ p: 6, textAlign: "center" }}>
          <Typography sx={{ mb: 2 }}>
            هذا النوع من الملفات لا يُعرض مباشرة في المتصفح — حمّله لفتحه في برنامجه
          </Typography>
          <Button
            variant="contained"
            startIcon={<DownloadRoundedIcon />}
            component="a"
            href={`${contentUrl}?download=1`}
          >
            تحميل {file.originalName}
          </Button>
        </Paper>
      )}
    </Box>
  );
}
