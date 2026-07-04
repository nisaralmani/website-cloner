export function formatSessionWhen(date: Date, now = new Date()) {
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 60) {
    return `${Math.max(diffMin, 1)}m`;
  }

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    const time = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${diffHours}h (${time})`;
  }

  const day = date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${day} (${time})`;
}
