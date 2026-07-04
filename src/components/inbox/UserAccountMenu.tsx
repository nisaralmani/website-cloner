"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  LogOut,
  Shield,
  UserRound,
} from "lucide-react";
import { appSettingsPath } from "@/lib/marketing-paths";
import { cn } from "@/lib/utils";
import { PersonGlyph } from "@/components/icons";
import { useSession } from "@/components/providers/SessionProvider";
import type { CurrentUser, OperatorPresence } from "@/types/inbox";

const ACCOUNT_LINKS = [
  { label: "Account information", href: appSettingsPath("account/information"), Icon: UserRound },
  { label: "Notifications", href: appSettingsPath("account/notifications"), Icon: Bell },
  { label: "Availability", href: appSettingsPath("account/availability"), Icon: Clock },
  { label: "Security", href: appSettingsPath("account/security"), Icon: Shield },
] as const;

const PRESENCE_OPTIONS: { status: OperatorPresence; label: string; dotClass: string }[] = [
  { status: "online", label: "Online", dotClass: "bg-[#40B630]" },
  { status: "offline", label: "Offline", dotClass: "bg-[#828EA1]" },
];

function PresenceDot({ presence }: { presence: OperatorPresence }) {
  return (
    <span
      className={cn(
        "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white",
        presence === "online" ? "bg-[#40B630]" : "bg-[#828EA1]",
      )}
    />
  );
}

export function UserAccountMenu({ user }: { user: CurrentUser }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const { logout, updatePresence } = useSession();
  const presence = user.presence ?? "online";

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Account menu"
          className="absolute bottom-full left-0 right-0 z-20 mb-1 overflow-hidden rounded-lg border border-[#E6EAF0] bg-white py-1 shadow-[0_8px_24px_rgba(28,41,59,0.12)]"
        >
          <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wide text-[#828EA1]">
            Seen as
          </p>
          {PRESENCE_OPTIONS.map(({ status, label, dotClass }) => {
            const active = presence === status;
            return (
              <button
                key={status}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                className={cn(
                  "flex h-9 w-full items-center gap-2.5 px-3 text-sm font-semibold text-[#1C293B] hover:bg-[#F4F6FB]",
                  active && "bg-[#F4F6FB]",
                )}
                onClick={() => {
                  if (!active) void updatePresence(status);
                }}
              >
                <span className={cn("h-2 w-2 shrink-0 rounded-full", dotClass)} />
                <span className="flex-1 truncate text-left">{label}</span>
                {active && <Check size={14} className="shrink-0 text-[#0093EE]" strokeWidth={2.5} />}
              </button>
            );
          })}
          <div className="my-1 border-t border-[#E6EAF0]" />
          {ACCOUNT_LINKS.map(({ label, href, Icon }) => (
            <Link
              key={href}
              href={href}
              role="menuitem"
              className="flex h-9 items-center gap-2.5 px-3 text-sm font-semibold text-[#1C293B] hover:bg-[#F4F6FB]"
              onClick={() => setOpen(false)}
            >
              <Icon size={16} strokeWidth={1.75} className="shrink-0 text-[#828EA1]" />
              <span className="truncate">{label}</span>
            </Link>
          ))}
          <div className="my-1 border-t border-[#E6EAF0]" />
          <button
            type="button"
            role="menuitem"
            className="flex h-9 w-full items-center gap-2.5 px-3 text-sm font-semibold text-[#828EA1] hover:bg-[#F4F6FB] hover:text-[#1C293B]"
            onClick={() => void logout()}
          >
            <LogOut size={16} strokeWidth={1.75} className="shrink-0" />
            <span>Log out</span>
          </button>
        </div>
      )}

      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg py-2.5 text-left",
          open ? "bg-[#F4F6FB]" : "hover:bg-[#F4F6FB]",
        )}
        onClick={() => setOpen((value) => !value)}
      >
        <div className="relative shrink-0">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-white",
                user.avatarGradient,
              )}
            >
              <PersonGlyph size={18} />
            </div>
          )}
          <PresenceDot presence={presence} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold leading-tight text-[#1C293B]">{user.name}</p>
          <p className="truncate text-[11px] leading-tight text-[#828EA1]">{user.email}</p>
        </div>
        {open ? (
          <ChevronUp size={14} className="shrink-0 text-[#828EA1]" strokeWidth={2} />
        ) : (
          <ChevronDown size={14} className="shrink-0 text-[#828EA1]" strokeWidth={2} />
        )}
      </button>
    </div>
  );
}
