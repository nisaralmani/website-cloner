"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { ContactSegment } from "@/types/contacts";

export type ContactSavedFilter = {
  id: string;
  name: string;
  segment: "" | ContactSegment;
  query: string;
};

const STORAGE_KEY = "bybelt:contact-filters";
const EMPTY_FILTERS: ContactSavedFilter[] = [];
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedFilters: ContactSavedFilter[] = EMPTY_FILTERS;

function emitContactFilterChange() {
  listeners.forEach((listener) => listener());
}

function subscribeContactFilters(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readFilters(): ContactSavedFilter[] {
  if (typeof window === "undefined") return EMPTY_FILTERS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedFilters;
    cachedRaw = raw;
    if (!raw) {
      cachedFilters = EMPTY_FILTERS;
      return cachedFilters;
    }
    const parsed = JSON.parse(raw) as ContactSavedFilter[];
    cachedFilters = Array.isArray(parsed) ? parsed : EMPTY_FILTERS;
    return cachedFilters;
  } catch {
    cachedRaw = null;
    cachedFilters = EMPTY_FILTERS;
    return cachedFilters;
  }
}

function getServerSnapshot() {
  return EMPTY_FILTERS;
}

function writeFilters(filters: ContactSavedFilter[]) {
  const serialized = JSON.stringify(filters);
  window.localStorage.setItem(STORAGE_KEY, serialized);
  cachedRaw = serialized;
  cachedFilters = filters;
  emitContactFilterChange();
}

export function useContactSavedFilters() {
  const filters = useSyncExternalStore(
    subscribeContactFilters,
    readFilters,
    getServerSnapshot,
  );

  const refresh = useCallback(() => {
    emitContactFilterChange();
  }, []);

  const addFilter = useCallback(
    (input: { name: string; segment: "" | ContactSegment; query: string }) => {
      const next: ContactSavedFilter = {
        id: `filter-${Date.now()}`,
        name: input.name.trim(),
        segment: input.segment,
        query: input.query.trim(),
      };
      const updated = [...readFilters(), next];
      writeFilters(updated);
      return next;
    },
    [],
  );

  const removeFilter = useCallback((id: string) => {
    const updated = readFilters().filter((filter) => filter.id !== id);
    writeFilters(updated);
  }, []);

  return { filters, addFilter, removeFilter, refresh };
}
