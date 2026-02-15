import "express-async-errors";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { requireAuth } from "./middleware/auth.js";
import { adminRateLimiter, authRateLimiter } from "./middleware/rateLimit.js";
import { requireRole } from "./middleware/role.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import boardRoutes from "./modules/board/board.routes.js";
import scheduleRoutes from "./modules/schedules/schedules.routes.js";
import { ensureAdminAccount } from "./utils/bootstrapAdmin.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(morgan("combined"));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "backend" });
});

app.use("/api/auth", authRateLimiter, authRoutes);
app.use("/api/schedules", requireAuth, scheduleRoutes);
app.use("/api/board", requireAuth, boardRoutes);
app.use("/api/admin", adminRateLimiter, requireAuth, requireRole("ADMIN"), adminRoutes);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ message: "서버 내부 오류가 발생했습니다." });
});

app.use((_req, res) => {
  res.status(404).json({ message: "요청한 리소스를 찾을 수 없습니다." });
});

async function startServer() {
  await ensureAdminAccount();
  app.listen(env.PORT, () => {
    console.log(`Server listening on port ${env.PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
