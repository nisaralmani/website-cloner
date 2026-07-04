export type ChatboxRestrictionKind =
  | "allowed_page"
  | "blocked_page"
  | "blocked_country"
  | "blocked_locale"
  | "blocked_ip"
  | "blocked_visitor";

export type ChatboxRestriction = {
  id: string;
  kind: ChatboxRestrictionKind;
  value: string;
  createdAt: string;
};
