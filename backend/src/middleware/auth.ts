import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ message: "인증 토큰이 필요합니다." });
    return;
  }

  const token = authHeader.replace("Bearer ", "").trim();

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    if (typeof payload === "string") {
      res.status(401).json({ message: "유효하지 않은 토큰입니다." });
      return;
    }

    req.user = payload as Request["user"];
    next();
  } catch {
    res.status(401).json({ message: "토큰 검증에 실패했습니다." });
  }
}
