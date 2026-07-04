export type InterfaceFieldKey = "language" | "appearance";

export type InterfacePreferences = {
  language: string;
  appearance: string;
};

export const INTERFACE_FIELD_BY_LABEL: Record<string, InterfaceFieldKey> = {
  Language: "language",
  Appearance: "appearance",
};

export const LANGUAGE_OPTIONS = [
  "Auto-Detect",
  "Czech",
  "Danish",
  "German",
  "English",
  "Spanish",
  "Finnish",
  "French",
  "Hungarian",
  "Indonesian",
  "Italian",
  "Japanese",
  "Korean",
  "Dutch",
  "Polish",
  "Portuguese",
  "Portuguese (Brazil)",
  "Romanian",
  "Russian",
  "Swedish",
  "Thai",
  "Turkish",
  "Ukrainian",
  "Vietnamese",
  "Chinese (Taiwan)",
] as const;

export const APPEARANCE_OPTIONS = ["Same as System", "Light Mode", "Dark Mode"] as const;

export const DEFAULT_INTERFACE_PREFERENCES: InterfacePreferences = {
  language: "Auto-Detect",
  appearance: "Light Mode",
};

export function interfaceFieldKeyForLabel(label: string): InterfaceFieldKey | null {
  return INTERFACE_FIELD_BY_LABEL[label] ?? null;
}

export function validateInterfaceField(key: InterfaceFieldKey, value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return `${key} is required`;
  }

  if (key === "language" && !LANGUAGE_OPTIONS.includes(trimmed as (typeof LANGUAGE_OPTIONS)[number])) {
    return "language must be a supported option";
  }

  if (
    key === "appearance" &&
    !APPEARANCE_OPTIONS.includes(trimmed as (typeof APPEARANCE_OPTIONS)[number])
  ) {
    return "appearance must be a supported option";
  }

  return null;
}

export function resolveAppearanceClass(appearance: string) {
  if (appearance === "Dark Mode") return "dark";
  if (appearance === "Light Mode") return "light";
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export function resolveDocumentLanguage(language: string) {
  if (language === "Auto-Detect" && typeof navigator !== "undefined") {
    return navigator.language || "en";
  }

  const languageMap: Record<string, string> = {
    English: "en",
    French: "fr",
    German: "de",
    Spanish: "es",
    Japanese: "ja",
    Korean: "ko",
    Dutch: "nl",
    Portuguese: "pt",
    "Portuguese (Brazil)": "pt-BR",
    Russian: "ru",
    Turkish: "tr",
    Ukrainian: "uk",
    Vietnamese: "vi",
    "Chinese (Taiwan)": "zh-TW",
  };

  return languageMap[language] ?? "en";
}

export function applyInterfacePreferences(fields: InterfacePreferences) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const appearanceClass = resolveAppearanceClass(fields.appearance);

  root.classList.remove("dark", "light");
  if (appearanceClass === "dark") {
    root.classList.add("dark");
  }

  root.lang = resolveDocumentLanguage(fields.language);
}
