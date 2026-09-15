import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

dotenv.config();
const db = new PrismaClient();

const email = (process.env.SEED_TEACHER_EMAIL || "").trim().toLowerCase();
const password = process.env.SEED_TEACHER_PASSWORD || "";
const oldTeacherId = process.env.OLD_TEACHER_ID || process.env.NEXT_PUBLIC_TEACHER_ID || "";

if (!email || !password) {
  throw new Error("SEED_TEACHER_EMAIL / SEED_TEACHER_PASSWORD required");
}

const passwordHash = await bcrypt.hash(password, 10);
const now = new Date();

let user = await db.localUser.findUnique({ where: { email } });
if (!user) {
  user = await db.localUser.create({
    data: {
      id: randomUUID(),
      email,
      passwordHash,
      name: "管理员",
      role: "TEACHER",
      createdAt: now,
      updatedAt: now,
    },
  });
  console.log("created teacher", user.id);
} else {
  user = await db.localUser.update({
    where: { id: user.id },
    data: {
      passwordHash,
      role: "TEACHER",
      name: user.name || "管理员",
      updatedAt: now,
    },
  });
  console.log("updated teacher", user.id);
}

// migrate course ownership + purchases from old clerk teacher id
if (oldTeacherId && oldTeacherId !== user.id) {
  const owned = await db.course.updateMany({
    where: { userId: oldTeacherId },
    data: { userId: user.id },
  });
  console.log("migrated courses", owned.count);

  // move purchases from old id to new id where possible
  const oldPurchases = await db.purchase.findMany({ where: { userId: oldTeacherId } });
  for (const p of oldPurchases) {
    await db.purchase.upsert({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: p.courseId,
        },
      },
      update: { amount: p.amount ?? 2980 },
      create: {
        id: randomUUID(),
        userId: user.id,
        courseId: p.courseId,
        amount: p.amount ?? 2980,
        createdAt: now,
        updatedAt: now,
      },
    });
  }
  console.log("migrated purchases", oldPurchases.length);
}

console.log("TEACHER_ID=" + user.id);
await db.$disconnect();
