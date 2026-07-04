"use client";

import { useState, type KeyboardEvent } from "react";
import { useSearchParams } from "next/navigation";
import { LayoutGrid, Search } from "lucide-react";
import { DOCS_PLUGINS_URL } from "@/lib/docs-links";
import { PluginDetailModal } from "@/components/plugins/PluginDetailModal";
import { cn } from "@/lib/utils";
import { usePlugins } from "@/hooks/usePlugins";
import {
  pluginCategoryFromParams,
  pluginFilterFromParams,
} from "@/lib/plugins-routes";
import type { Plugin, PluginBadge } from "@/types/plugins";

const BADGE_STYLES: Record<PluginBadge, string> = {
  Essentials: "bg-[#1C293B] text-white",
  Mini: "bg-[#40B630] text-white",
  Plus: "bg-[#7C3AED] text-white",
  Free: "bg-[#1972F5] text-white",
};

function PluginBadgeTag({ plugin }: { plugin: Plugin }) {
  if (plugin.price) {
    const match = plugin.price.match(/^\$(\d+)(\/mth)$/);
    if (match) {
      return (
        <div className="text-sm font-semibold text-[#1C293B]">
          <span className="font-semibold">$</span>
          <span className="text-base font-bold">{match[1]}</span>
          <span className="font-normal text-[#75869C]">/mth</span>
        </div>
      );
    }
  }

  if (!plugin.badge) return null;

  return (
    <span
      className={cn(
        "rounded px-2 py-0.5 text-[11px] font-semibold",
        BADGE_STYLES[plugin.badge],
      )}
    >
      {plugin.badge}
    </span>
  );
}

function PluginCard({
  plugin,
  onToggle,
  onViewDetails,
}: {
  plugin: Plugin;
  onToggle: (installed: boolean) => Promise<void>;
  onViewDetails: (plugin: Plugin) => void;
}) {
  const [pending, setPending] = useState(false);

  const handleToggle = async () => {
    setPending(true);
    try {
      await onToggle(!plugin.installed);
    } finally {
      setPending(false);
    }
  };

  return (
    <article className="flex w-[280px] flex-col rounded-lg border border-[#E8EAEB] bg-white p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#F4F4F5] bg-white">
          <img
            src={plugin.iconUrl}
            alt=""
            className="h-16 w-16 object-contain"
            loading="lazy"
          />
        </div>
        <PluginBadgeTag plugin={plugin} />
      </div>

      <h3 className="text-sm font-bold text-[#1C293B]">{plugin.name}</h3>
      {plugin.separateCheckout && (
        <p className="mt-0.5 text-xs font-semibold text-[#75869C]">
          Separate checkout
        </p>
      )}
      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-5 text-[#495462]">
        {plugin.description}
      </p>

      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => onViewDetails(plugin)}
          className="h-[37px] w-full rounded border border-[#1972F5] bg-white text-sm font-semibold text-[#1972F5]"
        >
          View Details
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => void handleToggle()}
          className={cn(
            "h-[37px] w-full rounded text-sm font-semibold",
            plugin.installed
              ? "border border-[#40B630] bg-[#F2F8F2] text-[#40B630]"
              : "bg-[#1972F5] text-white",
            pending && "opacity-60",
          )}
        >
          {plugin.installed ? "Installed" : "Install"}
        </button>
      </div>
    </article>
  );
}

export default function PluginsPanel() {
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailPlugin, setDetailPlugin] = useState<Plugin | null>(null);
  const filter = pluginFilterFromParams(
    searchParams.get("filter"),
    searchParams.get("installed"),
  );
  const category = pluginCategoryFromParams(searchParams.get("category"));
  const { plugins, loading, error, toggleInstall } = usePlugins(filter, category, searchQuery);

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      setSearchQuery(searchInput);
    }
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
      <header className="flex h-[70px] shrink-0 items-center justify-between border-b border-[#F4F4F5] px-8 py-4">
        <div className="flex items-center gap-2">
          <LayoutGrid size={20} className="text-[#2C405A]" strokeWidth={1.75} />
          <h1 className="text-base font-semibold text-[#2C405A]">Plugins</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              window.open(DOCS_PLUGINS_URL, "_blank", "noopener,noreferrer")
            }
            className="inline-flex h-9 items-center rounded bg-[#1972F5] px-4 text-sm font-semibold text-white"
          >
            Documentation
          </button>
          <div className="flex h-9 w-[250px] items-center gap-2 rounded border border-[#E8EAEB] bg-[#F8F9F9] px-2">
          <Search size={18} className="shrink-0 text-[#828EA1]" />
          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search plugins"
            className="w-full bg-transparent text-sm text-[#1C293B] outline-none placeholder:text-[#828EA1]"
          />
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto bg-[#FBFBFB] p-6">
        {loading ? (
          <p className="text-sm text-[#828EA1]">Loading plugins…</p>
        ) : error ? (
          <p className="text-sm text-[#828EA1]">{error}</p>
        ) : plugins.length === 0 ? (
          <p className="text-sm text-[#828EA1]">No plugins found.</p>
        ) : (
          <div className="flex flex-wrap gap-5">
            {plugins.map((plugin) => (
              <PluginCard
                key={plugin.id}
                plugin={plugin}
                onToggle={(installed) => toggleInstall(plugin.id, installed)}
                onViewDetails={setDetailPlugin}
              />
            ))}
          </div>
        )}
      </div>

      <PluginDetailModal
        plugin={detailPlugin}
        onClose={() => setDetailPlugin(null)}
        onToggleInstall={async (pluginId, installed) => {
          await toggleInstall(pluginId, installed);
        }}
      />
    </div>
  );
}
