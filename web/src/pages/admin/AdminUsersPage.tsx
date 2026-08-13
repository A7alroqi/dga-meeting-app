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
  DialogContentText,
  DialogActions,
  IconButton,
  Tooltip,
} from "@mui/material";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "../../api/hooks";
import { ROLES, ROLE_LABELS_AR, type Role } from "@app/shared";
import { formatDateAr } from "../../utils/formatDate";
import { useAuth } from "../../AuthContext";
import { ApiError } from "../../api/client";

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

function DeleteUserDialog({
  user,
  onClose,
}: {
  user: { id: string; fullName: string; email: string };
  onClose: () => void;
}) {
  const deleteUser = useDeleteUser();
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>حذف المستخدم</DialogTitle>
      <DialogContent>
        <DialogContentText>
          هل أنت متأكد من حذف "{user.fullName}" ({user.email})؟ هذا الإجراء لا يمكن التراجع عنه.
        </DialogContentText>
        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>إلغاء</Button>
        <Button
          color="error"
          variant="contained"
          onClick={() => {
            setError(null);
            deleteUser.mutate(user.id, {
              onSuccess: onClose,
              onError: (err) => setError(err instanceof ApiError ? err.message : "حدث خطأ"),
            });
          }}
        >
          حذف
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function AdminUsersPage() {
  const { data: users } = useUsers();
  const { user: currentUser } = useAuth();
  const updateUser = useUpdateUser();
  const [creating, setCreating] = useState(false);
  const [deletingUser, setDeletingUser] = useState<{ id: string; fullName: string; email: string } | null>(null);

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
              <TableCell />
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
                <TableCell align="center">
                  <Tooltip title={u.id === currentUser?.id ? "لا يمكنك حذف حسابك الخاص" : "حذف المستخدم"}>
                    <span>
                      <IconButton
                        size="small"
                        color="error"
                        disabled={u.id === currentUser?.id}
                        onClick={() => setDeletingUser({ id: u.id, fullName: u.fullName, email: u.email })}
                      >
                        <DeleteRoundedIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      {creating && <CreateUserDialog onClose={() => setCreating(false)} />}
      {deletingUser && <DeleteUserDialog user={deletingUser} onClose={() => setDeletingUser(null)} />}
    </Box>
  );
}
