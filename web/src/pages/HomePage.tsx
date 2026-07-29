import { Box, Typography, Paper, Grid } from "@mui/material";
import { useSettings, useTasks, useKpis } from "../api/hooks";

export function HomePage() {
  const { data: settings } = useSettings();
  const { data: tasks } = useTasks();
  const { data: kpis } = useKpis();

  const openTasks = tasks?.filter((t) => t.status !== "completed").length ?? 0;
  const completedTasks = tasks?.filter((t) => t.status === "completed").length ?? 0;

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

      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="h3" fontWeight={800} color="secondary.main">
              {openTasks}
            </Typography>
            <Typography color="text.secondary">مهام جارية</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="h3" fontWeight={800} color="success.main">
              {completedTasks}
            </Typography>
            <Typography color="text.secondary">مهام مكتملة</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="h3" fontWeight={800} color="primary.main">
              {kpis?.length ?? 0}
            </Typography>
            <Typography color="text.secondary">مؤشرات الأداء</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
