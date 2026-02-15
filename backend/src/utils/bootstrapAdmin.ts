import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { prisma } from "./prisma.js";

export async function ensureAdminAccount(): Promise<void> {
  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 10);
  await prisma.user.upsert({
    where: { email: env.ADMIN_EMAIL },
    update: {
      name: env.ADMIN_NAME,
      role: "ADMIN",
      passwordHash
    },
    create: {
      email: env.ADMIN_EMAIL,
      name: env.ADMIN_NAME,
      passwordHash,
      role: "ADMIN"
    }
  });
  console.log(`Admin account synced: ${env.ADMIN_EMAIL}`);
}
