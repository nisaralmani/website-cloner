export type RoutingRule = {
  id: string;
  name: string;
  action: string;
  assignTarget: string | null;
  matchContains: string | null;
  enabled: boolean;
  createdAt: string;
};
