export function workspaceInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  const compact = name.trim();
  return (compact.slice(0, 2) || "WS").toUpperCase();
}

export function normalizeWorkspaceDomain(domain: string) {
  return domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
}

export function validateWorkspaceInput(name: string, domain: string) {
  const trimmedName = name.trim();
  const trimmedDomain = normalizeWorkspaceDomain(domain);

  if (!trimmedName) {
    return { error: "Workspace name is required" as const };
  }
  if (!trimmedDomain) {
    return { error: "Website domain is required" as const };
  }
  if (!/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(trimmedDomain)) {
    return { error: "Enter a valid domain (e.g. example.com)" as const };
  }

  return {
    name: trimmedName,
    domain: trimmedDomain,
  };
}
