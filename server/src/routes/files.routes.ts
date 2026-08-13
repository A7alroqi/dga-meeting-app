import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, requireEmployeeOrAdmin, type AuthedRequest } from "../middleware/auth";

const UPLOADS_DIR = path.join(__dirname, "../../data/uploads");
try {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
} catch {
  // Ephemeral filesystem (Vercel) — ignore
}

const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".ppt",
  ".pptx",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".png",
  ".jpg",
  ".jpeg",
]);

const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new Error("نوع الملف غير مدعوم"));
    }
    cb(null, true);
  },
});

export const filesRouter = Router();

filesRouter.get("/", requireAuth, async (_req, res) => {
  const files = await prisma.meetingFile.findMany({ orderBy: { sortOrder: "asc" } });
  res.json(files);
});

filesRouter.post(
  "/",
  requireAuth,
  requireEmployeeOrAdmin,
  (req: AuthedRequest, res, next) => {
    if (process.env.VERCEL) {
      return res.status(503).json({ error: "رفع الملفات غير مدعوم في هذا الإصدار" });
    }
    upload.single("file")(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message ?? "فشل رفع الملف" });
      next();
    });
  },
  async (req: AuthedRequest, res) => {
    if (!req.file) return res.status(400).json({ error: "لم يتم إرفاق ملف" });
    const originalName = Buffer.from(req.file.originalname, "latin1").toString("utf8");
    const title = (req.body.title as string | undefined)?.trim() || path.parse(originalName).name;
    const count = await prisma.meetingFile.count();
    const record = await prisma.meetingFile.create({
      data: {
        title,
        originalName,
        storedName: req.file.filename,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        sortOrder: count,
        uploadedById: req.user!.id,
      },
    });
    res.status(201).json(record);
  }
);

filesRouter.get("/:id/content", requireAuth, async (req, res) => {
  const file = await prisma.meetingFile.findUnique({ where: { id: req.params.id } });
  if (!file) return res.status(404).json({ error: "الملف غير موجود" });
  if (process.env.VERCEL) {
    return res.status(503).json({ error: "تحميل الملفات غير مدعوم في هذا الإصدار" });
  }
  const absolute = path.join(UPLOADS_DIR, file.storedName);
  if (!fs.existsSync(absolute)) return res.status(404).json({ error: "الملف غير موجود على الخادم" });

  const encodedName = encodeURIComponent(file.originalName);
  const disposition = req.query.download === "1" ? "attachment" : "inline";
  res.setHeader("Content-Type", file.mimeType);
  res.setHeader("Content-Disposition", `${disposition}; filename*=UTF-8''${encodedName}`);
  res.sendFile(absolute);
});

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  sortOrder: z.number().int().optional(),
});

filesRouter.patch("/:id", requireAuth, requireEmployeeOrAdmin, async (req, res) => {
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "بيانات غير صحيحة" });
  const updated = await prisma.meetingFile.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(updated);
});

filesRouter.delete("/:id", requireAuth, requireEmployeeOrAdmin, async (req, res) => {
  const file = await prisma.meetingFile.findUnique({ where: { id: req.params.id } });
  if (!file) return res.status(404).json({ error: "الملف غير موجود" });
  await prisma.meetingFile.delete({ where: { id: file.id } });
  if (!process.env.VERCEL) {
    const absolute = path.join(UPLOADS_DIR, file.storedName);
    fs.promises.unlink(absolute).catch(() => {});
  }
  res.status(204).end();
});
