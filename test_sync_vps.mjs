import { PrismaClient } from "@prisma/client";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const bundle = require("../build/server/index.js");

const prisma = new PrismaClient();
const workspaceId = "e3f25f9d-fd3d-440a-93f1-f3ef0c5db653";

async function main() {
  try {
    const link = await prisma.shopLink.findFirst({ where: { workspaceId } });
    console.log("Link found:", link);
    if (!link) {
      console.log("No link found!");
      return;
    }
    console.log("Acquiring unauthenticated.admin...");
    const unauthenticated = bundle.unauthenticated;
    console.log("unauthenticated exists:", unauthenticated != null);
    
    const auth = await unauthenticated.admin(link.shop);
    console.log("Auth session acquired:", auth.session.shop);
    
    console.log("Executing test GraphQL query...");
    const response = await auth.admin.graphql(`{ shop { name } }`);
    console.log("GraphQL Response OK:", response.ok, "Status:", response.status);
    const json = await response.json();
    console.log("GraphQL Response JSON:", JSON.stringify(json));
  } catch (error) {
    console.error("CRASH ERROR DETAILS:", error);
  } finally {
    await prisma.$disconnect();
  }
}
main();
