import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

prisma.$executeRawUnsafe("PRAGMA journal_mode=WAL;").catch(() => {
  // best-effort; not fatal if the pragma can't be set (e.g. in-memory test db)
});
