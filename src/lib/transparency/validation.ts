export const AUDIT_ACTION_FILTER_ALL = "All actions";
export const AUDIT_OPERATOR_FILTER_ALL = "All operators";

export const AUDIT_ACTIONS = [
  "Operator logged in",
  "Operator logged out",
  "Workspace settings",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export function parseTransparencyQuery(searchParams: URLSearchParams) {
  const operatorId = searchParams.get("operatorId")?.trim() || AUDIT_OPERATOR_FILTER_ALL;
  const action = searchParams.get("action")?.trim() || AUDIT_ACTION_FILTER_ALL;

  const dateFromRaw = searchParams.get("dateFrom")?.trim();
  const dateToRaw = searchParams.get("dateTo")?.trim();

  const dateFrom = dateFromRaw ? new Date(dateFromRaw) : undefined;
  const dateTo = dateToRaw ? new Date(dateToRaw) : undefined;

  if (action !== AUDIT_ACTION_FILTER_ALL && !AUDIT_ACTIONS.includes(action as AuditAction)) {
    return { error: "Unknown action filter" as const };
  }

  if (dateFrom && Number.isNaN(dateFrom.getTime())) {
    return { error: "Invalid dateFrom" as const };
  }

  if (dateTo && Number.isNaN(dateTo.getTime())) {
    return { error: "Invalid dateTo" as const };
  }

  return {
    operatorId,
    action,
    dateFrom,
    dateTo,
  };
}
