export function normalizeBang(input: string) {
  const trimmed = input.trim();
  const withBang = trimmed.startsWith("!") ? trimmed : `!${trimmed}`;
  const body = withBang.slice(1).toLowerCase();
  return `!${body}`;
}

export function validateBang(bang: string) {
  if (!/^![a-z0-9_-]+$/i.test(bang)) {
    return "Shortcut must be a !bang with letters, numbers, hyphens, or underscores";
  }
  return null;
}

export function validateMessage(message: string) {
  const trimmed = message.trim();
  if (!trimmed) {
    return "Message is required";
  }
  if (trimmed.length > 5000) {
    return "Message is too long";
  }
  return null;
}

export function validateTag(tag: string | null | undefined) {
  if (!tag) return null;
  const trimmed = tag.trim();
  if (!trimmed) return null;
  if (trimmed.length > 64) {
    return "Tag is too long";
  }
  return null;
}

export function normalizeTag(tag: string | null | undefined) {
  const trimmed = tag?.trim() ?? "";
  return trimmed || null;
}

export function resolveMessageShortcutText(text: string, shortcutsByBang: Record<string, string>) {
  const trimmed = text.trim();
  if (!trimmed.startsWith("!")) {
    return trimmed;
  }

  const bang = normalizeBang(trimmed);
  if (shortcutsByBang[bang]) {
    return shortcutsByBang[bang];
  }

  return trimmed;
}
