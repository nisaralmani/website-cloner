export type TriageRuleset = "block" | "sort";

export type TriageRule = {
  id: string;
  ruleset: TriageRuleset;
  name: string;
  action: string;
  enabled: boolean;
  matchContains: string | null;
  createdAt: string;
};

export type TriageRulesPayload = {
  rules: TriageRule[];
  blockRules: TriageRule[];
  sortRules: TriageRule[];
  blockActiveCount: number;
  sortActiveCount: number;
};
