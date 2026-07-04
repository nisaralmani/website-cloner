import type { WorkspaceOperator } from "@/types/workspace-operators";
import { toBooleanFlag } from "@/lib/auth/flags";

type OperatorUserRow = {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  avatarGradient: string;
  presenceStatus: string;
  forceOffline: number;
};

type OperatorMembershipRow = {
  userId: string;
  role: string;
  user: OperatorUserRow;
};

export function formatOperatorRole(role: string) {
  if (role === "owner") {
    return "Owner";
  }
  if (role === "admin") {
    return "Admin";
  }
  return "Member";
}

export function operatorDisplayName(user: OperatorUserRow) {
  const trimmed = user.name.trim();
  if (trimmed) {
    return trimmed;
  }

  const combined = `${user.firstName} ${user.lastName}`.trim();
  return combined || user.email;
}

export function operatorAvatarUrl(user: OperatorUserRow) {
  if (user.avatarUrl) {
    return user.avatarUrl;
  }

  const slug = operatorDisplayName(user)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

  if (slug) {
    return `/images/avatars/operator-${slug}.jpg`;
  }

  return "/images/avatars/operator-nisar.jpg";
}

export function isOperatorOnline(user: OperatorUserRow) {
  return user.presenceStatus !== "offline" && !toBooleanFlag(user.forceOffline);
}

export function toWorkspaceOperator(
  row: OperatorMembershipRow,
  currentUserId: string,
): WorkspaceOperator {
  return {
    userId: row.userId,
    name: operatorDisplayName(row.user),
    self: row.userId === currentUserId,
    email: row.user.email,
    avatarUrl: operatorAvatarUrl(row.user),
    role: formatOperatorRole(row.role),
    online: isOperatorOnline(row.user),
  };
}

export function normalizeInviteEmail(value: string) {
  return value.trim().toLowerCase();
}

export function validateInviteEmail(email: string) {
  if (!email) {
    return "email is required";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "email is invalid";
  }
  return null;
}
