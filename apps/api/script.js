const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();
prisma.garden.updateMany({ data: { experience: 2000, seeds: 1000, level: 7 } })
  .then(() => console.log('Done'))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
