"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type SettingsSelectFieldProps = {
  label: string;
  value: string;
  options: string[];
  variant?: "default" | "horizontal";
  fieldWidth?: number;
  help?: string;
  full?: boolean;
  saving?: boolean;
  onSave: (value: string) => Promise<boolean>;
};

export function SettingsSelectField({
  label,
  value,
  options,
  variant = "default",
  fieldWidth,
  help,
  full,
  saving,
  onSave,
}: SettingsSelectFieldProps) {
  if (variant === "horizontal") {
    return (
      <div className={cn("flex w-full items-center", saving && "opacity-70", full && "col-span-2")}>
        <label className="w-[140px] shrink-0 pr-10 text-sm font-bold text-[#606976]">{label}</label>
        <div className="relative min-w-0" style={{ width: fieldWidth ?? 340 }}>
          <select
            value={value}
            disabled={saving}
            onChange={(event) => void onSave(event.target.value)}
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
      </div>
    );
  }

  return (
    <div className={cn(full && "col-span-2", saving && "opacity-70")}>
      <label className="mb-1.5 block text-sm font-bold text-[#606976]">{label}</label>
      <div className="relative">
        <select
          value={value}
          disabled={saving}
          onChange={(event) => void onSave(event.target.value)}
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
