export type ChatboxBehaviorFieldKey = "defaultSection" | "knowledgeBaseNavigation";

export type ChatboxBehaviorFields = Record<ChatboxBehaviorFieldKey, string>;

export const DEFAULT_SECTION_OPTIONS = [
  "Messages (default)",
  "Home",
  "Knowledge Base",
] as const;

export const KNOWLEDGE_BASE_NAVIGATION_OPTIONS = [
  "Frequently-Read Articles",
  "Categories",
  "Search",
] as const;

export const CHATBOX_BEHAVIOR_FIELD_OPTIONS: Record<
  ChatboxBehaviorFieldKey,
  readonly string[]
> = {
  defaultSection: DEFAULT_SECTION_OPTIONS,
  knowledgeBaseNavigation: KNOWLEDGE_BASE_NAVIGATION_OPTIONS,
};

export const CHATBOX_BEHAVIOR_FIELD_BY_LABEL: Record<string, ChatboxBehaviorFieldKey> = {
  "Default section to show when the chatbox is opened": "defaultSection",
  "Knowledge Base navigation mode on the chatbox": "knowledgeBaseNavigation",
};

export const DEFAULT_CHATBOX_BEHAVIOR_FIELDS: ChatboxBehaviorFields = {
  defaultSection: DEFAULT_SECTION_OPTIONS[0],
  knowledgeBaseNavigation: KNOWLEDGE_BASE_NAVIGATION_OPTIONS[0],
};

export function chatboxBehaviorFieldKeyForLabel(label: string) {
  return CHATBOX_BEHAVIOR_FIELD_BY_LABEL[label] ?? null;
}

export function validateChatboxBehaviorField(key: ChatboxBehaviorFieldKey, value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return `${key} is required`;
  }

  const options = CHATBOX_BEHAVIOR_FIELD_OPTIONS[key];
  if (!options.includes(trimmed)) {
    return `${key} must be a supported option`;
  }

  return null;
}
