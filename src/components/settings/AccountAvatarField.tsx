"use client";

import { useId, useRef } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { PersonGlyph } from "@/components/icons";

type AccountAvatarFieldProps = {
  help?: string;
  avatarUrl: string;
  avatarGradient: string;
  saving?: boolean;
  onUpload: (file: File) => Promise<boolean>;
  onRemove: () => Promise<boolean>;
};

export function AccountAvatarField({
  help,
  avatarUrl,
  avatarGradient,
  saving,
  onUpload,
  onRemove,
}: AccountAvatarFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-start gap-5">
      <div className="flex h-[120px] w-[120px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#E8EAEB] bg-[#F8F9F9]">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="h-[104px] w-[104px] rounded-full object-cover"
          />
        ) : (
          <div
            className={cn(
              "flex h-[104px] w-[104px] items-center justify-center rounded-full bg-gradient-to-br text-white",
              avatarGradient,
            )}
          >
            <PersonGlyph size={40} />
          </div>
        )}
      </div>
      <div className={cn("pt-1", saving && "opacity-70")}>
        {help && (
          <p className="max-w-md text-sm font-medium leading-relaxed text-[#2c405a]">{help}</p>
        )}
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
            <Upload size={14} className="mr-1.5" />
            Upload image
          </button>
          {avatarUrl && (
            <button
              type="button"
              className="h-[30px] rounded px-2 text-xs font-bold text-[#333e4f]"
              onClick={() => void onRemove()}
            >
              Clear existing
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
