export type InboxCustomizeFieldKey = "emailPreview";

export type InboxCustomizeFields = {
  emailPreview: string;
};

export const INBOX_CUSTOMIZE_TOGGLE_KEYS = {
  hideSendConfirm: "0-0",
  showSegments: "1-1",
  showChannel: "1-2",
  showWaitingSince: "1-3",
  showSubject: "1-4",
  showNotesInLastMessage: "1-5",
  showAssignee: "1-6",
  showSnoozed: "1-7",
  editorActions: "2-0",
} as const;

export type InboxCustomizeToggleKey = keyof typeof INBOX_CUSTOMIZE_TOGGLE_KEYS;

export const INBOX_CUSTOMIZE_FIELD_BY_LABEL: Record<string, InboxCustomizeFieldKey> = {
  "Email preview": "emailPreview",
};

export const EMAIL_PREVIEW_OPTIONS = [
  "Automatic",
  "Always show original",
  "Always show as text",
] as const;

export const DEFAULT_INBOX_CUSTOMIZE_FIELDS: InboxCustomizeFields = {
  emailPreview: "Automatic",
};

export const DEFAULT_INBOX_CUSTOMIZE_TOGGLES: Record<string, boolean> = {
  [INBOX_CUSTOMIZE_TOGGLE_KEYS.hideSendConfirm]: false,
  [INBOX_CUSTOMIZE_TOGGLE_KEYS.showSegments]: false,
  [INBOX_CUSTOMIZE_TOGGLE_KEYS.showChannel]: false,
  [INBOX_CUSTOMIZE_TOGGLE_KEYS.showWaitingSince]: false,
  [INBOX_CUSTOMIZE_TOGGLE_KEYS.showSubject]: false,
  [INBOX_CUSTOMIZE_TOGGLE_KEYS.showNotesInLastMessage]: true,
  [INBOX_CUSTOMIZE_TOGGLE_KEYS.showAssignee]: false,
  [INBOX_CUSTOMIZE_TOGGLE_KEYS.showSnoozed]: false,
  [INBOX_CUSTOMIZE_TOGGLE_KEYS.editorActions]: false,
};

export type InboxCustomizePreferences = {
  hideSendConfirm: boolean;
  emailPreview: string;
  showSegments: boolean;
  showChannel: boolean;
  showWaitingSince: boolean;
  showSubject: boolean;
  showNotesInLastMessage: boolean;
  showAssignee: boolean;
  showSnoozed: boolean;
  editorActions: boolean;
};

export function inboxCustomizeFieldKeyForLabel(label: string): InboxCustomizeFieldKey | null {
  return INBOX_CUSTOMIZE_FIELD_BY_LABEL[label] ?? null;
}

export function validateInboxCustomizeField(key: InboxCustomizeFieldKey, value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return `${key} is required`;
  }

  if (
    key === "emailPreview" &&
    !EMAIL_PREVIEW_OPTIONS.includes(trimmed as (typeof EMAIL_PREVIEW_OPTIONS)[number])
  ) {
    return "emailPreview must be a supported option";
  }

  return null;
}

export function inboxCustomizeFromSettings(
  toggles: Record<string, boolean>,
  fields: Record<string, string>,
): InboxCustomizePreferences {
  return {
    hideSendConfirm: toggles[INBOX_CUSTOMIZE_TOGGLE_KEYS.hideSendConfirm] ?? false,
    emailPreview: fields.emailPreview ?? DEFAULT_INBOX_CUSTOMIZE_FIELDS.emailPreview,
    showSegments: toggles[INBOX_CUSTOMIZE_TOGGLE_KEYS.showSegments] ?? false,
    showChannel: toggles[INBOX_CUSTOMIZE_TOGGLE_KEYS.showChannel] ?? false,
    showWaitingSince: toggles[INBOX_CUSTOMIZE_TOGGLE_KEYS.showWaitingSince] ?? false,
    showSubject: toggles[INBOX_CUSTOMIZE_TOGGLE_KEYS.showSubject] ?? false,
    showNotesInLastMessage:
      toggles[INBOX_CUSTOMIZE_TOGGLE_KEYS.showNotesInLastMessage] ?? true,
    showAssignee: toggles[INBOX_CUSTOMIZE_TOGGLE_KEYS.showAssignee] ?? false,
    showSnoozed: toggles[INBOX_CUSTOMIZE_TOGGLE_KEYS.showSnoozed] ?? false,
    editorActions: toggles[INBOX_CUSTOMIZE_TOGGLE_KEYS.editorActions] ?? false,
  };
}

export const DEFAULT_INBOX_CUSTOMIZE_PREFERENCES = inboxCustomizeFromSettings(
  DEFAULT_INBOX_CUSTOMIZE_TOGGLES,
  DEFAULT_INBOX_CUSTOMIZE_FIELDS,
);
