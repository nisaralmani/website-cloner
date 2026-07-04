"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Plugin } from "@/types/plugins";

type PluginDetailModalProps = {
  plugin: Plugin | null;
  onClose: () => void;
  onToggleInstall?: (pluginId: string, installed: boolean) => Promise<void>;
};

export function PluginDetailModal({
  plugin,
  onClose,
  onToggleInstall,
}: PluginDetailModalProps) {
  const [pending, setPending] = useState(false);
  const [localInstalled, setLocalInstalled] = useState<boolean | null>(null);

  useEffect(() => {
    setLocalInstalled(null);
  }, [plugin?.id]);

  if (!plugin) return null;

  const installed = localInstalled ?? plugin.installed;

  const handleToggle = async () => {
    if (!onToggleInstall) return;
    setPending(true);
    try {
      await onToggleInstall(plugin.id, !installed);
      setLocalInstalled(!installed);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[80vh] w-full max-w-md flex-col rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#F4F4F5] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#F4F4F5]">
              <img src={plugin.iconUrl} alt="" className="h-12 w-12 object-contain" />
            </div>
            <h2 className="text-base font-semibold text-[#1C293B]">{plugin.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#828EA1] hover:text-[#1C293B]"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <p className="text-xs font-semibold uppercase text-[#75869C]">Category</p>
          <p className="mt-1 text-sm text-[#1C293B]">{plugin.category}</p>

          {plugin.badge ? (
            <>
              <p className="mt-4 text-xs font-semibold uppercase text-[#75869C]">Plan</p>
              <p className="mt-1 text-sm text-[#1C293B]">{plugin.badge}</p>
            </>
          ) : null}

          <p className="mt-4 text-xs font-semibold uppercase text-[#75869C]">Description</p>
          <p className="mt-1 text-sm leading-6 text-[#495462]">{plugin.description}</p>

          <p className="mt-4 text-xs font-semibold uppercase text-[#75869C]">Status</p>
          <p className="mt-1 text-sm text-[#1C293B]">
            {installed ? "Installed" : "Not installed"}
          </p>

          {onToggleInstall ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => void handleToggle()}
              className={cn(
                "mt-6 h-[37px] w-full rounded text-sm font-semibold disabled:opacity-60",
                installed
                  ? "border border-[#40B630] bg-[#F2F8F2] text-[#40B630]"
                  : "bg-[#1972F5] text-white",
              )}
            >
              {pending ? "Updating…" : installed ? "Uninstall" : "Install"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
