import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../db";
import { nanoid } from "nanoid";

const router = Router();

const createCommentSchema = z.object({
  text: z.string().min(1),
});

// GET /api/tasks/:taskId/comments
router.get("/:taskId/comments", requireAuth, async (req, res) => {
  try {
    const comments = await prisma.taskComment.findMany({
      where: { taskId: req.params.taskId },
      include: {
        user: {
          select: { id: true, fullName: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// POST /api/tasks/:taskId/comments
router.post("/:taskId/comments", requireAuth, async (req, res) => {
  try {
    const { text } = createCommentSchema.parse(req.body);

    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: req.params.taskId },
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const comment = await prisma.taskComment.create({
      data: {
        id: nanoid(),
        taskId: req.params.taskId,
        userId: req.session.userId || null,
        text,
      },
      include: {
        user: {
          select: { id: true, fullName: true },
        },
      },
    });

    res.status(201).json(comment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error creating comment:", error);
    res.status(500).json({ error: "Failed to create comment" });
  }
});

// DELETE /api/tasks/:taskId/comments/:commentId
router.delete("/:taskId/comments/:commentId", requireAuth, async (req, res) => {
  try {
    const comment = await prisma.taskComment.findUnique({
      where: { id: req.params.commentId },
    });

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Only allow deleting own comments or admin
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId! },
    });

    if (comment.userId !== req.session.userId && user?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    await prisma.taskComment.delete({
      where: { id: req.params.commentId },
    });

    res.json({ ok: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

export { router as commentsRouter };
