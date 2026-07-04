"use client";

import { useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { Globe, Minus, Plus, BookOpen } from "lucide-react";
import { DOCS_VISITORS_URL } from "@/lib/docs-links";
import { cn } from "@/lib/utils";
import { useVisitors } from "@/hooks/useVisitors";
import type { Visitor } from "@/types/visitors";
import { VisitorDetailPanel } from "@/components/visitors/VisitorDetailPanel";
import { PersonGlyph } from "@/components/icons";

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded border border-[#FFA10A] bg-[#FFA10A] px-1.5 py-0.5 text-xs font-semibold text-white">
      <span className="h-2 w-2 rounded-full bg-white" />
      Live
    </span>
  );
}

function VisitorsStats({ online, active }: { online: number; active: number }) {
  return (
    <div className="absolute left-[54px] top-[30px] w-[241px] overflow-hidden rounded-[7px] border border-black/5 bg-[rgba(28,41,59,0.7)]">
      <div className="flex flex-col gap-1 px-[26px] py-[11px]">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white">{online}</span>
          <span className="text-sm text-white">online users</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-[#8DFF3E]">{active}</span>
          <span className="text-sm text-[#8DFF3E]">active users now</span>
        </div>
      </div>
      <div className="px-2 py-[9px] text-[13px] text-white/75">
        Live view from MagicMap
      </div>
    </div>
  );
}

function ZoomBox() {
  return (
    <div className="absolute bottom-16 right-4 w-[45px] overflow-hidden rounded bg-[rgba(168,198,223,0.6)]">
      <button
        type="button"
        className="flex h-8 w-full items-center justify-center border-b border-black/5 text-white"
        aria-label="Zoom in"
      >
        <Plus size={20} strokeWidth={2} />
      </button>
      <button
        type="button"
        className="flex h-8 w-full items-center justify-center text-white"
        aria-label="Zoom out"
      >
        <Minus size={20} strokeWidth={2} />
      </button>
    </div>
  );
}

function MapMarker({ visitor }: { visitor: Visitor }) {
  const left = `${((visitor.longitude + 180) / 360) * 100}%`;
  const top = `${((90 - visitor.latitude) / 180) * 100}%`;

  return (
    <span
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left, top }}
      title={`${visitor.name} — ${visitor.location}`}
    >
      <span
        className={cn(
          "block h-3 w-3 rounded-full border-2 border-white shadow",
          visitor.isActive ? "bg-[#8DFF3E]" : "bg-[#1972F5]",
        )}
      />
    </span>
  );
}

function MagicMap({
  visitors,
  stats,
}: {
  visitors: Visitor[];
  stats: { online: number; active: number };
}) {
  return (
    <div className="relative min-w-0 flex-1">
      <Image
        src="/images/visitors/magic-map.webp"
        alt=""
        fill
        className="object-cover object-center"
        priority
      />
      {visitors.map((visitor) => (
        <MapMarker key={visitor.id} visitor={visitor} />
      ))}
      <VisitorsStats online={stats.online} active={stats.active} />
      <ZoomBox />
      <p className="absolute bottom-2 left-2 text-[11px] text-[#777F89]">
        © OpenStreetMap
      </p>
    </div>
  );
}

function VisitorRow({
  visitor,
  selected,
  onSelect,
}: {
  visitor: Visitor;
  selected: boolean;
  onSelect: (visitor: Visitor) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(visitor)}
      className={cn(
        "flex w-full items-start gap-3 border-b border-[#F4F4F5] px-4 py-3 text-left hover:bg-[#F8F9FB]",
        selected && "bg-[#EBF3FE]",
      )}
    >
      <div className="relative shrink-0">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white",
            visitor.avatarGradient,
          )}
        >
          {visitor.initials ? visitor.initials : <PersonGlyph size={16} />}
        </div>
        {visitor.isActive && (
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#40B630]" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#1C293B]">{visitor.name}</p>
        <p className="truncate text-xs text-[#5D6B98]">{visitor.location}</p>
        <p className="truncate text-xs text-[#828EA1]">{visitor.currentPage}</p>
      </div>
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex h-[320px] w-[250px] flex-col items-center justify-center gap-3 rounded-lg bg-[#F4F4F5] px-6 text-center">
        <Globe size={22} className="text-[#1C293B]" strokeWidth={1.75} />
        <p className="text-base font-semibold text-[#1C293B]">There are no visitors.</p>
        <p className="text-sm leading-5 text-[#495462]">
          Nobody is currently browsing your website. Your visitors will appear here.
        </p>
      </div>
    </div>
  );
}

export default function VisitorsPanel() {
  const [filterInput, setFilterInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const { visitors, stats, loading, error } = useVisitors(searchQuery);

  const handleFilterKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      setSearchQuery(filterInput);
    }
  };

  const showEmpty = !loading && !error && visitors.length === 0;

  return (
    <div className="flex min-w-0 flex-1 overflow-hidden">
      <div className="flex w-[320px] shrink-0 flex-col border-r border-[#E3E8EF] bg-white">
        <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-[#E3E8EF] px-2 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold uppercase tracking-wide text-[#1C293B]">
              Visitors
            </span>
            <LiveBadge />
          </div>
          <a
            href={DOCS_VISITORS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded bg-[#1972F5] text-white"
            aria-label="Documentation"
          >
            <BookOpen size={16} />
          </a>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center text-sm text-[#828EA1]">
            Loading visitors…
          </div>
        ) : error ? (
          <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-[#828EA1]">
            {error}
          </div>
        ) : showEmpty ? (
          <EmptyState />
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            {visitors.length === 0 && searchQuery.trim() ? (
              <p className="px-4 py-8 text-center text-sm text-[#828EA1]">
                No visitors match your filter.
              </p>
            ) : (
              visitors.map((visitor) => (
                <VisitorRow
                  key={visitor.id}
                  visitor={visitor}
                  selected={selectedVisitor?.id === visitor.id}
                  onSelect={setSelectedVisitor}
                />
              ))
            )}
          </div>
        )}

        <div className="flex h-[55px] shrink-0 items-center border-t border-[#E3E8EF] px-3">
          <input
            type="text"
            value={filterInput}
            onChange={(event) => setFilterInput(event.target.value)}
            onKeyDown={handleFilterKeyDown}
            placeholder="Filter by name, city… (Enter)"
            className="w-full bg-transparent text-sm text-[#1C293B] outline-none placeholder:text-[#777F89]"
          />
        </div>
      </div>

      <div className="relative min-w-0 flex-1">
        <MagicMap
          visitors={loading || showEmpty ? [] : visitors}
          stats={loading || showEmpty ? { online: 0, active: 0 } : stats}
        />
        <VisitorDetailPanel
          visitor={selectedVisitor}
          onClose={() => setSelectedVisitor(null)}
        />
      </div>
    </div>
  );
}
