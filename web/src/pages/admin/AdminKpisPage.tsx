import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Stack,
} from "@mui/material";
import { useKpis, useUpdateKpi } from "../../api/hooks";

export function AdminKpisPage() {
  const { data: kpis } = useKpis();
  const updateKpi = useUpdateKpi();

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        إدارة المؤشرات
      </Typography>

      <Paper variant="outlined">
        <Typography variant="subtitle1" fontWeight={700} sx={{ p: 2, pb: 1 }}>
          المؤشرات التي تظهر في العرض التقديمي
        </Typography>
        <List>
          {kpis?.map((kpi) => (
            <ListItem
              key={kpi.id}
              secondaryAction={
                <Checkbox
                  edge="end"
                  checked={kpi.isDisplayed ?? true}
                  onChange={(e) => {
                    updateKpi.mutate({
                      id: kpi.id,
                      data: { isDisplayed: e.target.checked },
                    });
                  }}
                />
              }
            >
              <ListItemText
                primary={kpi.name}
                secondary={kpi.targetValue ? `${kpi.achievedValue ?? 0}/${kpi.targetValue}` : "بحاجة لقيم"}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}
