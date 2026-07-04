"use client";

import Link from "next/link";
import { CreditCard } from "lucide-react";
import type { PaymentMethod } from "@/types/billing";

type WorkspaceBillingPanelProps = {
  addButton: string;
  actionsTitle: string;
  actionsLink: string;
  actionsHref: string;
  cards: PaymentMethod[];
  selectedCard: PaymentMethod | null;
  saving: boolean;
  onAdd: () => Promise<boolean>;
  onSelect: (paymentMethodId: string | null) => Promise<boolean>;
};

function brandLabel(brand: string) {
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}

export function WorkspaceBillingPanel({
  addButton,
  actionsTitle,
  actionsLink,
  actionsHref,
  cards,
  selectedCard,
  saving,
  onAdd,
  onSelect,
}: WorkspaceBillingPanelProps) {
  return (
    <div className="flex items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {selectedCard ? (
          <div className="flex min-h-[43px] max-w-[412px] items-center gap-3 rounded border border-[#E8EAEB] bg-white px-4 py-3">
            <CreditCard size={16} className="shrink-0 text-[#75869c]" strokeWidth={2} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[#1c293b]">{selectedCard.label}</p>
              <p className="text-xs text-[#8d949d]">
                {brandLabel(selectedCard.brand)} ·••• {selectedCard.last4}
              </p>
            </div>
            {cards.length > 1 && (
              <select
                disabled={saving}
                value={selectedCard.id}
                onChange={(event) => void onSelect(event.target.value || null)}
                className="h-9 rounded border border-[#E8EAEB] bg-[#F8F9F9] px-2 text-xs font-semibold text-[#1c293b]"
              >
                {cards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        ) : (
          <button
            type="button"
            disabled={saving}
            onClick={() => void onAdd()}
            className="inline-flex h-[43px] w-fit max-w-[412px] items-center gap-2 rounded border border-black/10 bg-[#1972F5] px-4 text-sm font-bold text-white disabled:opacity-50"
          >
            <CreditCard size={16} strokeWidth={2} />
            {addButton}
          </button>
        )}

        {!selectedCard && cards.length > 0 && (
          <select
            disabled={saving}
            defaultValue=""
            onChange={(event) => {
              if (event.target.value) {
                void onSelect(event.target.value);
              }
            }}
            className="h-10 max-w-[412px] rounded border border-[#E8EAEB] bg-[#F8F9F9] px-3 text-sm font-semibold text-[#1c293b]"
          >
            <option value="" disabled>
              Select a saved payment method
            </option>
            {cards.map((card) => (
              <option key={card.id} value={card.id}>
                {card.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="ml-10 pl-4">
        <p className="text-sm font-bold text-[#75869c]">{actionsTitle}</p>
        <Link href={actionsHref} className="mt-1 inline-block text-sm font-bold text-[#0093ee] hover:underline">
          {actionsLink}
        </Link>
      </div>
    </div>
  );
}
