import { useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Chip,
  Switch,
  MenuItem,
  Select,
  Button,
  TextField,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useUsers, useCreateUser, useUpdateUser } from "../../api/hooks";
import { ROLES, ROLE_LABELS_AR, type Role } from "@app/shared";
import { formatDateAr } from "../../utils/formatDate";

function CreateUserDialog({ onClose }: { onClose: () => void }) {
  const createUser = useCreateUser();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("employee");
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>مستخدم جديد</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="الاسم الكامل" value={fullName} onChange={(e) => setFullName(e.target.value)} fullWidth />
          <TextField label="البريد الإلكتروني" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
          <TextField
            label="كلمة المرور"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            helperText="8 أحرف على الأقل"
          />
          <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {ROLES.map((r) => (
              <MenuItem key={r} value={r}>
                {ROLE_LABELS_AR[r]}
              </MenuItem>
            ))}
          </Select>
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>إلغاء</Button>
        <Button
          variant="contained"
          onClick={() => {
            setError(null);
            createUser.mutate(
              { email, fullName, password, role },
              { onSuccess: onClose, onError: (err) => setError((err as Error).message) }
            );
          }}
        >
          إنشاء
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function AdminUsersPage() {
  const { data: users } = useUsers();
  const updateUser = useUpdateUser();
  const [creating, setCreating] = useState(false);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>
          إدارة المستخدمين
        </Typography>
        <Button variant="contained" onClick={() => setCreating(true)}>
          مستخدم جديد
        </Button>
      </Stack>
      <Paper variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>الاسم</TableCell>
              <TableCell>البريد الإلكتروني</TableCell>
              <TableCell>الدور</TableCell>
              <TableCell>مفعّل</TableCell>
              <TableCell>آخر دخول</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users?.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.fullName}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Select
                    size="small"
                    value={u.role}
                    onChange={(e) => updateUser.mutate({ id: u.id, data: { role: e.target.value } })}
                  >
                    {ROLES.map((r) => (
                      <MenuItem key={r} value={r}>
                        {ROLE_LABELS_AR[r]}
                      </MenuItem>
                    ))}
                  </Select>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={u.isActive}
                    onChange={(e) => updateUser.mutate({ id: u.id, data: { isActive: e.target.checked } })}
                  />
                </TableCell>
                <TableCell>
                  {u.lastLoginAt ? formatDateAr(u.lastLoginAt) : <Chip size="small" label="لم يسجل الدخول بعد" />}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      {creating && <CreateUserDialog onClose={() => setCreating(false)} />}
    </Box>
  );
}
