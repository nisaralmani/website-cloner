"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Contact } from "@/types/contacts";

type CampaignRecipientsModalProps = {
  campaignId: string;
  campaignName: string;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
};

export function CampaignRecipientsModal({
  campaignId,
  campaignName,
  open,
  onClose,
  onUpdated,
}: CampaignRecipientsModalProps) {
  const [recipients, setRecipients] = useState<Contact[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [recipientsRes, contactsRes] = await Promise.all([
        fetch(`/api/campaigns/${campaignId}/recipients`),
        fetch("/api/contacts"),
      ]);
      if (!recipientsRes.ok || !contactsRes.ok) {
        throw new Error("Failed to load recipients");
      }
      const recipientsData = (await recipientsRes.json()) as { recipients: Contact[] };
      const contactsData = (await contactsRes.json()) as { contacts: Contact[] };
      setRecipients(recipientsData.recipients);
      setContacts(contactsData.contacts);
    } catch {
      setError("Unable to load campaign recipients.");
      setRecipients([]);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    if (open) {
      void load();
    }
  }, [load, open]);

  const handleAdd = async () => {
    if (!selectedContactId) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/recipients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactIds: [selectedContactId] }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to add recipient");
      }
      setSelectedContactId("");
      await load();
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add recipient.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (contactId: string) => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/campaigns/${campaignId}/recipients?contactId=${encodeURIComponent(contactId)}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        throw new Error("Failed to remove recipient");
      }
      await load();
      onUpdated();
    } catch {
      setError("Failed to remove recipient.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const recipientIds = new Set(recipients.map((recipient) => recipient.id));
  const availableContacts = contacts.filter((contact) => !recipientIds.has(contact.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#F4F4F5] px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-[#1C293B]">Campaign recipients</h2>
            <p className="text-sm text-[#75869C]">{campaignName}</p>
          </div>
          <button type="button" onClick={onClose} className="text-[#828EA1]" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-4">
          {error ? <p className="mb-3 text-sm text-[#EF4444]">{error}</p> : null}

          <div className="mb-4 flex gap-2">
            <select
              value={selectedContactId}
              onChange={(event) => setSelectedContactId(event.target.value)}
              className="min-w-0 flex-1 rounded border border-[#E8EAEB] bg-[#F8F9F9] px-3 py-2 text-sm text-[#1C293B]"
            >
              <option value="">Add a contact…</option>
              {availableContacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name} ({contact.email})
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!selectedContactId || saving}
              onClick={() => void handleAdd()}
              className="rounded bg-[#1972F5] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Add
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-[#828EA1]">Loading recipients…</p>
          ) : recipients.length === 0 ? (
            <p className="text-sm text-[#828EA1]">No recipients yet.</p>
          ) : (
            <ul className="max-h-64 space-y-2 overflow-auto">
              {recipients.map((recipient) => (
                <li
                  key={recipient.id}
                  className="flex items-center justify-between rounded border border-[#F4F4F5] px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#1C293B]">{recipient.name}</p>
                    <p className="text-xs text-[#75869C]">{recipient.email}</p>
                  </div>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleRemove(recipient.id)}
                    className="text-xs font-semibold text-[#EF4444] disabled:opacity-60"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
