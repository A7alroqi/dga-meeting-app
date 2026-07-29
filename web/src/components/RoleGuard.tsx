import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import type { Role } from "@app/shared";
import { useAuth } from "../AuthContext";
import { Box, CircularProgress } from "@mui/material";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function canWriteTasks(role: Role | undefined) {
  return role === "employee" || role === "admin";
}

export function isAdmin(role: Role | undefined) {
  return role === "admin";
}
