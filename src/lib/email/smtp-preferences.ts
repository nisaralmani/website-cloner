export type SmtpFieldKey =
  | "smtpHost"
  | "smtpPort"
  | "smtpUser"
  | "smtpPassword"
  | "smtpFrom"
  | "smtpFromName"
  | "imapHost"
  | "imapPort"
  | "imapUser"
  | "imapPassword";

export type SmtpFields = Record<SmtpFieldKey, string>;

export const EMAIL_DELIVERY_PAGE_SLUG = "email/delivery";

export const SMTP_FIELD_BY_LABEL: Record<string, SmtpFieldKey> = {
  "SMTP host": "smtpHost",
  "SMTP port": "smtpPort",
  "SMTP username": "smtpUser",
  "SMTP password": "smtpPassword",
  "From address": "smtpFrom",
  "From name": "smtpFromName",
  "IMAP host": "imapHost",
  "IMAP port": "imapPort",
  "IMAP username": "imapUser",
  "IMAP password": "imapPassword",
};

export const DEFAULT_SMTP_FIELDS: SmtpFields = {
  smtpHost: "",
  smtpPort: "587",
  smtpUser: "",
  smtpPassword: "",
  smtpFrom: "",
  smtpFromName: "",
  imapHost: "",
  imapPort: "993",
  imapUser: "",
  imapPassword: "",
};

export function smtpFieldKeyForLabel(label: string) {
  return SMTP_FIELD_BY_LABEL[label] ?? null;
}

function validatePortField(trimmed: string, label: string) {
  if (!trimmed) return null;
  const port = Number(trimmed);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return `${label} port must be between 1 and 65535`;
  }
  return null;
}

export function validateSmtpField(key: SmtpFieldKey, value: string) {
  const trimmed = value.trim();

  if (key === "smtpPort") {
    return validatePortField(trimmed, "SMTP");
  }

  if (key === "imapPort") {
    return validatePortField(trimmed, "IMAP");
  }

  if (key === "smtpFrom" && trimmed && !trimmed.includes("@")) {
    return "From address must be a valid email";
  }

  return null;
}

export function isSmtpConfigComplete(fields: SmtpFields) {
  return Boolean(
    fields.smtpHost.trim() &&
      fields.smtpPort.trim() &&
      fields.smtpUser.trim() &&
      fields.smtpFrom.trim(),
  );
}

export function isImapConfigComplete(fields: SmtpFields) {
  return Boolean(fields.imapHost.trim() && fields.imapPort.trim() && fields.imapUser.trim());
}

/** Derives TLS mode by port convention (465/993 => implicit TLS) since no
 * explicit secure toggle is exposed in the UI. Matches how virtually every
 * real IMAP/SMTP provider (Gmail, IONOS, Zoho, Outlook, etc.) is configured. */
export function isImplicitTlsPort(port: string): boolean {
  const parsed = Number(port.trim());
  return parsed === 465 || parsed === 993;
}
