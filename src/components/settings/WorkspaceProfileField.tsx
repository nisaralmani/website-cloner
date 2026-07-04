"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { WorkspaceProfileFieldKey } from "@/lib/workspaces/profile-fields";

type WorkspaceProfileFieldProps = {
  label: string;
  fieldKey: WorkspaceProfileFieldKey;
  value: string;
  placeholder?: string;
  required?: boolean;
  saving?: boolean;
  onSave: (field: WorkspaceProfileFieldKey, value: string) => Promise<boolean>;
};

export function WorkspaceProfileField({
  label,
  fieldKey,
  value,
  placeholder,
  required,
  saving,
  onSave,
}: WorkspaceProfileFieldProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const handleBlur = () => {
    if (draft === value) return;
    void onSave(fieldKey, draft);
  };

  return (
    <div>
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
    </div>
  );
}
