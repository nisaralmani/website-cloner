"use client";

import { CreditCard, Trash2 } from "lucide-react";
import type { PaymentMethod } from "@/types/billing";

type BillingCardsPanelProps = {
  cards: PaymentMethod[];
  saving: boolean;
  onAdd: () => Promise<boolean>;
  onRemove: (id: string) => Promise<boolean>;
};

function brandLabel(brand: string) {
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}

export function BillingCardsPanel({ cards, saving, onAdd, onRemove }: BillingCardsPanelProps) {
  return (
    <div className="flex flex-col gap-6">
      {cards.length > 0 && (
        <div className="flex flex-col gap-3">
          {cards.map((card) => (
            <div
              key={card.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-[#E8EAEB] bg-white px-4 py-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <CreditCard size={20} className="shrink-0 text-[#75869c]" strokeWidth={1.75} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#1c293b]">{card.label}</p>
                  <p className="text-xs text-[#8d949d]">
                    {brandLabel(card.brand)} ·••• {card.last4}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => void onRemove(card.id)}
                className="inline-flex h-9 items-center gap-1.5 rounded border border-[#E8EAEB] px-3 text-xs font-bold text-[#75869c] hover:bg-[#F5F7F9] disabled:opacity-50"
              >
                <Trash2 size={14} strokeWidth={2} />
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        disabled={saving}
        onClick={() => void onAdd()}
        className="inline-flex h-[43px] w-fit items-center gap-2 rounded border border-black/10 bg-[#1972F5] px-4 text-sm font-bold text-white disabled:opacity-50"
      >
        <CreditCard size={16} className="shrink-0" strokeWidth={2} />
        Add new payment method
      </button>
    </div>
  );
}
