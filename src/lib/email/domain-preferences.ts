export type EmailDomainFieldKey = "basicDomain" | "customDomain" | "domainVerified";

export type EmailDomainFields = Record<EmailDomainFieldKey, string>;

export const EMAIL_DOMAIN_FIELD_BY_LABEL: Record<string, EmailDomainFieldKey> = {
  "Basic domain": "basicDomain",
  "Custom domain": "customDomain",
};

export const DEFAULT_EMAIL_DOMAIN_FIELDS: EmailDomainFields = {
  basicDomain: "fabzop",
  customDomain: "",
  domainVerified: "false",
};

const BASIC_DOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const CUSTOM_DOMAIN_PATTERN =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

export function emailDomainFieldKeyForLabel(label: string) {
  return EMAIL_DOMAIN_FIELD_BY_LABEL[label] ?? null;
}

export function validateEmailDomainField(key: EmailDomainFieldKey, value: string) {
  const trimmed = value.trim();

  if (key === "domainVerified") {
    if (trimmed !== "true" && trimmed !== "false") {
      return "domainVerified must be true or false";
    }
    return null;
  }

  if (key === "customDomain") {
    if (!trimmed) {
      return null;
    }
    if (!CUSTOM_DOMAIN_PATTERN.test(trimmed)) {
      return "Custom domain must be a valid hostname";
    }
    return null;
  }

  if (!trimmed) {
    return "Basic domain is required";
  }
  if (!BASIC_DOMAIN_PATTERN.test(trimmed)) {
    return "Basic domain must use lowercase letters, numbers, and hyphens";
  }

  return null;
}
