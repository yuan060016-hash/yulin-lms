import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const file = path.join(process.cwd(), "data", "sqlite-export.json");
  if (!fs.existsSync(file)) {
    throw new Error("Missing data/sqlite-export.json. Run export first.");
  }
  const data = JSON.parse(fs.readFileSync(file, "utf8"));

  // Import order respects FKs
  for (const row of data.localUsers || []) {
    await db.localUser.upsert({ where: { id: row.id }, update: row, create: row });
  }
  for (const row of data.categories || []) {
    await db.category.upsert({ where: { id: row.id }, update: row, create: row });
  }
  for (const row of data.courses || []) {
    await db.course.upsert({ where: { id: row.id }, update: row, create: row });
  }
  for (const row of data.chapters || []) {
    await db.chapter.upsert({ where: { id: row.id }, update: row, create: row });
  }
  for (const row of data.activities || []) {
    await db.chapterActivity.upsert({ where: { id: row.id }, update: row, create: row });
  }
  for (const row of data.muxData || []) {
    await db.muxData.upsert({ where: { id: row.id }, update: row, create: row });
  }
  for (const row of data.attachments || []) {
    await db.attachment.upsert({ where: { id: row.id }, update: row, create: row });
  }
  for (const row of data.purchases || []) {
    await db.purchase.upsert({ where: { id: row.id }, update: row, create: row });
  }
  for (const row of data.userProgress || []) {
    await db.userProgress.upsert({ where: { id: row.id }, update: row, create: row });
  }
  for (const row of data.learningPlans || []) {
    await db.learningPlan.upsert({ where: { id: row.id }, update: row, create: row });
  }
  for (const row of data.learningPlanSteps || []) {
    await db.learningPlanStep.upsert({ where: { id: row.id }, update: row, create: row });
  }
  for (const row of data.learningPlanStepCourses || []) {
    await db.learningPlanStepCourse.upsert({ where: { id: row.id }, update: row, create: row });
  }
  for (const row of data.stripeCustomers || []) {
    await db.stripeCustomer.upsert({ where: { id: row.id }, update: row, create: row });
  }

  console.log("Import completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
