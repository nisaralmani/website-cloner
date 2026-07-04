export const ROUTING_ACTIONS = [
  "Assign to Operator",
  "Assign to Team",
  "Round Robin",
] as const;

export const DEFAULT_ROUTING_ACTION = ROUTING_ACTIONS[0];

export const ROUTING_ENABLE_RULES_TOGGLE_KEY = "1-0";
export const ROUTING_RERUN_24H_TOGGLE_KEY = "1-1";
export const ROUTING_RERUN_OFFLINE_TOGGLE_KEY = "1-2";

export function isRoutingRerunToggleKey(localKey: string) {
  return (
    localKey === ROUTING_RERUN_24H_TOGGLE_KEY ||
    localKey === ROUTING_RERUN_OFFLINE_TOGGLE_KEY
  );
}

export function validateRoutingRuleName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    return "name is required";
  }
  if (trimmed.length > 120) {
    return "name is too long";
  }
  return null;
}

export function validateRoutingAction(action: string) {
  if (!ROUTING_ACTIONS.includes(action as (typeof ROUTING_ACTIONS)[number])) {
    return `action must be one of: ${ROUTING_ACTIONS.join(", ")}`;
  }
  return null;
}

export function validateAssignTarget(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > 120) {
    return "assignTarget is too long";
  }
  return null;
}

export function validateMatchContains(value: string | null | undefined) {
  if (!value) return null;
  if (value.length > 500) {
    return "matchContains is too long";
  }
  return null;
}

export function normalizeAssignTarget(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed || null;
}

export function defaultRoutingRuleName(existingCount: number) {
  return `Routing rule ${existingCount + 1}`;
}
