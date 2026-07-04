"use client";

import { useId, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PersonGlyph } from "@/components/icons";

type WorkspaceLogoFieldProps = {
  label: string;
  instructions?: string;
  button: string;
  logoUrl: string;
  initials: string;
  saving?: boolean;
  onUpload: (file: File) => Promise<boolean>;
  onRemove: () => Promise<boolean>;
};

export function WorkspaceLogoField({
  label,
  instructions,
  button,
  logoUrl,
  initials,
  saving,
  onUpload,
  onRemove,
}: WorkspaceLogoFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="col-span-2 flex items-start gap-5">
      <div className="flex h-[120px] w-[120px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E8EAEB] bg-[#F8F9F9]">
        {logoUrl ? (
          <img src={logoUrl} alt="" className="h-20 w-20 rounded-full object-cover" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-blue-500 text-sm font-bold text-white">
            {initials || <PersonGlyph size={32} />}
          </div>
        )}
      </div>
      <div className={cn("min-w-0 flex-1 pt-1", saving && "opacity-70")}>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-sm font-semibold text-[#1c293b]">{label}</span>
          {instructions && (
            <span className="text-sm font-semibold text-[#8d949d]">{instructions}</span>
          )}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onUpload(file);
              event.currentTarget.value = "";
            }}
          />
          <button
            type="button"
            className="inline-flex h-9 items-center rounded border border-black/10 bg-[#1972F5] px-4 text-[13px] font-bold text-white"
            onClick={() => inputRef.current?.click()}
          >
            {button}
          </button>
          {logoUrl && (
            <button
              type="button"
              aria-label="Remove image"
              className="inline-flex h-[30px] w-[42px] items-center justify-center rounded border border-[#E8EAEB] bg-white text-[#333e4f]"
              onClick={() => void onRemove()}
            >
              <X size={16} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
