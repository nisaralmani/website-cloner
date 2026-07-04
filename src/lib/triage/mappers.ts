import type { triageRules } from "@/db/schema";
import type { TriageRule, TriageRuleset } from "@/types/triage";

type TriageRuleRow = typeof triageRules.$inferSelect;

export function toTriageRule(row: TriageRuleRow): TriageRule {
  return {
    id: row.id,
    ruleset: row.ruleset as TriageRuleset,
    name: row.name,
    action: row.action,
    enabled: row.enabled === 1,
    matchContains: row.matchContains,
    createdAt: row.createdAt.toISOString(),
  };
}

export function splitTriageRules(rules: TriageRule[]) {
  const blockRules = rules.filter((rule) => rule.ruleset === "block");
  const sortRules = rules.filter((rule) => rule.ruleset === "sort");

  return {
    blockRules,
    sortRules,
    blockActiveCount: blockRules.filter((rule) => rule.enabled).length,
    sortActiveCount: sortRules.filter((rule) => rule.enabled).length,
  };
}

export function activeCountLabel(count: number) {
  return `${count} active rule${count === 1 ? "" : "s"}`;
}
