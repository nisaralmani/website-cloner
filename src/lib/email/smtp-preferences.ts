export type SmtpFieldKey = "smtpHost" | "smtpPort" | "smtpUser" | "smtpPassword" | "smtpFrom";

export type SmtpFields = Record<SmtpFieldKey, string>;

export const EMAIL_DELIVERY_PAGE_SLUG = "email/delivery";

export const SMTP_FIELD_BY_LABEL: Record<string, SmtpFieldKey> = {
  "SMTP host": "smtpHost",
  "SMTP port": "smtpPort",
  "SMTP username": "smtpUser",
  "SMTP password": "smtpPassword",
  "From address": "smtpFrom",
};

export const DEFAULT_SMTP_FIELDS: SmtpFields = {
  smtpHost: "",
  smtpPort: "587",
  smtpUser: "",
  smtpPassword: "",
  smtpFrom: "",
};

export function smtpFieldKeyForLabel(label: string) {
  return SMTP_FIELD_BY_LABEL[label] ?? null;
}

export function validateSmtpField(key: SmtpFieldKey, value: string) {
  const trimmed = value.trim();

  if (key === "smtpPort") {
    if (!trimmed) {
      return null;
    }
    const port = Number(trimmed);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      return "SMTP port must be between 1 and 65535";
    }
    return null;
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
