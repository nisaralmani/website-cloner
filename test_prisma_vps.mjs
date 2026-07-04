import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  try {
    const sessions = await prisma.session.findMany();
    console.log("Sessions retrieved successfully:", sessions);
  } catch (error) {
    console.error("Prisma error details:", error);
  } finally {
    await prisma.$disconnect();
  }
}
main();
