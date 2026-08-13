import { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  LinearProgress,
  IconButton,
  TextField,
  Stack,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useAuth } from "../AuthContext";
import { isAdmin } from "../components/RoleGuard";
import { usePresenting } from "../components/AppLayout";
import { useKpis, useUpdateKpi } from "../api/hooks";
import type { Kpi } from "../api/types";
import { cleanLongText } from "../utils/textUtils";
import { getPerformanceColor, getKpiPercent } from "../utils/kpi";

function KpiCard({ kpi, canEdit }: { kpi: Kpi; canEdit: boolean }) {
  const updateMutation = useUpdateKpi();
  const [editing, setEditing] = useState(false);
  const [target, setTarget] = useState(kpi.targetValue?.toString() ?? "");
  const [achieved, setAchieved] = useState(kpi.achievedValue?.toString() ?? "");

  const hasValues = kpi.targetValue !== null && kpi.achievedValue !== null;
  const percent = hasValues ? getKpiPercent(kpi) : 0;
  const performance = getPerformanceColor(percent);

  return (
    <Paper sx={{ p: 2.5, height: "100%", borderLeft: `4px solid ${performance.bg}` }} variant="outlined">
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Stack sx={{ flex: 1 }}>
          <Typography
            variant="subtitle2"
            fontWeight={700}
            sx={{
              wordBreak: "break-word",
              overflowWrap: "break-word",
              hyphens: "auto"
            }}
          >
            {cleanLongText(kpi.name)}
          </Typography>
          <Chip
            size="small"
            label={performance.label}
            sx={{
              bgcolor: performance.bg,
              color: "#fff",
              fontWeight: 700,
              mt: 1,
              alignSelf: "flex-start"
            }}
          />
        </Stack>
        {canEdit && !editing && (
          <IconButton size="small" onClick={() => setEditing(true)}>
            <EditIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>

      {!hasValues && !editing && (
        <Chip
          size="small"
          icon={<WarningAmberIcon />}
          label="بحاجة لإدخال القيم"
          color="warning"
          sx={{ mt: 1 }}
        />
      )}

      {editing ? (
        <Stack direction="row" spacing={1} sx={{ mt: 2 }} alignItems="center">
          <TextField
            size="small"
            label="المحقق"
            type="number"
            value={achieved}
            onChange={(e) => setAchieved(e.target.value)}
          />
          <TextField
            size="small"
            label="المستهدف"
            type="number"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
          <IconButton
            color="primary"
            onClick={() => {
              updateMutation.mutate({
                id: kpi.id,
                data: {
                  achievedValue: achieved === "" ? null : Number(achieved),
                  targetValue: target === "" ? null : Number(target),
                },
              });
              setEditing(false);
            }}
          >
            <CheckIcon />
          </IconButton>
          <IconButton onClick={() => setEditing(false)}>
            <CloseIcon />
          </IconButton>
        </Stack>
      ) : (
        hasValues && (
          <Box sx={{ mt: 2 }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                المحقق: {kpi.achievedValue}
                {kpi.achievedUnit}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                المستهدف: {kpi.targetValue}
                {kpi.targetUnit}
              </Typography>
            </Stack>
            <LinearProgress variant="determinate" value={percent} sx={{ height: 8, borderRadius: 4 }} />
          </Box>
        )
      )}
    </Paper>
  );
}

export function KpiDashboardPage() {
  const { user } = useAuth();
  const presenting = usePresenting();
  const canEdit = isAdmin(user?.role) && !presenting;
  const { data: kpis } = useKpis(2026);

  const filtered = presenting ? kpis?.filter((k) => k.isDisplayed !== false) ?? [] : kpis ?? [];
  const strategic = filtered.filter((k) => k.kpiType === "strategic") ?? [];
  const operational = filtered.filter((k) => k.kpiType === "operational") ?? [];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        مؤشرات الابتكار لعام 2026
      </Typography>

      <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 2, mb: 1 }}>
        المؤشرات الاستراتيجية
      </Typography>
      <Grid container spacing={2}>
        {strategic.map((k) => (
          <Grid item xs={12} sm={6} key={k.id}>
            <KpiCard kpi={k} canEdit={canEdit} />
          </Grid>
        ))}
      </Grid>

      <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 3, mb: 1 }}>
        المؤشرات التشغيلية
      </Typography>
      <Grid container spacing={2}>
        {operational.map((k) => (
          <Grid item xs={12} sm={6} md={4} key={k.id}>
            <KpiCard kpi={k} canEdit={canEdit} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
