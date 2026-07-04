"use client";

import { ChevronsUpDown, List, Pencil, Trash2 } from "lucide-react";
import type { WorkspaceOperator } from "@/types/workspace-operators";

type WorkspaceOperatorsPanelProps = {
  addButton: string;
  sortButton: string;
  clearButton: string;
  operators: WorkspaceOperator[];
  saving: boolean;
  onInvite: (email: string) => Promise<boolean>;
  onRemove: (userId: string) => Promise<boolean>;
  onUpdateRole?: (userId: string, role: string) => Promise<boolean>;
};

export function WorkspaceOperatorsPanel({
  addButton,
  sortButton,
  clearButton,
  operators,
  saving,
  onInvite,
  onRemove,
  onUpdateRole,
}: WorkspaceOperatorsPanelProps) {
  const handleInvite = () => {
    const email = window.prompt("Enter the operator email address:");
    if (!email) {
      return;
    }
    void onInvite(email);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <button
          type="button"
          disabled={saving}
          onClick={handleInvite}
          className="inline-flex h-[42px] items-center rounded border border-black/10 bg-[#1972F5] px-4 text-xs font-bold text-white disabled:opacity-50"
        >
          {addButton}
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-[30px] items-center gap-1.5 rounded border border-black/10 bg-[#1c293b] px-3 text-xs font-bold text-white"
          >
            {sortButton}
            <ChevronsUpDown size={14} strokeWidth={2} />
          </button>
          <button
            type="button"
            className="inline-flex h-[30px] items-center gap-1.5 rounded border border-black/10 bg-[#1c293b] px-3 text-xs font-bold text-white"
          >
            <List size={14} strokeWidth={2} />
            {clearButton}
          </button>
        </div>
      </div>
      <div className="overflow-hidden rounded border border-[#E8EAEB]">
        {operators.map((operator) => (
          <div
            key={operator.userId}
            className="flex h-[50px] items-center gap-3 px-4 text-sm font-semibold text-[#2c405a]"
          >
            <div className="relative shrink-0">
              <img
                src={operator.avatarUrl}
                alt=""
                className="h-[30px] w-[30px] rounded-full object-cover"
              />
              {operator.online && (
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#40B630]" />
              )}
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-1">
              <span className="truncate text-[#1c293b]">{operator.name}</span>
              {operator.self && <span className="shrink-0 text-[#8d949d]"> (you)</span>}
            </div>
            <span className="min-w-0 flex-1 truncate font-normal text-[#8d949d]">
              {operator.email}
            </span>
            <span className="inline-flex shrink-0 rounded-full bg-[#F1F0F9] px-2 py-1 text-[11.5px] font-bold text-[#584CBD]">
              {operator.role}
            </span>
            <button
              type="button"
              aria-label="Edit operator"
              disabled={saving || operator.role === "Owner" || !onUpdateRole}
              onClick={() => {
                if (!onUpdateRole) return;
                const nextRole = operator.role === "Member" ? "owner" : "member";
                void onUpdateRole(operator.userId, nextRole);
              }}
              className="inline-flex h-[30px] w-[42px] shrink-0 items-center justify-center rounded border border-[#E8EAEB] bg-white text-[#333e4f] disabled:opacity-40"
            >
              <Pencil size={14} strokeWidth={2} />
            </button>
            <button
              type="button"
              aria-label="Remove operator"
              disabled={saving || operator.role === "Owner"}
              onClick={() => void onRemove(operator.userId)}
              className="inline-flex h-[30px] w-[42px] shrink-0 items-center justify-center rounded border border-[#E8EAEB] bg-white text-[#333e4f] disabled:opacity-40"
            >
              <Trash2 size={14} strokeWidth={2} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
