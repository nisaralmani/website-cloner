import Link from "next/link";
import { Check } from "lucide-react";
import MarketingShell from "@/components/marketing/MarketingShell";
import MarketingHomeCta from "@/components/marketing/MarketingHomeCta";
import MarketingPricingExtras from "@/components/marketing/MarketingPricingExtras";
import MarketingPricingCompare from "@/components/marketing/MarketingPricingCompare";
import {
  MarketingPageHero,
  MarketingSection,
  MarketingSectionHeader,
} from "@/components/marketing/marketing-ui";
import { MARKETING_PAGE_BY_SLUG, PRICING_PLANS } from "@/lib/marketing-pages";
import { marketingSignupPath } from "@/lib/marketing-paths";

const page = MARKETING_PAGE_BY_SLUG.pricing;
const TRIAL_NOTE = "14-day free trial · No credit card · Cancel anytime";

export default function MarketingPricingPage() {
  return (
    <MarketingShell>
      <MarketingPageHero
        title={page.h1}
        subtitle={page.subtitle}
        centered
        primaryCta={{ label: "Start free trial", href: marketingSignupPath() }}
        secondaryCta={{ label: "Compare plans", href: "#plans" }}
        trialNote={TRIAL_NOTE}
      />

      <MarketingSection id="plans" variant="white" className="!pt-8">
        <div className="grid gap-5 lg:grid-cols-4">
          {PRICING_PLANS.map((plan) => {
            const isFeatured = plan.name === "Plus";
            return (
              <article
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
                  isFeatured
                    ? "border-[#1972F5] bg-[#060d1a] text-white shadow-[0_0_40px_rgba(25,114,245,0.15)] lg:-mt-4 lg:mb-4"
                    : "border-[#E2E8F0] bg-white shadow-sm hover:border-[#1972F5]/30"
                }`}
              >
                {plan.badge ? (
                  <span className="mb-3 inline-flex w-fit rounded-full bg-[#1972F5] px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                    {plan.badge}
                  </span>
                ) : null}
                <h2 className={`text-2xl font-semibold ${isFeatured ? "text-white" : "text-[#0f172a]"}`}>
                  {plan.name}
                </h2>
                <p
                  className={`mt-2 min-h-[72px] text-sm leading-relaxed ${
                    isFeatured ? "text-white/60" : "text-[#64748b]"
                  }`}
                >
                  {plan.description}
                </p>
                <div className={`mt-4 border-t pt-4 ${isFeatured ? "border-white/10" : "border-[#E2E8F0]"}`}>
                  {plan.priceNote ? (
                    <>
                      <p className={`text-4xl font-bold ${isFeatured ? "text-white" : "text-[#0f172a]"}`}>
                        ${plan.price}
                      </p>
                      <p className={`mt-1 text-sm ${isFeatured ? "text-white/50" : "text-[#94A3B8]"}`}>
                        {plan.priceNote}
                      </p>
                    </>
                  ) : (
                    <p className={`text-2xl font-bold ${isFeatured ? "text-white" : "text-[#0f172a]"}`}>
                      {plan.price}
                    </p>
                  )}
                </div>
                <Link
                  href={plan.ctaHref}
                  className={`mt-6 block rounded-full py-2.5 text-center text-[15px] font-medium transition-colors ${
                    isFeatured
                      ? "bg-white text-[#060d1a] hover:bg-white/90"
                      : "bg-[#1972F5] text-white hover:bg-[#1565DB]"
                  }`}
                >
                  {plan.cta}
                </Link>
                <p
                  className={`mt-6 text-xs font-bold uppercase tracking-wide ${
                    isFeatured ? "text-white/40" : "text-[#94A3B8]"
                  }`}
                >
                  Key features
                </p>
                <ul className="mt-3 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature.title} className="flex gap-2">
                      <Check
                        className={`mt-0.5 h-4 w-4 shrink-0 ${isFeatured ? "text-[#60A5FA]" : "text-[#1972F5]"}`}
                        aria-hidden
                      />
                      <div>
                        <p className={`text-sm font-medium ${isFeatured ? "text-white" : "text-[#334155]"}`}>
                          {feature.title}
                        </p>
                        {feature.detail ? (
                          <p className={`mt-0.5 text-xs ${isFeatured ? "text-white/50" : "text-[#94A3B8]"}`}>
                            {feature.detail}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>

        <div className="mx-auto mt-20 max-w-2xl text-center">
          <MarketingSectionHeader
            eyebrow="Flat pricing"
            title="One price per workspace, unlimited conversations"
            description="Pay a single flat rate regardless of how many conversations you handle. No per-seat surprises, no hidden overages."
            align="center"
          />
        </div>
      </MarketingSection>

      <MarketingPricingCompare />
      <MarketingPricingExtras />
      <MarketingHomeCta />
    </MarketingShell>
  );
}
