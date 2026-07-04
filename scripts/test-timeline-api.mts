import { getDb } from "@/db/client";
import { aiAgentLog } from "@/db/schema.sqlite";
import { eq, and, desc } from "drizzle-orm";

async function runTests() {
  console.log("Testing Timeline query...");
  const db = await getDb();
  
  const ws = await db.query.workspaces.findFirst();
  if (!ws) throw new Error("No workspace found in DB.");
  
  const conv = await db.query.conversations.findFirst({
    where: (conversations, { eq }) => eq(conversations.workspaceId, ws.id)
  });
  if (!conv) throw new Error("No conversation found in DB.");

  const timeline = await db
    .select()
    .from(aiAgentLog)
    .where(
      and(
        eq(aiAgentLog.workspaceId, ws.id),
        eq(aiAgentLog.conversationId, conv.id)
      )
    )
    .orderBy(desc(aiAgentLog.createdAt));

  console.log(`Found ${timeline.length} timeline events for conversation ${conv.id}.`);
  console.log(timeline);
  console.log("✅ Timeline query test passed!");
}

runTests().catch(console.error);
