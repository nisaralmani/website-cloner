import type { routingRules } from "@/db/schema";
import type { RoutingRule } from "@/types/routing-rules";

type RoutingRuleRow = typeof routingRules.$inferSelect;

export function toRoutingRule(row: RoutingRuleRow): RoutingRule {
  return {
    id: row.id,
    name: row.name,
    action: row.action,
    assignTarget: row.assignTarget,
    matchContains: row.matchContains,
    enabled: row.enabled === 1,
    createdAt: row.createdAt.toISOString(),
  };
}

export function activeRoutingRuleCount(rules: RoutingRule[]) {
  return rules.filter((rule) => rule.enabled).length;
}
