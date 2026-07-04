/**
 * Next.js instrumentation hook (Phase 18).
 *
 * Runs once when the server process boots. Validates configuration and fails
 * fast in production if it is invalid. Only runs in the Node.js runtime (skips
 * the edge runtime, where startup validation is neither needed nor supported).
 */

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { runStartupValidation } = await import("@/lib/startup");
  runStartupValidation();

  // Phase 24C: register graceful-shutdown hooks so in-flight background jobs
  // drain (or cancel) on SIGTERM/SIGINT instead of being killed abruptly.
  const { registerJobShutdownHooks } = await import("@/lib/jobs/shutdown");
  registerJobShutdownHooks();

  // Phase 24D: pre-register circuit breakers + retry budgets for unstable
  // dependencies so their state is observable in /api/health from boot.
  const { registerReliabilityDefaults } = await import("@/lib/reliability/defaults");
  registerReliabilityDefaults();
}
