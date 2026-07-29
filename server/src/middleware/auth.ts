import type { Request, Response, NextFunction } from "express";
import type { Role } from "@app/shared";
import { prisma } from "../db";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

export interface AuthedRequest extends Request {
  user?: {
    id: string;
    email: string;
    fullName: string;
    role: Role;
  };
}

export async function attachUser(req: AuthedRequest, _res: Response, next: NextFunction) {
  const userId = req.session.userId;
  if (!userId) return next();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user && user.isActive) {
    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role as Role,
    };
  }
  next();
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "غير مصرح - يرجى تسجيل الدخول" });
  }
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "غير مصرح - يرجى تسجيل الدخول" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "لا تملك صلاحية القيام بهذا الإجراء" });
    }
    next();
  };
}

// Employees and admins can write to the live task-tracking domain (tasks, milestones,
// assignees, meetings, challenges). Guests are read-only everywhere. Admins alone can
// write reference/static content and manage users.
export const requireEmployeeOrAdmin = requireRole("employee", "admin");
export const requireAdmin = requireRole("admin");
