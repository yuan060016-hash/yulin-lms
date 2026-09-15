import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const c = await db.course.findFirst({
  where: { title: "雨林外贸实战课程" },
  include: {
    chapters: {
      orderBy: { position: "asc" },
      include: { activities: true },
    },
  },
});
if (!c) {
  console.log("no course");
  process.exit(0);
}
console.log("course", c.id);
for (const ch of c.chapters) {
  console.log(
    ch.position,
    ch.title,
    "->",
    ch.activities.map((a) => a.name).join(",")
  );
}
await db.$disconnect();
