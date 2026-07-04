import type { ChatboxRestrictionKind } from "@/types/chatbox-restrictions";

export const CHATBOX_RESTRICTION_KINDS = [
  "allowed_page",
  "blocked_page",
  "blocked_country",
  "blocked_locale",
  "blocked_ip",
  "blocked_visitor",
] as const satisfies readonly ChatboxRestrictionKind[];

export const CHATBOX_RESTRICTION_LABELS: Record<string, ChatboxRestrictionKind> = {
  "Show chatbox only on pages": "allowed_page",
  "Hide chatbox on pages": "blocked_page",
  "Hide chatbox for countries": "blocked_country",
  "Hide chatbox for locales": "blocked_locale",
  "Hide chatbox for IPs": "blocked_ip",
};

export const DEFAULT_RESTRICTION_VALUES: Record<ChatboxRestrictionKind, string> = {
  allowed_page: "https://www.example.com/",
  blocked_page: "https://www.example.com/page",
  blocked_country: "United States",
  blocked_locale: "en-US",
  blocked_ip: "192.168.1.1",
  blocked_visitor: "visitor@example.com",
};

const URL_PATTERN = /^https?:\/\/.+/i;
const LOCALE_PATTERN = /^[a-z]{2}(-[A-Z]{2})?$/;
const IPV4_PATTERN =
  /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d?\d)){3})$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function chatboxRestrictionKindForLabel(label: string) {
  return CHATBOX_RESTRICTION_LABELS[label] ?? null;
}

export function isChatboxRestrictionKind(value: string): value is ChatboxRestrictionKind {
  return (CHATBOX_RESTRICTION_KINDS as readonly string[]).includes(value);
}

export function defaultRestrictionValue(
  kind: ChatboxRestrictionKind,
  existingCountForKind: number,
) {
  const base = DEFAULT_RESTRICTION_VALUES[kind];
  if (kind === "blocked_page" || kind === "allowed_page") {
    const suffix = existingCountForKind > 0 ? `-${existingCountForKind + 1}` : "";
    return base.replace(/\/$/, "") + suffix;
  }
  if (existingCountForKind === 0) {
    return base;
  }
  return `${base} ${existingCountForKind + 1}`;
}

export function validateChatboxRestrictionValue(kind: ChatboxRestrictionKind, value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Value is required";
  }

  switch (kind) {
    case "allowed_page":
    case "blocked_page":
      if (!URL_PATTERN.test(trimmed)) {
        return "Page URL must start with http:// or https://";
      }
      return null;
    case "blocked_country":
      if (trimmed.length < 2) {
        return "Country name is required";
      }
      return null;
    case "blocked_locale":
      if (!LOCALE_PATTERN.test(trimmed)) {
        return "Locale must look like en or en-US";
      }
      return null;
    case "blocked_ip":
      if (!IPV4_PATTERN.test(trimmed)) {
        return "IP address must be a valid IPv4 address";
      }
      return null;
    case "blocked_visitor":
      if (!EMAIL_PATTERN.test(trimmed) && !IPV4_PATTERN.test(trimmed)) {
        return "Blocked visitor must be an email address or IPv4 address";
      }
      return null;
    default:
      return "Unknown restriction kind";
  }
}
