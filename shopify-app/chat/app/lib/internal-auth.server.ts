import { secretsMatch } from "./constant-time.server";

export function verifyBybeltInternalRequest(request: Request): boolean {
  const secret = process.env.BYBELT_INTERNAL_SECRET?.trim();
  const header = request.headers.get("X-Bybelt-Internal-Secret")?.trim();
  return secretsMatch(header, secret);
}

export function internalAuthFailure(): Response {
  return new Response("Unauthorized", { status: 401 });
}
