export type WorkspaceAdvancedFieldKey = "defaultLanguage";

export type WorkspaceAdvancedFields = Record<WorkspaceAdvancedFieldKey, string>;

export const WORKSPACE_DEFAULT_LANGUAGE_OPTIONS = [
  "Do not use any fallback language",
  "English",
  "French",
  "Spanish",
  "German",
  "Portuguese",
  "Arabic",
] as const;

export const WORKSPACE_ADVANCED_FIELD_BY_LABEL: Record<string, WorkspaceAdvancedFieldKey> = {
  "Workspace default language (if user language is unknown)": "defaultLanguage",
};

export const DEFAULT_WORKSPACE_ADVANCED_FIELDS: WorkspaceAdvancedFields = {
  defaultLanguage: WORKSPACE_DEFAULT_LANGUAGE_OPTIONS[0],
};

export function workspaceAdvancedFieldKeyForLabel(label: string) {
  return WORKSPACE_ADVANCED_FIELD_BY_LABEL[label] ?? null;
}

export function validateWorkspaceAdvancedField(key: WorkspaceAdvancedFieldKey, value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return `${key} is required`;
  }

  if (key === "defaultLanguage" && !WORKSPACE_DEFAULT_LANGUAGE_OPTIONS.includes(trimmed as never)) {
    return "defaultLanguage must be a supported option";
  }

  return null;
}
