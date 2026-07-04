"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type EmailSignaturePanelProps = {
  enabled: boolean;
  text: string;
  loading?: boolean;
  saving?: boolean;
  error?: string | null;
  onSave: (value: { enabled: boolean; text: string }) => Promise<boolean>;
};

export function EmailSignaturePanel({
  enabled,
  text,
  loading,
  saving,
  error,
  onSave,
}: EmailSignaturePanelProps) {
  const [localEnabled, setLocalEnabled] = useState(enabled);
  const [localText, setLocalText] = useState(text);

  if (loading) {
    return <p className="text-sm text-[#75869c]">Loading signature settings…</p>;
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-[#EF4444]">{error}</p> : null}
      <label className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={localEnabled}
          disabled={saving}
          onClick={() => setLocalEnabled((current) => !current)}
          className={cn(
            "relative h-6 w-[42px] shrink-0 rounded-[20px] transition-colors",
            localEnabled ? "bg-[#1972F5]" : "bg-[#F4F4F5]",
            saving && "opacity-60",
          )}
        >
          <span
            className={cn(
              "absolute top-1 h-4 w-4 rounded-full transition-all",
              localEnabled ? "left-[22px] bg-white" : "left-1 bg-[#bbbfc4]",
            )}
          />
        </button>
        <span className="text-sm font-semibold text-[#1c293b]">
          Append a text signature at the bottom of all sent emails
        </span>
      </label>
      <textarea
        value={localText}
        onChange={(event) => setLocalText(event.target.value)}
        rows={4}
        placeholder="Best regards,&#10;Your Team"
        className="w-full rounded border border-[#E8EAEB] bg-[#F8F9F9] px-3 py-2 text-sm text-[#1c293b]"
      />
      <button
        type="button"
        disabled={saving}
        onClick={() => void onSave({ enabled: localEnabled, text: localText })}
        className="rounded bg-[#1972F5] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save signature"}
      </button>
    </div>
  );
}
