import type { LoaderFunctionArgs } from "react-router";
import prisma from "../db.server";

/**
 * GET /healthz — unauthenticated container liveness/readiness (Phase 18).
 *
 * Used by the Docker HEALTHCHECK for the Shopify plugin app. Reports process
 * uptime and a best-effort database ping. Returns 503 if the database is
 * unreachable. Contains no tenant data and requires no internal secret so an
 * orchestrator can probe it.
 */
export const loader = async (_args: LoaderFunctionArgs) => {
  let database: "ok" | "down" = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = "down";
  }

  const healthy = database === "ok";
  return Response.json(
    {
      status: healthy ? "healthy" : "unhealthy",
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      checks: { database },
    },
    { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
};
