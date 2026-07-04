export const OVERLAY_PLUGIN_ID = "overlay";

export const SEARCH_AI_ENABLE_TOGGLE_KEY = "0-0";
export const SEARCH_AI_DIRECT_TOGGLE_KEY = "0-1";

export type ChatboxSearchAiFieldKey = "defaultLanguage";

export type ChatboxSearchAiFields = {
  defaultLanguage: string;
};

export const DEFAULT_LANGUAGE_OPTIONS = [
  "Default language",
  "English",
  "French",
  "Spanish",
] as const;

export const DEFAULT_CHATBOX_SEARCH_AI_FIELDS: ChatboxSearchAiFields = {
  defaultLanguage: DEFAULT_LANGUAGE_OPTIONS[0],
};

export function validateChatboxSearchAiField(key: ChatboxSearchAiFieldKey, value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return `${key} is required`;
  }

  if (
    key === "defaultLanguage" &&
    !DEFAULT_LANGUAGE_OPTIONS.includes(trimmed as (typeof DEFAULT_LANGUAGE_OPTIONS)[number])
  ) {
    return "defaultLanguage must be a supported option";
  }

  return null;
}

export function isSearchAiToggleKey(localKey: string) {
  return (
    localKey === SEARCH_AI_ENABLE_TOGGLE_KEY || localKey === SEARCH_AI_DIRECT_TOGGLE_KEY
  );
}

export function isSearchAiDirectToggleKey(localKey: string) {
  return localKey === SEARCH_AI_DIRECT_TOGGLE_KEY;
}
