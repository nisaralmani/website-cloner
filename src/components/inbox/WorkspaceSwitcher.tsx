"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/components/providers/SessionProvider";
import type { SessionWorkspace } from "@/types/session";

function WorkspaceAvatar({ workspace }: { workspace: SessionWorkspace }) {
  return (
    <div className="relative h-[42px] w-[42px] shrink-0 overflow-hidden rounded-full bg-[#F4F6FB]">
      {workspace.logoUrl ? (
        <img src={workspace.logoUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[#1C293B]">
          {workspace.initials}
        </div>
      )}
    </div>
  );
}

export function WorkspaceSwitcher({
  workspace,
  notificationCount,
}: {
  workspace: SessionWorkspace;
  notificationCount?: string;
}) {
  const { workspaces, switchWorkspace, createWorkspace } = useSession();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setCreating(false);
        setError(null);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setCreating(false);
        setError(null);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    const ok = await createWorkspace(name, domain);
    if (!ok) {
      setError("Unable to create workspace. Check the name and domain.");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setOpen(false);
    setCreating(false);
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Switch workspace"
          className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-[#E6EAF0] bg-white py-1 shadow-[0_8px_24px_rgba(28,41,59,0.12)]"
        >
          <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wide text-[#828EA1]">
            Workspaces
          </p>
          {workspaces.map((item) => {
            const active = item.id === workspace.id;
            return (
              <button
                key={item.id}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-[#F4F6FB]",
                  active && "bg-[#F4F6FB]",
                )}
                onClick={() => {
                  if (!active) void switchWorkspace(item.id);
                  setOpen(false);
                }}
              >
                <WorkspaceAvatar workspace={item} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-[#1C293B]">{item.name}</p>
                  <p className="truncate text-[11px] text-[#828EA1]">{item.domain}</p>
                </div>
                {active && (
                  <Check size={14} className="shrink-0 text-[#0093EE]" strokeWidth={2.5} />
                )}
              </button>
            );
          })}
          <div className="my-1 border-t border-[#E6EAF0]" />
          {creating ? (
            <form className="space-y-2 px-3 py-2" onSubmit={handleCreate}>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Workspace name"
                className="h-9 w-full rounded border border-[#E6EAF0] px-2.5 text-sm text-[#1C293B] outline-none focus:border-[#0093EE]"
                autoFocus
              />
              <input
                value={domain}
                onChange={(event) => setDomain(event.target.value)}
                placeholder="website.com"
                className="h-9 w-full rounded border border-[#E6EAF0] px-2.5 text-sm text-[#1C293B] outline-none focus:border-[#0093EE]"
              />
              {error && <p className="text-[11px] font-medium text-[#E11900]">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting || !name.trim() || !domain.trim()}
                  className="h-8 flex-1 rounded bg-[#1972F5] text-xs font-bold text-white disabled:opacity-40"
                >
                  Create
                </button>
                <button
                  type="button"
                  className="h-8 rounded px-2 text-xs font-semibold text-[#828EA1] hover:text-[#1C293B]"
                  onClick={() => {
                    setCreating(false);
                    setError(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              role="menuitem"
              className="flex h-9 w-full items-center gap-2.5 px-3 text-sm font-semibold text-[#0093EE] hover:bg-[#F4F6FB]"
              onClick={() => {
                setCreating(true);
                setName("");
                setDomain("");
                setError(null);
              }}
            >
              <Plus size={16} strokeWidth={2} />
              <span>Create workspace</span>
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        className={cn(
          "flex h-[60px] w-full items-center gap-2.5 rounded-lg pt-1 text-left",
          open ? "bg-[#F4F6FB]" : "hover:bg-[#F4F6FB]",
        )}
        onClick={() => setOpen((value) => !value)}
      >
        <div className="relative shrink-0">
          <WorkspaceAvatar workspace={workspace} />
          <span className="absolute -left-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#40B630]" />
          {notificationCount && (
            <span className="absolute -bottom-1.5 -right-1 rounded bg-[#E11900] px-1 py-px text-[10px] font-bold leading-none text-white">
              {notificationCount}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold leading-tight text-[#1C293B]">{workspace.name}</p>
          <p className="truncate text-[12px] leading-tight text-[#828EA1]">{workspace.domain}</p>
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
