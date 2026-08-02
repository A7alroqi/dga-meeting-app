import path from "node:path";
import "express-async-errors";
import express from "express";
import session from "express-session";
import SQLiteStoreFactory from "connect-sqlite3";
import sqlite3 from "sqlite3";
import { attachUser } from "./middleware/auth";
import { authRouter } from "./routes/auth.routes";
import { usersRouter } from "./routes/users.routes";
import { tasksRouter } from "./routes/tasks.routes";
import { kpisRouter } from "./routes/kpis.routes";
import { settingsRouter } from "./routes/settings.routes";
import { capabilityMatrixRouter } from "./routes/capabilityMatrix.routes";
import { meetingsRouter, challengesRouter } from "./routes/meetings.routes";
import { filesRouter } from "./routes/files.routes";
import { commentsRouter } from "./routes/comments.routes";
import {
  categoriesRouter,
  governanceRouter,
  agendaRouter,
  objectivesRouter,
  groundRulesRouter,
  communitiesRouter,
  capabilitiesRouter,
  peopleRouter,
} from "./routes/reference.routes";

const app = express();
const PORT = Number(process.env.PORT ?? 3001);
const isProd = process.env.NODE_ENV === "production";

const SQLiteStore = SQLiteStoreFactory(session);
const sessionDb = new sqlite3.Database(path.join(__dirname, "../data/sessions.sqlite"));

app.use(express.json());
app.set("trust proxy", 1);
app.use(
  session({
    store: new SQLiteStore({ db: sessionDb, table: "sessions" }),
    secret: process.env.SESSION_SECRET ?? "dev-only-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      maxAge: 1000 * 60 * 60 * 24 * 14, // 14 days
    },
  })
);
app.use(attachUser);

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/tasks", commentsRouter);
app.use("/api/kpis", kpisRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/capability-matrix", capabilityMatrixRouter);
app.use("/api/meetings", meetingsRouter);
app.use("/api/files", filesRouter);
app.use("/api/challenges", challengesRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/governance-items", governanceRouter);
app.use("/api/agenda-items", agendaRouter);
app.use("/api/meeting-objectives", objectivesRouter);
app.use("/api/ground-rules", groundRulesRouter);
app.use("/api/communities", communitiesRouter);
app.use("/api/capabilities", capabilitiesRouter);
app.use("/api/people", peopleRouter);

if (isProd) {
  // In Vercel: web files copied to server/dist/public
  // Locally: web files are in ../web/dist
  const webDist = process.env.VERCEL ? path.join(__dirname, "public") : path.join(__dirname, "../../web/dist");
  app.use(express.static(webDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(webDist, "index.html"));
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "حدث خطأ في الخادم" });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
