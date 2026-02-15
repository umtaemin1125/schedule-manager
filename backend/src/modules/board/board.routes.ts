import { Router } from "express";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";
import { prisma } from "../../utils/prisma.js";

const router = Router();

const boardTypeSchema = z.enum(["NOTICE", "FREE"]);

const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(100000),
  type: boardTypeSchema
});

const updatePostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(100000).optional()
});

function sanitizeContent(content: string): string {
  return sanitizeHtml(content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "h3", "span"]),
    allowedAttributes: {
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      "*": ["style"]
    },
    allowedStyles: {
      "*": {
        color: [/^.*$/],
        "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/],
        "font-size": [/^\d+(?:px|em|rem|%)$/]
      }
    }
  });
}

router.get("/posts", async (req, res) => {
  const typeRaw = req.query.type;
  const type = boardTypeSchema.safeParse(typeRaw ?? "FREE");
  if (!type.success) {
    return res.status(400).json({ message: "유효한 게시판 타입이 아닙니다." });
  }

  const posts = await prisma.boardPost.findMany({
    where: { type: type.data },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      content: true,
      type: true,
      createdAt: true,
      updatedAt: true,
      userId: true,
      user: { select: { id: true, name: true, email: true, role: true } }
    }
  });

  return res.json(posts);
});

router.get("/posts/:id", async (req, res) => {
  const post = await prisma.boardPost.findUnique({
    where: { id: req.params.id },
    select: {
      id: true,
      title: true,
      content: true,
      type: true,
      createdAt: true,
      updatedAt: true,
      userId: true,
      user: { select: { id: true, name: true, email: true, role: true } }
    }
  });

  if (!post) {
    return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
  }

  return res.json(post);
});

router.post("/posts", async (req, res) => {
  const parsed = createPostSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "입력값이 올바르지 않습니다." });
  }

  const { type } = parsed.data;
  const isAdmin = req.user!.role === "ADMIN";

  if (type === "NOTICE" && !isAdmin) {
    return res.status(403).json({ message: "공지사항은 관리자만 작성할 수 있습니다." });
  }

  const post = await prisma.boardPost.create({
    data: {
      title: parsed.data.title,
      content: sanitizeContent(parsed.data.content),
      type,
      userId: req.user!.userId
    },
    select: {
      id: true,
      title: true,
      content: true,
      type: true,
      createdAt: true,
      updatedAt: true,
      userId: true
    }
  });

  return res.status(201).json(post);
});

router.patch("/posts/:id", async (req, res) => {
  const parsed = updatePostSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "입력값이 올바르지 않습니다." });
  }

  const post = await prisma.boardPost.findUnique({ where: { id: req.params.id } });
  if (!post) {
    return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
  }

  const isAdmin = req.user!.role === "ADMIN";
  const isOwner = post.userId === req.user!.userId;

  if (post.type === "NOTICE" && !isAdmin) {
    return res.status(403).json({ message: "공지사항 수정 권한이 없습니다." });
  }

  if (post.type === "FREE" && !isAdmin && !isOwner) {
    return res.status(403).json({ message: "게시글 수정 권한이 없습니다." });
  }

  const updated = await prisma.boardPost.update({
    where: { id: post.id },
    data: {
      title: parsed.data.title,
      content: parsed.data.content ? sanitizeContent(parsed.data.content) : undefined
    },
    select: {
      id: true,
      title: true,
      content: true,
      type: true,
      createdAt: true,
      updatedAt: true,
      userId: true
    }
  });

  return res.json(updated);
});

router.delete("/posts/:id", async (req, res) => {
  const post = await prisma.boardPost.findUnique({ where: { id: req.params.id } });
  if (!post) {
    return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
  }

  const isAdmin = req.user!.role === "ADMIN";
  const isOwner = post.userId === req.user!.userId;

  if (post.type === "NOTICE" && !isAdmin) {
    return res.status(403).json({ message: "공지사항 삭제 권한이 없습니다." });
  }

  if (post.type === "FREE" && !isAdmin && !isOwner) {
    return res.status(403).json({ message: "게시글 삭제 권한이 없습니다." });
  }

  await prisma.boardPost.delete({ where: { id: post.id } });
  return res.status(204).send();
});

export default router;
