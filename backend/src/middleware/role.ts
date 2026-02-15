import type { NextFunction, Request, Response } from "express";

export function requireRole(...allowedRoles: Array<"USER" | "ADMIN">) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = req.user?.role;

    if (!role || !allowedRoles.includes(role)) {
      res.status(403).json({ message: "권한이 없습니다." });
      return;
    }

    next();
  };
}
