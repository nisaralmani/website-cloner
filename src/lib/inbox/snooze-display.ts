export function isSnoozedUntilActive(
  snoozedUntil: string | null | undefined,
  now = Date.now(),
): boolean {
  if (!snoozedUntil) return false;
  const until = new Date(snoozedUntil).getTime();
  return Number.isFinite(until) && until > now;
}

export function formatSnoozedUntilLabel(snoozedUntil: string): string {
  const date = new Date(snoozedUntil);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
