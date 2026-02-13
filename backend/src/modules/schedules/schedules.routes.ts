import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../utils/prisma.js";

const router = Router();

const createScheduleSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(1000).optional().nullable(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  isAllDay: z.boolean().default(false)
});

const updateScheduleSchema = createScheduleSchema.partial();

router.get("/", async (req, res) => {
  const userId = req.user!.userId;

  const schedules = await prisma.schedule.findMany({
    where: { userId },
    orderBy: { startAt: "asc" }
  });

  return res.json(schedules);
});

router.post("/", async (req, res) => {
  const parsed = createScheduleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "입력값이 올바르지 않습니다." });
  }

  const { startAt, endAt, ...rest } = parsed.data;
  if (new Date(startAt) > new Date(endAt)) {
    return res.status(400).json({ message: "종료 시간이 시작 시간보다 빠를 수 없습니다." });
  }

  const schedule = await prisma.schedule.create({
    data: {
      ...rest,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      userId: req.user!.userId
    }
  });

  return res.status(201).json(schedule);
});

router.patch("/:id", async (req, res) => {
  const parsed = updateScheduleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "입력값이 올바르지 않습니다." });
  }

  const id = req.params.id;
  const userId = req.user!.userId;
  const target = await prisma.schedule.findFirst({ where: { id, userId } });

  if (!target) {
    return res.status(404).json({ message: "일정을 찾을 수 없습니다." });
  }

  const nextStart = parsed.data.startAt ? new Date(parsed.data.startAt) : target.startAt;
  const nextEnd = parsed.data.endAt ? new Date(parsed.data.endAt) : target.endAt;

  if (nextStart > nextEnd) {
    return res.status(400).json({ message: "종료 시간이 시작 시간보다 빠를 수 없습니다." });
  }

  const schedule = await prisma.schedule.update({
    where: { id },
    data: {
      ...parsed.data,
      startAt: parsed.data.startAt ? new Date(parsed.data.startAt) : undefined,
      endAt: parsed.data.endAt ? new Date(parsed.data.endAt) : undefined
    }
  });

  return res.json(schedule);
});

router.delete("/:id", async (req, res) => {
  const id = req.params.id;
  const userId = req.user!.userId;

  const target = await prisma.schedule.findFirst({ where: { id, userId } });
  if (!target) {
    return res.status(404).json({ message: "일정을 찾을 수 없습니다." });
  }

  await prisma.schedule.delete({ where: { id } });

  return res.status(204).send();
});

export default router;
