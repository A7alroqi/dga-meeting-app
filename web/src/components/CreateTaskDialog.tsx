import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  FormControlLabel,
  Checkbox,
  Autocomplete,
} from "@mui/material";
import { useCategories, useCreateTask, usePeople } from "../api/hooks";
import { PRIORITY_LEVEL_LABELS_AR, type PriorityLevel } from "@app/shared";

export function CreateTaskDialog({ onClose }: { onClose: () => void }) {
  const { data: categories } = useCategories();
  const { data: people } = usePeople();
  const createTask = useCreateTask();

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priorityLevel, setPriorityLevel] = useState<PriorityLevel>("medium");
  const [dueDate, setDueDate] = useState("");
  const [isOngoing, setIsOngoing] = useState(false);
  const [assignees, setAssignees] = useState<string[]>([]);

  function submit() {
    if (!title.trim()) return;
    createTask.mutate(
      {
        title: title.trim(),
        categoryId: categoryId || null,
        priorityLevel,
        dueDate: isOngoing ? null : dueDate || null,
        isOngoing,
        assignees: assignees.map((name) => ({ displayName: name })),
      },
      { onSuccess: onClose }
    );
  }

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>مهمة جديدة</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="عنوان المهمة" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus fullWidth />
          <TextField
            select
            label="التصنيف"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            fullWidth
          >
            <MenuItem value="">عام</MenuItem>
            {categories?.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.nameAr}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="الأولوية"
            value={priorityLevel}
            onChange={(e) => setPriorityLevel(e.target.value as PriorityLevel)}
            fullWidth
          >
            {Object.entries(PRIORITY_LEVEL_LABELS_AR).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            type="date"
            label="تاريخ الإنجاز المستهدف"
            InputLabelProps={{ shrink: true }}
            value={dueDate}
            disabled={isOngoing}
            onChange={(e) => setDueDate(e.target.value)}
            fullWidth
          />
          <FormControlLabel
            control={<Checkbox checked={isOngoing} onChange={(e) => setIsOngoing(e.target.checked)} />}
            label="مهمة مستمرة (بدون تاريخ إنجاز محدد)"
          />
          <Autocomplete
            multiple
            options={(people ?? []).filter((p) => p.isActive).map((p) => p.name)}
            value={assignees}
            onChange={(_e, value) => setAssignees(value)}
            noOptionsText="لا توجد أسماء متاحة — تُدار القائمة من إدارة الأشخاص"
            renderInput={(params) => <TextField {...params} label="المسؤولون" placeholder="اختر من القائمة" />}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>إلغاء</Button>
        <Button variant="contained" onClick={submit} disabled={!title.trim()}>
          إنشاء
        </Button>
      </DialogActions>
    </Dialog>
  );
}
