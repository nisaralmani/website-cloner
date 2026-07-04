import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, selectOne } from "@/db/client";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { clientMetaFromRequest } from "@/lib/auth/request-meta";
import { createSessionForUser } from "@/lib/auth/sign-in";
import { appendWorkspaceAuditLog } from "@/lib/transparency/append-audit-log";
import {
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth/session";

export async function POST(request: Request) {
  let body: { email?: string; password?: string; remember?: boolean };  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const db = await getDb();
  const user = await selectOne(db.select().from(users).where(eq(users.email, email)));

  if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const session = await createSessionForUser(user.id, {
    remember: body.remember === true,
    meta: clientMetaFromRequest(request),
  });
  if (!session) {
    return NextResponse.json({ error: "No workspace assigned to this user" }, { status: 403 });
  }

  await appendWorkspaceAuditLog(db, {
    workspaceId: session.workspace.id,
    userId: user.id,
    action: `Signed in as ${user.email}`,
    badge: "Auth",
    ipAddress: clientMetaFromRequest(request).ipAddress,
  });

  const response = NextResponse.json({
    user: session.user,
    workspace: session.workspace,
  });
  response.cookies.set(SESSION_COOKIE, session.token, sessionCookieOptions(session.maxAge));
  return response;
}
