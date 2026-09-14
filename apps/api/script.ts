import { PrismaClient } from './src/generated/prisma';
const prisma = new PrismaClient();
async function main() {
  await prisma.garden.updateMany({
    data: {
      experience: { increment: 1000 },
      seeds: { increment: 1000 },
      level: 5
    }
  });
  console.log('Added 1000 XP and 1000 Seeds to all users.');
}
main().finally(() => prisma.$disconnect());
