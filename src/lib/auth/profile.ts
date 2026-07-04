export type ProfileFieldKey = "firstName" | "lastName" | "email" | "phone";

export type AccountProfile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  name: string;
  avatarUrl: string;
  emailVerified: boolean;
};

export const PROFILE_FIELD_BY_LABEL: Record<string, ProfileFieldKey> = {
  "First Name": "firstName",
  "Last Name": "lastName",
  Email: "email",
  Phone: "phone",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function profileFieldKeyForLabel(label: string): ProfileFieldKey | null {
  return PROFILE_FIELD_BY_LABEL[label] ?? null;
}

export function splitDisplayName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }
  if (parts.length === 1) {
    return { firstName: parts[0]!, lastName: "" };
  }
  return { firstName: parts[0]!, lastName: parts.slice(1).join(" ") };
}

export function combineDisplayName(firstName: string, lastName: string) {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
}

import { toBooleanFlag } from "@/lib/auth/flags";

export function normalizeProfileInput(user: {
  name: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  emailVerified?: number | boolean | null;
}): AccountProfile {
  const firstName = user.firstName?.trim() || splitDisplayName(user.name).firstName;
  const lastName = user.lastName?.trim() || splitDisplayName(user.name).lastName;
  const name = combineDisplayName(firstName, lastName) || user.name.trim();

  return {
    firstName,
    lastName,
    email: user.email.trim().toLowerCase(),
    phone: user.phone?.trim() ?? "",
    name,
    avatarUrl: user.avatarUrl?.trim() ?? "",
    emailVerified: toBooleanFlag(user.emailVerified),
  };
}

export function validateProfilePatch(patch: Partial<Record<ProfileFieldKey, string>>) {
  const errors: string[] = [];

  if (patch.firstName !== undefined && !patch.firstName.trim()) {
    errors.push("firstName is required");
  }
  if (patch.lastName !== undefined && !patch.lastName.trim()) {
    errors.push("lastName is required");
  }
  if (patch.email !== undefined) {
    const email = patch.email.trim().toLowerCase();
    if (!email || !EMAIL_PATTERN.test(email)) {
      errors.push("email must be valid");
    }
  }
  if (patch.phone !== undefined && patch.phone.trim()) {
    const phone = patch.phone.trim();
    if (!/^\+?[0-9()\-\s]{6,20}$/.test(phone)) {
      errors.push("phone must be a valid number");
    }
  }

  return errors;
}

export function sanitizeProfilePatch(patch: Partial<Record<ProfileFieldKey, string>>) {
  const sanitized: Partial<Record<ProfileFieldKey, string>> = {};

  if (patch.firstName !== undefined) {
    sanitized.firstName = patch.firstName.trim();
  }
  if (patch.lastName !== undefined) {
    sanitized.lastName = patch.lastName.trim();
  }
  if (patch.email !== undefined) {
    sanitized.email = patch.email.trim().toLowerCase();
  }
  if (patch.phone !== undefined) {
    sanitized.phone = patch.phone.trim();
  }

  return sanitized;
}
