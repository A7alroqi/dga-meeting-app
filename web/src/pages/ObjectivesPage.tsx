import { Typography, Box, Grid } from "@mui/material";
import { useAuth } from "../AuthContext";
import { isAdmin } from "../components/RoleGuard";
import { usePresenting } from "../components/AppLayout";
import { SimpleListEditor } from "../components/SimpleListEditor";
import {
  useObjectives,
  useCreateObjective,
  useDeleteObjective,
  useGroundRules,
  useCreateGroundRule,
  useDeleteGroundRule,
} from "../api/hooks";

export function ObjectivesPage() {
  const { user } = useAuth();
  const presenting = usePresenting();
  const canEdit = isAdmin(user?.role) && !presenting;

  const { data: objectives } = useObjectives();
  const createObjective = useCreateObjective();
  const deleteObjective = useDeleteObjective();

  const { data: groundRules } = useGroundRules();
  const createGroundRule = useCreateGroundRule();
  const deleteGroundRule = useDeleteGroundRule();

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        الهدف من الاجتماع وقواعد العمل
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            الهدف من الاجتماع
          </Typography>
          <SimpleListEditor
            items={objectives ?? []}
            field="text"
            canEdit={canEdit}
            onAdd={(value) => createObjective.mutate(value)}
            onDelete={(id) => deleteObjective.mutate(id)}
            placeholder="هدف جديد"
          />
        </Grid>
        <Grid item xs={12} md={5}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            قواعد عامة
          </Typography>
          <SimpleListEditor
            items={groundRules ?? []}
            field="text"
            canEdit={canEdit}
            onAdd={(value) => createGroundRule.mutate(value)}
            onDelete={(id) => deleteGroundRule.mutate(id)}
            placeholder="قاعدة جديدة"
          />
        </Grid>
      </Grid>
    </Box>
  );
}
