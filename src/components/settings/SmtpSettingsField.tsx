"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { SmtpFieldKey } from "@/lib/email/smtp-preferences";

type SmtpSettingsFieldProps = {
  label: string;
  fieldKey: SmtpFieldKey;
  value: string;
  placeholder?: string;
  required?: boolean;
  full?: boolean;
  saving?: boolean;
  onSave: (field: SmtpFieldKey, value: string) => Promise<boolean>;
};

export function SmtpSettingsField({
  label,
  fieldKey,
  value,
  placeholder,
  required,
  full,
  saving,
  onSave,
}: SmtpSettingsFieldProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const handleBlur = () => {
    if (draft === value) return;
    void onSave(fieldKey, draft);
  };

  return (
    <div className={cn(full && "col-span-2")}>
      <label className="mb-1.5 block text-sm font-bold text-[#606976]">
        {label}
        {required && <span className="text-[#606976]"> *</span>}
      </label>
      <div
        className={cn(
          "flex h-10 items-center overflow-hidden rounded border border-[#E8EAEB] bg-[#F8F9F9]",
          saving && "opacity-70",
        )}
      >
        <input
          type={fieldKey === "smtpPassword" ? "password" : "text"}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={handleBlur}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
          placeholder={placeholder}
          className={cn(
            "h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-[#1c293b] outline-none placeholder:font-normal placeholder:text-[#828ea1]",
            draft ? "font-bold" : "font-normal",
          )}
        />
      </div>
    </div>
  );
}
