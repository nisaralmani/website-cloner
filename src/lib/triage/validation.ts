import type { TriageRuleset } from "@/types/triage";

export const TRIAGE_ACTION_FILTER_ALL = "All actions";

export const TRIAGE_BLOCK_ACTIONS = ["Send to Spam", "Drop Message"] as const;
export const TRIAGE_SORT_ACTIONS = [
  "Assign Segment",
  "Set Data Value",
  "Resolve Conversation",
] as const;

export const TRIAGE_ACTIONS = [...TRIAGE_BLOCK_ACTIONS, ...TRIAGE_SORT_ACTIONS] as const;

export const DEFAULT_BLOCK_ACTION = TRIAGE_BLOCK_ACTIONS[0];
export const DEFAULT_SORT_ACTION = TRIAGE_SORT_ACTIONS[0];

export function defaultActionForRuleset(ruleset: TriageRuleset) {
  return ruleset === "block" ? DEFAULT_BLOCK_ACTION : DEFAULT_SORT_ACTION;
}

export function validateRuleset(ruleset: string) {
  if (ruleset !== "block" && ruleset !== "sort") {
    return "ruleset must be block or sort";
  }
  return null;
}

export function validateActionForRuleset(ruleset: TriageRuleset, action: string) {
  const allowed: readonly string[] =
    ruleset === "block" ? TRIAGE_BLOCK_ACTIONS : TRIAGE_SORT_ACTIONS;
  if (!allowed.includes(action)) {
    return `action must be one of: ${allowed.join(", ")}`;
  }
  return null;
}

export function validateRuleName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    return "name is required";
  }
  if (trimmed.length > 120) {
    return "name is too long";
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

export function defaultRuleName(ruleset: TriageRuleset) {
  return ruleset === "block" ? "New block rule" : "New sort rule";
}
