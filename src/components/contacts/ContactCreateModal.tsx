"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { ContactSegment } from "@/types/contacts";
import { cn } from "@/lib/utils";

const SEGMENT_OPTIONS: ContactSegment[] = ["chat", "shopify"];

type ContactCreateModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export function ContactCreateModal({ open, onClose, onCreated }: ContactCreateModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [company, setCompany] = useState("");
  const [segments, setSegments] = useState<ContactSegment[]>(["chat"]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const toggleSegment = (segment: ContactSegment) => {
    setSegments((current) =>
      current.includes(segment)
        ? current.filter((value) => value !== segment)
        : [...current, segment],
    );
  };

  const handleCreate = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          location: location.trim() || "Unknown",
          company: company.trim() || "—",
          segments: segments.length > 0 ? segments : (["chat"] as ContactSegment[]),
        }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to create contact");
      }
      setName("");
      setEmail("");
      setLocation("");
      setCompany("");
      setSegments(["chat"]);
      onCreated?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create contact.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex w-full max-w-md flex-col rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#F4F4F5] px-5 py-4">
          <h2 className="text-base font-semibold text-[#1C293B]">New contact</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#828EA1] hover:text-[#1C293B]"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="space-y-3 px-5 py-4">
          {error ? <p className="text-sm text-[#EF4444]">{error}</p> : null}
          <label className="block text-sm font-semibold text-[#1C293B]">
            Name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded border border-[#E8EAEB] px-3 py-2 text-sm font-normal"
            />
          </label>
          <label className="block text-sm font-semibold text-[#1C293B]">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded border border-[#E8EAEB] px-3 py-2 text-sm font-normal"
            />
          </label>
          <label className="block text-sm font-semibold text-[#1C293B]">
            Location
            <input
              type="text"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="mt-1 w-full rounded border border-[#E8EAEB] px-3 py-2 text-sm font-normal"
            />
          </label>
          <label className="block text-sm font-semibold text-[#1C293B]">
            Company
            <input
              type="text"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              className="mt-1 w-full rounded border border-[#E8EAEB] px-3 py-2 text-sm font-normal"
            />
          </label>
          <div>
            <p className="text-sm font-semibold text-[#1C293B]">Segments</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SEGMENT_OPTIONS.map((segment) => (
                <button
                  key={segment}
                  type="button"
                  onClick={() => toggleSegment(segment)}
                  className={cn(
                    "rounded px-2 py-1 text-xs font-bold capitalize",
                    segments.includes(segment)
                      ? "bg-[#1972F5] text-white"
                      : "bg-[#F4F6FB] text-[#5D6B98]",
                  )}
                >
                  {segment}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-[#F4F4F5] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-[#E8EAEB] px-4 py-2 text-sm font-semibold text-[#5D6B98]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !name.trim() || !email.trim()}
            onClick={() => void handleCreate()}
            className="rounded bg-[#1972F5] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Creating…" : "Create contact"}
          </button>
        </div>
      </div>
    </div>
  );
}
