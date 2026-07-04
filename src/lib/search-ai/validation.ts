export function validateFrequentSearchQuery(query: string) {
  const trimmed = query.trim();
  if (!trimmed) {
    return "query is required";
  }
  if (trimmed.length > 200) {
    return "query is too long";
  }
  return null;
}

export function defaultFrequentSearchQuery(existingCount: number) {
  return `Frequent search ${existingCount + 1}`;
}
