import type { Role } from "@app/shared";
import { api } from "./client";

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<CurrentUser>("/auth/login", { email, password }),
  logout: () => api.post<void>("/auth/logout"),
  me: () => api.get<CurrentUser>("/auth/me"),
};
