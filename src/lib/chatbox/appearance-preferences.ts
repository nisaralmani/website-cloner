export type ChatboxAppearanceFieldKey =
  | "colorTheme"
  | "layoutTheme"
  | "colorMode"
  | "textTheme"
  | "welcomeMessage"
  | "chatboxBackground"
  | "chatboxLanguage";

export type ChatboxAppearanceFields = Record<ChatboxAppearanceFieldKey, string>;

export const COLOR_THEME_OPTIONS = [
  "Default (Blue)",
  "Amber",
  "Emerald",
  "Rose",
  "Slate",
] as const;

export const LAYOUT_THEME_OPTIONS = ["Colorized", "Minimal", "Flat"] as const;

export const COLOR_MODE_OPTIONS = ["Light Mode", "Dark Mode", "System"] as const;

export const TEXT_THEME_OPTIONS = [
  "Questions? Chat with us!",
  "Need help? Chat with us!",
  "Chat with our team",
] as const;

export const WELCOME_MESSAGE_OPTIONS = [
  "Hello! How can I help you? :)",
  "Welcome! How may we assist you?",
  "Hi there! Ask us anything.",
] as const;

export const CHATBOX_BACKGROUND_OPTIONS = [
  "Death Star",
  "Default",
  "Dots",
  "Waves",
] as const;

export const CHATBOX_LANGUAGE_OPTIONS = [
  "Detect from user country",
  "English",
  "French",
  "Spanish",
] as const;

export const CHATBOX_APPEARANCE_FIELD_OPTIONS: Record<
  ChatboxAppearanceFieldKey,
  readonly string[]
> = {
  colorTheme: COLOR_THEME_OPTIONS,
  layoutTheme: LAYOUT_THEME_OPTIONS,
  colorMode: COLOR_MODE_OPTIONS,
  textTheme: TEXT_THEME_OPTIONS,
  welcomeMessage: WELCOME_MESSAGE_OPTIONS,
  chatboxBackground: CHATBOX_BACKGROUND_OPTIONS,
  chatboxLanguage: CHATBOX_LANGUAGE_OPTIONS,
};

export const CHATBOX_APPEARANCE_FIELD_BY_LABEL: Record<string, ChatboxAppearanceFieldKey> = {
  "Color theme (chatbox color)": "colorTheme",
  "Layout theme (chatbox header, etc.)": "layoutTheme",
  "Color mode (light or dark)": "colorMode",
  "Text theme (text visible on chatbox header)": "textTheme",
  "Welcome message (first message seen by users)": "welcomeMessage",
  "Chatbox background (messages texture)": "chatboxBackground",
  "Chatbox language (autodetect, or force a language)": "chatboxLanguage",
};

export const DEFAULT_CHATBOX_APPEARANCE_FIELDS: ChatboxAppearanceFields = {
  colorTheme: COLOR_THEME_OPTIONS[0],
  layoutTheme: LAYOUT_THEME_OPTIONS[0],
  colorMode: COLOR_MODE_OPTIONS[0],
  textTheme: TEXT_THEME_OPTIONS[0],
  welcomeMessage: WELCOME_MESSAGE_OPTIONS[0],
  chatboxBackground: CHATBOX_BACKGROUND_OPTIONS[0],
  chatboxLanguage: CHATBOX_LANGUAGE_OPTIONS[0],
};

export function chatboxAppearanceFieldKeyForLabel(label: string) {
  return CHATBOX_APPEARANCE_FIELD_BY_LABEL[label] ?? null;
}

export function validateChatboxAppearanceField(key: ChatboxAppearanceFieldKey, value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return `${key} is required`;
  }

  const options = CHATBOX_APPEARANCE_FIELD_OPTIONS[key];
  if (!options.includes(trimmed)) {
    return `${key} must be a supported option`;
  }

  return null;
}
