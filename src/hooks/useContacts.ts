"use client";

import { useCallback, useEffect, useState } from "react";
import type { Contact } from "@/types/contacts";

export function useContacts(searchQuery = "", segment = "") {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      const query = searchQuery.trim();
      if (query) params.set("q", query);
      const segmentFilter = segment.trim().toLowerCase();
      if (segmentFilter) params.set("segment", segmentFilter);

      const response = await fetch(
        `/api/contacts${params.size > 0 ? `?${params.toString()}` : ""}`,
      );
      if (!response.ok) {
        throw new Error("Failed to load contacts");
      }
      const data = (await response.json()) as {
        contacts: Contact[];
        total: number;
      };
      setContacts(data.contacts);
      setTotal(data.total);
    } catch {
      setError("Unable to load contacts.");
      setContacts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, segment]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { contacts, total, loading, error, reload };
}
