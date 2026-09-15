import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
await db.category.deleteMany();
await db.category.createMany({
  data: [
    { id: 'c1', name: '外贸获客' },
    { id: 'c2', name: '客户沟通' },
    { id: 'c3', name: '成交交付' },
  ],
});
console.log(await db.category.findMany());
await db.$disconnect();
