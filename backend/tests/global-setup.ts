import { prisma } from "../src/lib/prisma";

export async function setup() {
  await prisma.$queryRaw`SELECT 1`;
  await prisma.$disconnect();
}