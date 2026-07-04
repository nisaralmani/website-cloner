import {
  DEFAULT_CHATBOX_APPEARANCE_FIELDS,
  validateChatboxAppearanceField,
  type ChatboxAppearanceFieldKey,
} from "@/lib/chatbox/appearance-preferences";
import {
  DEFAULT_CHATBOX_BEHAVIOR_FIELDS,
  validateChatboxBehaviorField,
  type ChatboxBehaviorFieldKey,
} from "@/lib/chatbox/behavior-preferences";
import {
  DEFAULT_CHATBOX_SEARCH_AI_FIELDS,
  validateChatboxSearchAiField,
  type ChatboxSearchAiFieldKey,
} from "@/lib/chatbox/search-ai-preferences";
import {
  DEFAULT_INBOX_CUSTOMIZE_FIELDS,
  validateInboxCustomizeField,
  type InboxCustomizeFieldKey,
} from "@/lib/inbox/customize-preferences";
import {
  DEFAULT_EMAIL_DOMAIN_FIELDS,
  validateEmailDomainField,
  type EmailDomainFieldKey,
} from "@/lib/email/domain-preferences";
import {
  DEFAULT_SMTP_FIELDS,
  validateSmtpField,
  type SmtpFieldKey,
} from "@/lib/email/smtp-preferences";
import {
  DEFAULT_WORKSPACE_ADVANCED_FIELDS,
  validateWorkspaceAdvancedField,
  type WorkspaceAdvancedFieldKey,
} from "@/lib/settings/workspace-advanced";

const WORKSPACE_FIELD_PAGES = {
  "inbox/customize": {
    defaults: DEFAULT_INBOX_CUSTOMIZE_FIELDS,
    validate: (key: string, value: string) =>
      validateInboxCustomizeField(key as InboxCustomizeFieldKey, value),
  },
  "chatbox/appearance": {
    defaults: DEFAULT_CHATBOX_APPEARANCE_FIELDS,
    validate: (key: string, value: string) =>
      validateChatboxAppearanceField(key as ChatboxAppearanceFieldKey, value),
  },
  "chatbox/behavior": {
    defaults: DEFAULT_CHATBOX_BEHAVIOR_FIELDS,
    validate: (key: string, value: string) =>
      validateChatboxBehaviorField(key as ChatboxBehaviorFieldKey, value),
  },
  "chatbox/search-ai": {
    defaults: DEFAULT_CHATBOX_SEARCH_AI_FIELDS,
    validate: (key: string, value: string) =>
      validateChatboxSearchAiField(key as ChatboxSearchAiFieldKey, value),
  },
  "email/domain": {
    defaults: DEFAULT_EMAIL_DOMAIN_FIELDS,
    validate: (key: string, value: string) =>
      validateEmailDomainField(key as EmailDomainFieldKey, value),
  },
  "email/delivery": {
    defaults: DEFAULT_SMTP_FIELDS,
    validate: (key: string, value: string) => validateSmtpField(key as SmtpFieldKey, value),
  },
  "workspace/advanced": {
    defaults: DEFAULT_WORKSPACE_ADVANCED_FIELDS,
    validate: (key: string, value: string) =>
      validateWorkspaceAdvancedField(key as WorkspaceAdvancedFieldKey, value),
  },
} as const;

export type WorkspaceFieldSettingsPage = keyof typeof WORKSPACE_FIELD_PAGES;

export function isWorkspaceFieldSettingsPage(
  pageSlug: string,
): pageSlug is WorkspaceFieldSettingsPage {
  return pageSlug in WORKSPACE_FIELD_PAGES;
}

export function workspaceFieldDefaults(pageSlug: WorkspaceFieldSettingsPage) {
  return { ...WORKSPACE_FIELD_PAGES[pageSlug].defaults };
}

export function validateWorkspaceSettingField(
  pageSlug: WorkspaceFieldSettingsPage,
  key: string,
  value: string,
) {
  const page = WORKSPACE_FIELD_PAGES[pageSlug];
  if (!(key in page.defaults)) {
    return "Unknown field key";
  }

  return page.validate(key, value);
}
