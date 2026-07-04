"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useContactSavedFilters } from "@/hooks/useContactSavedFilters";

type ContactFilterContextValue = {
  filters: ReturnType<typeof useContactSavedFilters>["filters"];
  addFilter: ReturnType<typeof useContactSavedFilters>["addFilter"];
  removeFilter: ReturnType<typeof useContactSavedFilters>["removeFilter"];
  createModalOpen: boolean;
  openCreateModal: () => void;
  closeCreateModal: () => void;
};

const ContactFilterContext = createContext<ContactFilterContextValue | null>(null);

export function ContactFilterProvider({ children }: { children: ReactNode }) {
  const { filters, addFilter, removeFilter } = useContactSavedFilters();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const value = useMemo(
    () => ({
      filters,
      addFilter,
      removeFilter,
      createModalOpen,
      openCreateModal: () => setCreateModalOpen(true),
      closeCreateModal: () => setCreateModalOpen(false),
    }),
    [addFilter, createModalOpen, filters, removeFilter],
  );

  return (
    <ContactFilterContext.Provider value={value}>{children}</ContactFilterContext.Provider>
  );
}

export function useContactFilterContext() {
  return useContext(ContactFilterContext);
}
