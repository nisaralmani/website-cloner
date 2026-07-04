"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InterfaceFieldKey } from "@/lib/auth/interface-preferences";

type InterfaceSelectFieldProps = {
  label: string;
  fieldKey: InterfaceFieldKey;
  value: string;
  options: string[];
  help?: string;
  full?: boolean;
  saving?: boolean;
  onSave: (field: InterfaceFieldKey, value: string) => Promise<boolean>;
};

export function InterfaceSelectField({
  label,
  fieldKey,
  value,
  options,
  help,
  full,
  saving,
  onSave,
}: InterfaceSelectFieldProps) {
  return (
    <div className={cn(full && "col-span-2", saving && "opacity-70")}>
      <label className="mb-1.5 block text-sm font-bold text-[#606976]">{label}</label>
      <div className="relative">
        <select
          value={value}
          disabled={saving}
          onChange={(event) => void onSave(fieldKey, event.target.value)}
          className="flex h-10 w-full appearance-none rounded border border-[#E8EAEB] bg-[#F8F9F9] px-3 text-sm font-bold text-[#1c293b] outline-none"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#828ea1]"
        />
      </div>
      {help && <p className="mt-1.5 text-xs leading-relaxed text-[#828ea1]">{help}</p>}
    </div>
  );
}
