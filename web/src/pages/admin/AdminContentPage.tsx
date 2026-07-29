import { useEffect, useState } from "react";
import { Box, Typography, Paper, TextField, Button, Stack, List, ListItemButton, ListItemText } from "@mui/material";
import { Link } from "react-router-dom";
import { useSettings } from "../../api/hooks";
import { api } from "../../api/client";
import { useQueryClient } from "@tanstack/react-query";

const SECTIONS = [
  { to: "/governance", label: "حوكمة الاجتماع" },
  { to: "/agenda", label: "الأجندة" },
  { to: "/objectives", label: "الهدف وقواعد العمل" },
];

const ADMIN_SETTINGS = [
  { to: "/admin/kpis", label: "إدارة المؤشرات", description: "اختر أي المؤشرات تظهر في العرض" },
];

export function AdminContentPage() {
  const { data: settings } = useSettings();
  const qc = useQueryClient();
  const [meetingTitle, setMeetingTitle] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [year, setYear] = useState("");

  useEffect(() => {
    if (settings) {
      setMeetingTitle(settings.meeting_title ?? "");
      setDepartmentName(settings.department_name ?? "");
      setYear(settings.year ?? "");
    }
  }, [settings]);

  async function saveSettings() {
    await api.patch("/settings", {
      meeting_title: meetingTitle,
      department_name: departmentName,
      year,
    });
    qc.invalidateQueries({ queryKey: ["settings"] });
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        إدارة المحتوى
      </Typography>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          إعدادات عامة
        </Typography>
        <Stack spacing={2} maxWidth={480}>
          <TextField label="عنوان الاجتماع" value={meetingTitle} onChange={(e) => setMeetingTitle(e.target.value)} fullWidth />
          <TextField label="اسم الإدارة" value={departmentName} onChange={(e) => setDepartmentName(e.target.value)} fullWidth />
          <TextField label="السنة" value={year} onChange={(e) => setYear(e.target.value)} fullWidth />
          <Button variant="contained" onClick={saveSettings} sx={{ alignSelf: "flex-start" }}>
            حفظ
          </Button>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ p: 2, pb: 0 }}>
          تعديل محتوى الصفحات
        </Typography>
        <List>
          {SECTIONS.map((s) => (
            <ListItemButton key={s.to} component={Link} to={s.to}>
              <ListItemText primary={s.label} secondary="أدوات الإضافة والحذف متاحة مباشرة داخل الصفحة" />
            </ListItemButton>
          ))}
        </List>
      </Paper>

      <Paper variant="outlined">
        <Typography variant="subtitle1" fontWeight={700} sx={{ p: 2, pb: 0 }}>
          إعدادات العرض
        </Typography>
        <List>
          {ADMIN_SETTINGS.map((s) => (
            <ListItemButton key={s.to} component={Link} to={s.to}>
              <ListItemText primary={s.label} secondary={s.description} />
            </ListItemButton>
          ))}
        </List>
      </Paper>
    </Box>
  );
}
