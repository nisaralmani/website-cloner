"use client";

import { useState } from "react";
import {
  DEFAULT_CHATBOX_ATTACHMENT_MAX_BYTES,
  MAX_CHATBOX_ATTACHMENT_MAX_BYTES,
  MIN_CHATBOX_ATTACHMENT_MAX_BYTES,
} from "@/lib/chatbox/attachment-limits";

type ChatboxAttachmentsPanelProps = {
  maxBytes: number;
  loading?: boolean;
  saving?: boolean;
  error?: string | null;
  onSave: (maxBytes: number) => Promise<boolean>;
};

function formatMegabytes(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ChatboxAttachmentsPanel({
  maxBytes,
  loading,
  saving,
  error,
  onSave,
}: ChatboxAttachmentsPanelProps) {
  const [localMb, setLocalMb] = useState(String(maxBytes / (1024 * 1024)));

  if (loading) {
    return <p className="text-sm text-[#75869c]">Loading attachment limits…</p>;
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-[#EF4444]">{error}</p> : null}
      <p className="text-sm text-[#75869c]">
        Maximum file size for visitor and operator uploads in the chatbox (
        {formatMegabytes(MIN_CHATBOX_ATTACHMENT_MAX_BYTES)}–
        {formatMegabytes(MAX_CHATBOX_ATTACHMENT_MAX_BYTES)}).
      </p>
      <label className="block text-sm font-semibold text-[#1c293b]">
        Max attachment size (MB)
        <input
          type="number"
          min={MIN_CHATBOX_ATTACHMENT_MAX_BYTES / (1024 * 1024)}
          max={MAX_CHATBOX_ATTACHMENT_MAX_BYTES / (1024 * 1024)}
          step={0.1}
          value={localMb}
          onChange={(event) => setLocalMb(event.target.value)}
          className="mt-1 block w-full max-w-[200px] rounded border border-[#E8EAEB] px-3 py-2 text-sm text-[#1c293b]"
        />
      </label>
      <button
        type="button"
        disabled={saving}
        onClick={() => {
          const parsed = Number.parseFloat(localMb);
          if (!Number.isFinite(parsed)) return;
          void onSave(Math.round(parsed * 1024 * 1024));
        }}
        className="rounded bg-[#1972F5] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save limit"}
      </button>
      <p className="text-xs text-[#828EA1]">
        Default: {formatMegabytes(DEFAULT_CHATBOX_ATTACHMENT_MAX_BYTES)}
      </p>
    </div>
  );
}
