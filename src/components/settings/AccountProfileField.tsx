"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { ProfileFieldKey } from "@/lib/auth/profile";

type AccountProfileFieldProps = {
  label: string;
  fieldKey: ProfileFieldKey;
  value: string;
  placeholder?: string;
  required?: boolean;
  help?: string;
  full?: boolean;
  saving?: boolean;
  onSave: (field: ProfileFieldKey, value: string) => Promise<boolean>;
};

export function AccountProfileField({
  label,
  fieldKey,
  value,
  placeholder,
  required,
  help,
  full,
  saving,
  onSave,
}: AccountProfileFieldProps) {
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
          "flex h-10 items-center rounded border border-[#E8EAEB] bg-[#F8F9F9]",
          saving && "opacity-70",
        )}
      >
        <input
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
            "h-full w-full rounded border-0 bg-transparent px-3 text-sm text-[#1c293b] outline-none placeholder:font-normal placeholder:text-[#828ea1]",
            draft ? "font-bold" : "font-normal",
          )}
        />
      </div>
      {help && (
        <p className="mt-2.5 text-[13px] font-bold leading-[17px] text-[#8d949d]">{help}</p>
      )}
    </div>
  );
}
