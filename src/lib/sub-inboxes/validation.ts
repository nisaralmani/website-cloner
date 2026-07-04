export function validateSubInboxName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    return "name is required";
  }
  if (trimmed.length > 80) {
    return "name is too long";
  }
  return null;
}

export function validateSubInboxSegment(segment: string | null | undefined) {
  if (!segment) return null;
  const trimmed = segment.trim();
  if (!trimmed) return null;
  if (trimmed.length > 120) {
    return "segment is too long";
  }
  return null;
}

export function normalizeSubInboxSegment(segment: string | null | undefined) {
  const trimmed = segment?.trim() ?? "";
  return trimmed || null;
}

export function defaultSubInboxName(existingCount: number) {
  return `Sub-inbox ${existingCount + 1}`;
}
