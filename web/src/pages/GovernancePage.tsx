import { useState } from "react";
import {
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  IconButton,
  TextField,
  Button,
  Box,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useAuth } from "../AuthContext";
import { isAdmin } from "../components/RoleGuard";
import { usePresenting } from "../components/AppLayout";
import { useGovernanceItems, useCreateGovernanceItem, useDeleteGovernanceItem } from "../api/hooks";

export function GovernancePage() {
  const { user } = useAuth();
  const presenting = usePresenting();
  const canEdit = isAdmin(user?.role) && !presenting;
  const { data: items } = useGovernanceItems();
  const createMutation = useCreateGovernanceItem();
  const deleteMutation = useDeleteGovernanceItem();
  const [task, setTask] = useState("");
  const [responsible, setResponsible] = useState("");

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        حوكمة الاجتماع
      </Typography>
      <Paper variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>المهمة</TableCell>
              <TableCell>المسؤولية</TableCell>
              {canEdit && <TableCell width={60} />}
            </TableRow>
          </TableHead>
          <TableBody>
            {[...(items ?? [])]
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.responsibilityTask}</TableCell>
                  <TableCell>{item.responsibleText}</TableCell>
                  {canEdit && (
                    <TableCell>
                      <IconButton size="small" onClick={() => deleteMutation.mutate(item.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
          </TableBody>
        </Table>
        {canEdit && (
          <Box display="flex" gap={1} p={2}>
            <TextField
              size="small"
              label="المهمة"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              fullWidth
            />
            <TextField
              size="small"
              label="المسؤولية"
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
              fullWidth
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              disabled={!task.trim() || !responsible.trim()}
              onClick={() => {
                createMutation.mutate({ responsibilityTask: task.trim(), responsibleText: responsible.trim() });
                setTask("");
                setResponsible("");
              }}
            >
              إضافة
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
