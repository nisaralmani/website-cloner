"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { HelpdeskCategory } from "@/types/helpdesk";

type HelpdeskCategoryModalProps = {
  categoryId: string | null;
  onClose: () => void;
};

export function HelpdeskCategoryModal({ categoryId, onClose }: HelpdeskCategoryModalProps) {
  const [category, setCategory] = useState<HelpdeskCategory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId) {
      setCategory(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const response = await fetch(`/api/helpdesk/categories/${categoryId}`);
        if (!response.ok) throw new Error("Failed to load category");
        const data = (await response.json()) as { category: HelpdeskCategory };
        if (!cancelled) setCategory(data.category);
      } catch {
        if (!cancelled) {
          setError("Unable to load category.");
          setCategory(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  if (!categoryId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#F4F4F5] px-5 py-4">
          <h2 className="text-base font-semibold text-[#1C293B]">Category Details</h2>
          <button type="button" onClick={onClose} className="text-[#828EA1]" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-3 px-5 py-4 text-sm">
          {loading ? (
            <p className="text-[#828EA1]">Loading category…</p>
          ) : error ? (
            <p className="text-[#828EA1]">{error}</p>
          ) : category ? (
            <>
              <div>
                <p className="text-xs font-semibold uppercase text-[#75869C]">Name</p>
                <p className="font-semibold text-[#1C293B]">{category.name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-[#75869C]">Articles</p>
                <p className="text-[#1C293B]">{category.articleCount}</p>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
