import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { prisma } from "./prisma.js";

export async function ensureAdminAccount(): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { email: env.ADMIN_EMAIL } });
  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 10);

  if (!existing) {
    await prisma.user.create({
      data: {
        email: env.ADMIN_EMAIL,
        name: env.ADMIN_NAME,
        passwordHash,
        role: "ADMIN"
      }
    });
    console.log(`Admin account created: ${env.ADMIN_EMAIL}`);
    return;
  }

  if (existing.role !== "ADMIN") {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: "ADMIN", name: env.ADMIN_NAME, passwordHash }
    });
    console.log(`Admin account promoted: ${env.ADMIN_EMAIL}`);
  }
}
