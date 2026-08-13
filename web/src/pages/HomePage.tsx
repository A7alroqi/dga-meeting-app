import {
  Box,
  Typography,
  Paper,
  Grid,
  Stack,
  Chip,
  LinearProgress,
  Divider,
  Checkbox,
  CircularProgress,
} from "@mui/material";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import { useSettings, useTasks, useKpis, useMeetings, useActionPoints } from "../api/hooks";
import { getPerformanceColor, getKpiPercent } from "../utils/kpi";
import { formatDateAr } from "../utils/formatDate";
import { cleanLongText } from "../utils/textUtils";

function CircularStat({
  percent,
  size = 96,
  thickness = 5,
  label,
  sublabel,
}: {
  percent: number;
  size?: number;
  thickness?: number;
  label?: string;
  sublabel?: string;
}) {
  const performance = getPerformanceColor(percent);
  return (
    <Stack alignItems="center" spacing={1}>
      <Box sx={{ position: "relative", display: "inline-flex" }}>
        <CircularProgress
          variant="determinate"
          value={100}
          size={size}
          thickness={thickness}
          sx={{ color: "action.hover" }}
        />
        <CircularProgress
          variant="determinate"
          value={percent}
          size={size}
          thickness={thickness}
          sx={{ color: performance.bg, position: "absolute", left: 0, "& .MuiCircularProgress-circle": { strokeLinecap: "round" } }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="h6" fontWeight={800} sx={{ color: performance.bg }}>
            {percent}%
          </Typography>
        </Box>
      </Box>
      {label && (
        <Typography variant="body2" fontWeight={700} textAlign="center">
          {label}
        </Typography>
      )}
      {sublabel && (
        <Typography variant="caption" color="text.secondary" textAlign="center">
          {sublabel}
        </Typography>
      )}
    </Stack>
  );
}

function KpiMiniRow({ name, percent }: { name: string; percent: number }) {
  const performance = getPerformanceColor(percent);
  return (
    <Box sx={{ py: 1 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
        <Typography variant="body2" sx={{ flex: 1, wordBreak: "break-word" }}>
          {cleanLongText(name)}
        </Typography>
        <Chip
          size="small"
          label={`${percent}%`}
          sx={{ bgcolor: performance.bg, color: "#fff", fontWeight: 700, ml: 1 }}
        />
      </Stack>
      <LinearProgress
        variant="determinate"
        value={percent}
        sx={{
          height: 6,
          borderRadius: 3,
          bgcolor: "action.hover",
          "& .MuiLinearProgress-bar": { bgcolor: performance.bg, borderRadius: 3 },
        }}
      />
    </Box>
  );
}

export function HomePage() {
  const { data: settings } = useSettings();
  const { data: tasks } = useTasks();
  const { data: kpis } = useKpis(2026);
  const { data: meetings } = useMeetings();

  const openTasks = tasks?.filter((t) => t.status !== "completed").length ?? 0;
  const completedTasks = tasks?.filter((t) => t.status === "completed").length ?? 0;
  const totalTasks = openTasks + completedTasks;
  const taskCompletionPercent = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const displayedKpis =
    kpis?.filter((k) => k.isDisplayed !== false && k.targetValue !== null && k.achievedValue !== null) ?? [];
  const overallPercent = displayedKpis.length
    ? Math.round(displayedKpis.reduce((sum, k) => sum + getKpiPercent(k), 0) / displayedKpis.length)
    : 0;

  const lastMeeting = meetings?.[0];
  const { data: lastMeetingActionPoints } = useActionPoints(lastMeeting?.id);
  const doneActionPoints = lastMeetingActionPoints?.filter((ap) => ap.isDone).length ?? 0;
  const totalActionPoints = lastMeetingActionPoints?.length ?? 0;
  const actionPointsPercent = totalActionPoints ? Math.round((doneActionPoints / totalActionPoints) * 100) : 0;

  return (
    <Box>
      <Paper sx={{ p: 4, mb: 3, bgcolor: "primary.main", color: "#fff" }}>
        <Typography variant="h4" fontWeight={900}>
          {settings?.meeting_title ?? "الاجتماع الدوري - مهام تخطيط الابتكار"}
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, mt: 1 }}>
          {settings?.department_name ?? "إدارة تخطيط الابتكار"} - {settings?.year ?? "2026"}
        </Typography>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, display: "flex", justifyContent: "center" }}>
            <CircularStat
              percent={taskCompletionPercent}
              size={110}
              label="نسبة إنجاز المهام"
              sublabel={`${completedTasks} من ${totalTasks || 0} مهمة`}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, display: "flex", justifyContent: "center" }}>
            <CircularStat
              percent={overallPercent}
              size={110}
              label="متوسط تحقق المؤشرات"
              sublabel={displayedKpis.length ? `${displayedKpis.length} مؤشر` : "لا توجد بيانات"}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, display: "flex", justifyContent: "center" }}>
            <CircularStat
              percent={actionPointsPercent}
              size={110}
              label="إنجاز نقاط عمل آخر اجتماع"
              sublabel={totalActionPoints ? `${doneActionPoints} من ${totalActionPoints}` : "لا توجد نقاط عمل"}
            />
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Paper variant="outlined" sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              مؤشرات الابتكار
            </Typography>
            <Divider sx={{ mb: 1 }} />
            {displayedKpis.length ? (
              displayedKpis.map((k, i) => (
                <Box key={k.id}>
                  <KpiMiniRow name={k.name} percent={getKpiPercent(k)} />
                  {i < displayedKpis.length - 1 && <Divider sx={{ my: 0.5 }} />}
                </Box>
              ))
            ) : (
              <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                لا توجد مؤشرات مُدخلة بعد
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper variant="outlined" sx={{ p: 3, height: "100%" }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <EventRoundedIcon fontSize="small" color="action" />
              <Typography variant="subtitle1" fontWeight={700}>
                نقاط عمل آخر اجتماع
              </Typography>
            </Stack>
            {lastMeeting && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                {lastMeeting.title ?? formatDateAr(lastMeeting.meetingDate)}
              </Typography>
            )}
            <Divider sx={{ mb: 1 }} />
            {!lastMeeting ? (
              <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                لا توجد اجتماعات مسجلة بعد
              </Typography>
            ) : lastMeetingActionPoints?.length ? (
              <Stack spacing={0.5}>
                {lastMeetingActionPoints.map((ap) => (
                  <Stack key={ap.id} direction="row" alignItems="flex-start" spacing={1}>
                    <Checkbox checked={ap.isDone} disabled size="small" sx={{ p: 0.5, mt: -0.5 }} />
                    <Typography
                      variant="body2"
                      sx={{
                        textDecoration: ap.isDone ? "line-through" : "none",
                        color: ap.isDone ? "text.secondary" : "text.primary",
                        wordBreak: "break-word",
                      }}
                    >
                      {ap.text}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                لا توجد نقاط عمل مسجلة لهذا الاجتماع
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
