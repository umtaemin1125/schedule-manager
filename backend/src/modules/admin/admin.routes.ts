import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../utils/prisma.js";

const router = Router();

const updateUserSchema = z.object({
  name: z.string().min(2).max(40).optional(),
  role: z.enum(["USER", "ADMIN"]).optional()
});

router.get("/overview", async (_req, res) => {
  const [userCount, adminCount, scheduleCount, latestUsers, latestSchedules] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.schedule.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, email: true, name: true, role: true, createdAt: true }
    }),
    prisma.schedule.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        startAt: true,
        endAt: true,
        createdAt: true,
        user: { select: { id: true, email: true, name: true } }
      }
    })
  ]);

  return res.json({ userCount, adminCount, scheduleCount, latestUsers, latestSchedules });
});

router.get("/users", async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      _count: { select: { schedules: true } }
    }
  });

  return res.json(users);
});

router.patch("/users/:id", async (req, res) => {
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "입력값이 올바르지 않습니다." });
  }

  const targetId = req.params.id;
  const me = req.user!;

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) {
    return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
  }

  const nextRole = parsed.data.role;
  if (me.userId === targetId && nextRole === "USER") {
    return res.status(400).json({ message: "자기 자신의 ADMIN 권한은 해제할 수 없습니다." });
  }

  const user = await prisma.user.update({
    where: { id: targetId },
    data: {
      name: parsed.data.name,
      role: parsed.data.role
    },
    select: { id: true, email: true, name: true, role: true, createdAt: true }
  });

  return res.json(user);
});

router.delete("/users/:id", async (req, res) => {
  const targetId = req.params.id;
  const me = req.user!;

  if (targetId === me.userId) {
    return res.status(400).json({ message: "자기 자신은 삭제할 수 없습니다." });
  }

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) {
    return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
  }

  await prisma.user.delete({ where: { id: targetId } });

  return res.status(204).send();
});

router.get("/schedules", async (_req, res) => {
  const schedules = await prisma.schedule.findMany({
    orderBy: { startAt: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      startAt: true,
      endAt: true,
      isAllDay: true,
      createdAt: true,
      updatedAt: true,
      user: { select: { id: true, email: true, name: true, role: true } }
    }
  });

  return res.json(schedules);
});

router.delete("/schedules/:id", async (req, res) => {
  const id = req.params.id;
  const target = await prisma.schedule.findUnique({ where: { id } });
  if (!target) {
    return res.status(404).json({ message: "일정을 찾을 수 없습니다." });
  }

  await prisma.schedule.delete({ where: { id } });
  return res.status(204).send();
});

export default router;
