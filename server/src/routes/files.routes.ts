import path from "node:path";
import crypto from "node:crypto";
import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, requireEmployeeOrAdmin, type AuthedRequest } from "../middleware/auth";
import { supabase, FILES_BUCKET } from "../lib/supabase";

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

const upload = multer({
  storage: multer.memoryStorage(),
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
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message ?? "فشل رفع الملف" });
      next();
    });
  },
  async (req: AuthedRequest, res) => {
    if (!req.file) return res.status(400).json({ error: "لم يتم إرفاق ملف" });

    const originalName = Buffer.from(req.file.originalname, "latin1").toString("utf8");
    const title = (req.body.title as string | undefined)?.trim() || path.parse(originalName).name;
    const ext = path.extname(originalName).toLowerCase();
    const storedName = `${crypto.randomUUID()}${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(FILES_BUCKET)
      .upload(storedName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return res.status(500).json({ error: "فشل رفع الملف إلى التخزين السحابي" });
    }

    const count = await prisma.meetingFile.count();
    const record = await prisma.meetingFile.create({
      data: {
        title,
        originalName,
        storedName,
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

  const wantsDownload = req.query.download === "1";
  const { data, error } = await supabase.storage
    .from(FILES_BUCKET)
    .createSignedUrl(file.storedName, 60, wantsDownload ? { download: file.originalName } : undefined);

  if (error || !data) {
    console.error("Supabase signed URL error:", error);
    return res.status(404).json({ error: "الملف غير موجود على الخادم" });
  }

  res.redirect(data.signedUrl);
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
  await supabase.storage.from(FILES_BUCKET).remove([file.storedName]).catch(() => {});
  res.status(204).end();
});
