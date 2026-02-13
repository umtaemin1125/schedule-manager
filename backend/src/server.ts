import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { requireAuth } from "./middleware/auth.js";
import authRoutes from "./modules/auth/auth.routes.js";
import scheduleRoutes from "./modules/schedules/schedules.routes.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/schedules", requireAuth, scheduleRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "요청한 리소스를 찾을 수 없습니다." });
});

app.listen(env.PORT, () => {
  console.log(`Server listening on port ${env.PORT}`);
});
