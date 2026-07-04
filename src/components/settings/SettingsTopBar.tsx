"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, PanelLeft, Search } from "lucide-react";
import { useSearch } from "@/components/search/SearchProvider";

export default function SettingsTopBar({
  breadcrumb,
}: {
  breadcrumb?: [string, string];
}) {
  const router = useRouter();
  const { openSearch } = useSearch();

  return (
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#E6EAF0] bg-white px-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded-md text-[#828EA1] hover:bg-[#F4F6FB]"
        >
          <PanelLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-7 w-7 items-center justify-center rounded-md text-[#828EA1] hover:bg-[#F4F6FB]"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => router.forward()}
          className="flex h-7 w-7 items-center justify-center rounded-md text-[#828EA1] hover:bg-[#F4F6FB]"
          aria-label="Go forward"
        >
          <ArrowRight size={18} />
        </button>
        {breadcrumb ? (
          <nav className="ml-1 flex items-center gap-2 text-sm">
            <span className="text-[#828EA1]">Settings</span>
            <span className="text-[#C2C9D6]">|</span>
            <span className="text-[#828EA1]">{breadcrumb[0]}</span>
            <span className="text-[#C2C9D6]">|</span>
            <span className="font-semibold text-[#1c293b]">{breadcrumb[1]}</span>
          </nav>
        ) : (
          <span className="ml-1 text-sm font-semibold text-[#1c293b]">Settings</span>
        )}
      </div>
      <button
        type="button"
        onClick={openSearch}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[#828EA1] hover:bg-[#F4F6FB]"
      >
        <Search size={16} />
        <span>Search</span>
      </button>
    </div>
  );
}
