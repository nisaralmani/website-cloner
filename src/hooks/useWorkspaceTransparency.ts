"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { TableRowCell } from "@/lib/settings-data";
import { auditLogsToTableRows } from "@/lib/transparency/mappers";
import {
  AUDIT_ACTION_FILTER_ALL,
  AUDIT_OPERATOR_FILTER_ALL,
} from "@/lib/transparency/validation";
import type { WorkspaceTransparencyPayload } from "@/types/workspace-transparency";

const emptyPayload: WorkspaceTransparencyPayload = {
  logs: [],
  operators: [],
  actions: [],
};

export function useWorkspaceTransparency(enabled: boolean) {
  const [data, setData] = useState<WorkspaceTransparencyPayload>(emptyPayload);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [operatorFilter, setOperatorFilter] = useState(AUDIT_OPERATOR_FILTER_ALL);
  const [actionFilter, setActionFilter] = useState(AUDIT_ACTION_FILTER_ALL);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (operatorFilter !== AUDIT_OPERATOR_FILTER_ALL) {
      params.set("operatorId", operatorFilter);
    }
    if (actionFilter !== AUDIT_ACTION_FILTER_ALL) {
      params.set("action", actionFilter);
    }
    if (dateFrom) {
      params.set("dateFrom", new Date(`${dateFrom}T00:00:00.000Z`).toISOString());
    }
    if (dateTo) {
      params.set("dateTo", new Date(`${dateTo}T23:59:59.999Z`).toISOString());
    }

    const query = params.toString();
    const response = await fetch(
      `/api/workspaces/transparency${query ? `?${query}` : ""}`,
    );
    if (!response.ok) {
      throw new Error("Failed to load transparency logs");
    }
    return (await response.json()) as WorkspaceTransparencyPayload;
  }, [actionFilter, dateFrom, dateTo, operatorFilter]);

  useEffect(() => {
    if (!enabled) {
      setData(emptyPayload);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const payload = await load();
        if (!cancelled) {
          setData(payload);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load transparency logs.");
          setData(emptyPayload);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, load]);

  const operatorOptions = useMemo(
    () => [
      { userId: AUDIT_OPERATOR_FILTER_ALL, name: AUDIT_OPERATOR_FILTER_ALL },
      ...data.operators,
    ],
    [data.operators],
  );

  const actionOptions = useMemo(
    () => [AUDIT_ACTION_FILTER_ALL, ...data.actions],
    [data.actions],
  );

  const operatorLabel =
    operatorOptions.find((option) => option.userId === operatorFilter)?.name ??
    AUDIT_OPERATOR_FILTER_ALL;

  const auditRows: TableRowCell[][] = useMemo(
    () => auditLogsToTableRows(data.logs),
    [data.logs],
  );

  return {
    logs: data.logs,
    auditRows,
    operatorOptions,
    actionOptions,
    operatorFilter,
    operatorLabel,
    actionFilter,
    setOperatorFilter,
    setActionFilter,
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    loading,
    error,
  };
}
