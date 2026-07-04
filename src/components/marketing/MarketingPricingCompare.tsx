"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PRICING_COMPARE_CATEGORIES,
  PRICING_COMPARE_PLANS,
  type PricingCompareCell,
} from "@/lib/marketing-pricing-compare";
import { marketingSignupPath } from "@/lib/marketing-paths";

function CompareCell({ value }: { value: PricingCompareCell }) {
  if (value === true) {
    return (
      <Check
        className="mx-auto h-5 w-5 text-[#1972F5]"
        strokeWidth={2.5}
        aria-label="Included"
      />
    );
  }
  if (value === false) {
    return (
      <X
        className="mx-auto h-5 w-5 text-[#C5CAD3]"
        strokeWidth={2.5}
        aria-label="Not included"
      />
    );
  }
  return <span className="text-sm text-[#242F47]">{value}</span>;
}

export default function MarketingPricingCompare() {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    () => ({ [PRICING_COMPARE_CATEGORIES[0]?.name ?? ""]: true }),
  );

  function toggleCategory(name: string) {
    setOpenCategories((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  return (
    <section className="bg-white px-6 py-16">
      <div className="mx-auto max-w-[1200px]">
        <div className="text-center">
          <h2 className="text-[32px] font-bold text-[#19253B] md:text-[36px]">
            Compare our plans
          </h2>
          <p className="mx-auto mt-3 max-w-[660px] text-base leading-relaxed text-[#5F6D7F]">
            Choose the best plan for your business with our detailed feature
            comparison. See exactly what&apos;s included in each plan to make an
            informed decision.
          </p>
        </div>

        <div className="mt-10 hidden overflow-x-auto rounded-2xl border border-[#E8EAEB] bg-[#FCFCFD] md:block">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead className="sticky top-[126px] z-10 bg-[#FCFCFD]">
              <tr className="border-b border-[#E8EAEB]">
                <th className="w-[28%] px-4 py-4 text-sm font-semibold text-[#19253B]" />
                {PRICING_COMPARE_PLANS.map((plan) => (
                  <th
                    key={plan}
                    className="px-4 py-4 text-center text-sm font-semibold text-[#19253B]"
                  >
                    {plan}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PRICING_COMPARE_CATEGORIES.map((category) => {
                const isOpen = openCategories[category.name] ?? false;
                return (
                  <CategoryRows
                    key={category.name}
                    category={category}
                    isOpen={isOpen}
                    onToggle={() => toggleCategory(category.name)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-10 space-y-4 md:hidden">
          {PRICING_COMPARE_CATEGORIES.map((category) => {
            const isOpen = openCategories[category.name] ?? false;
            return (
              <div
                key={category.name}
                className="overflow-hidden rounded-xl border border-[#E8EAEB] bg-[#FCFCFD]"
              >
                <button
                  type="button"
                  onClick={() => toggleCategory(category.name)}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-[#19253B]"
                >
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform",
                      isOpen && "rotate-90",
                    )}
                  />
                  {category.name}
                </button>
                {isOpen ? (
                  <div className="divide-y divide-[#E8EAEB] border-t border-[#E8EAEB]">
                    {category.rows.map((row) => (
                      <div key={row.label} className="px-4 py-3">
                        <p className="text-sm font-medium text-[#19253B]">{row.label}</p>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {PRICING_COMPARE_PLANS.map((plan, index) => (
                            <div
                              key={plan}
                              className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs"
                            >
                              <span className="text-[#828EA1]">{plan}</span>
                              <CompareCell value={row.values[index]} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link
            href={marketingSignupPath()}
            className="inline-flex rounded-xl bg-[#1972F5] px-6 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-[#1565DB]"
          >
            Start my trial for free
          </Link>
          <p className="mt-2 text-xs text-[#828EA1]">
            14 days free trial — All Bybelt features — No card required
          </p>
        </div>
      </div>
    </section>
  );
}

function CategoryRows({
  category,
  isOpen,
  onToggle,
}: {
  category: (typeof PRICING_COMPARE_CATEGORIES)[number];
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr className="border-b border-[#E8EAEB] bg-white">
        <td colSpan={5} className="p-0">
          <button
            type="button"
            onClick={onToggle}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-[#19253B] hover:bg-[#F8F9FB]"
          >
            <ChevronRight
              className={cn(
                "h-4 w-4 shrink-0 transition-transform",
                isOpen && "rotate-90",
              )}
            />
            {category.name}
          </button>
        </td>
      </tr>
      {isOpen
        ? category.rows.map((row) => (
            <tr key={row.label} className="border-b border-[#E8EAEB] bg-white">
              <td className="px-4 py-3 text-sm text-[#242F47]">{row.label}</td>
              {row.values.map((value, index) => (
                <td key={`${row.label}-${index}`} className="px-4 py-3 text-center">
                  <CompareCell value={value} />
                </td>
              ))}
            </tr>
          ))
        : null}
    </>
  );
}
