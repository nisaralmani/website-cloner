"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Contact, ContactSegment } from "@/types/contacts";
import { cn } from "@/lib/utils";

import { useShopifySyncStatus } from "@/hooks/useShopifySyncStatus";

const SEGMENT_OPTIONS: ContactSegment[] = ["chat", "shopify"];

function shopifyCustomerSearchUrl(shopAdminBase: string, email: string): string {
  return `${shopAdminBase.replace(/\/$/, "")}/customers?query=${encodeURIComponent(email)}`;
}

type ContactPreviewModalProps = {
  contactId: string | null;
  onClose: () => void;
  onUpdated?: () => void;
  onDeleted?: () => void;
};

export function ContactPreviewModal({
  contactId,
  onClose,
  onUpdated,
  onDeleted,
}: ContactPreviewModalProps) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [company, setCompany] = useState("");
  const [segments, setSegments] = useState<ContactSegment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [enrichMessage, setEnrichMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { status: shopifyStatus } = useShopifySyncStatus();

  useEffect(() => {
    if (!contactId) {
      setContact(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const response = await fetch(`/api/contacts/${contactId}`);
        if (!response.ok) {
          throw new Error("Failed to load contact");
        }
        const data = (await response.json()) as { contact: Contact };
        if (!cancelled) {
          setContact(data.contact);
          setName(data.contact.name);
          setEmail(data.contact.email);
          setLocation(data.contact.location);
          setCompany(data.contact.company);
          setSegments(data.contact.segments);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load contact.");
          setContact(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [contactId]);

  const handleSave = async () => {
    if (!contactId) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          location: location.trim(),
          company: company.trim(),
          segments,
        }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to save contact");
      }
      const data = (await response.json()) as { contact: Contact };
      setContact(data.contact);
      onUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save contact.");
    } finally {
      setSaving(false);
    }
  };

  const handleEnrichFromShopify = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setEnrichMessage("Add an email before enriching from Shopify.");
      return;
    }

    setEnriching(true);
    setEnrichMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/integrations/shopify/sync", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const payload = (await response.json()) as {
        error?: string;
        matched?: boolean;
        synced?: boolean;
        created?: boolean;
        updated?: boolean;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Shopify enrich failed");
      }
      if (!payload.matched) {
        setEnrichMessage("No Shopify customer found for this email.");
        return;
      }
      setEnrichMessage(
        payload.synced
          ? payload.created
            ? "Contact created from Shopify."
            : payload.updated
              ? "Contact updated from Shopify."
              : "Contact refreshed from Shopify."
          : "Matched in Shopify but contact sync failed.",
      );
      onUpdated?.();
    } catch (err) {
      setEnrichMessage(err instanceof Error ? err.message : "Shopify enrich failed.");
    } finally {
      setEnriching(false);
    }
  };

  const handleDelete = async () => {
    if (!contactId) return;
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/contacts/${contactId}`, { method: "DELETE" });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to delete contact");
      }
      onDeleted?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete contact.");
    } finally {
      setDeleting(false);
    }
  };

  if (!contactId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#F4F4F5] px-6 py-4">
          <h2 className="text-base font-semibold text-[#1C293B]">Contact preview</h2>
          <button type="button" onClick={onClose} className="text-[#828EA1]" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 px-6 py-4 text-sm">
          {error ? <p className="text-[#EF4444]">{error}</p> : null}

          {loading ? (
            <p className="text-[#828EA1]">Loading contact…</p>
          ) : contact ? (
            <>
              <label className="block">
                <span className="text-xs font-semibold uppercase text-[#828EA1]">Name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-1 w-full rounded border border-[#E8EAEB] bg-[#F8F9F9] px-3 py-2 text-sm text-[#1C293B]"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase text-[#828EA1]">Email</span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-1 w-full rounded border border-[#E8EAEB] bg-[#F8F9F9] px-3 py-2 text-sm text-[#1C293B]"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase text-[#828EA1]">Location</span>
                <input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  className="mt-1 w-full rounded border border-[#E8EAEB] bg-[#F8F9F9] px-3 py-2 text-sm text-[#1C293B]"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase text-[#828EA1]">Company</span>
                <input
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  className="mt-1 w-full rounded border border-[#E8EAEB] bg-[#F8F9F9] px-3 py-2 text-sm text-[#1C293B]"
                />
              </label>
              <div>
                <p className="text-xs font-semibold uppercase text-[#828EA1]">Segments</p>
                <div className="mt-2 flex gap-2">
                  {SEGMENT_OPTIONS.map((segment) => {
                    const active = segments.includes(segment);
                    return (
                      <button
                        key={segment}
                        type="button"
                        onClick={() =>
                          setSegments((current) =>
                            active
                              ? current.filter((item) => item !== segment)
                              : [...current, segment],
                          )
                        }
                        className={cn(
                          "rounded px-2 py-1 text-xs font-semibold capitalize",
                          active
                            ? "bg-[#1972F5] text-white"
                            : "border border-[#E8EAEB] bg-[#F8F9F9] text-[#5D6B98]",
                        )}
                      >
                        {segment}
                      </button>
                    );
                  })}
                </div>
              </div>
              {enrichMessage ? <p className="text-sm text-[#5D6B98]">{enrichMessage}</p> : null}
              {shopifyStatus?.linked &&
              shopifyStatus.shopAdminUrl &&
              segments.includes("shopify") &&
              email.trim() ? (
                <a
                  href={shopifyCustomerSearchUrl(shopifyStatus.shopAdminUrl, email.trim())}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex text-sm font-semibold text-[#5DAC5D] hover:underline"
                >
                  Open in Shopify admin
                </a>
              ) : null}
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  disabled={enriching}
                  onClick={() => void handleEnrichFromShopify()}
                  className="rounded border border-[#39A746] bg-white px-3 py-2 text-sm font-semibold text-[#39A746] disabled:opacity-60"
                >
                  {enriching ? "Refreshing…" : "Refresh from Shopify"}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSave()}
                  className="rounded bg-[#1972F5] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => void handleDelete()}
                  className="rounded border border-[#FECACA] px-4 py-2 text-sm font-semibold text-[#EF4444] disabled:opacity-60"
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
