import { PUBLIC_CONTACT_URL } from "@/lib/docs-links";
import MarketingTestimonials from "@/components/marketing/MarketingTestimonials";
import { MarketingSection, MarketingSectionHeader } from "@/components/marketing/marketing-ui";
import { PRICING_ENTERPRISE, PRICING_FAQ } from "@/lib/marketing-pages";

export default function MarketingPricingExtras() {
  return (
    <>
      <MarketingSection variant="white">
        <MarketingSectionHeader
          eyebrow="Enterprise"
          title={PRICING_ENTERPRISE.subtitle}
          align="center"
        />
        <article className="mx-auto mt-12 max-w-lg rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-8 text-center">
          <h3 className="text-2xl font-semibold text-[#0f172a]">{PRICING_ENTERPRISE.title}</h3>
          <p className="mt-3 text-base leading-relaxed text-[#64748b]">{PRICING_ENTERPRISE.description}</p>
          <ul className="mt-6 space-y-2 text-left text-sm text-[#334155]">
            {PRICING_ENTERPRISE.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#1972F5]" aria-hidden />
                {feature}
              </li>
            ))}
          </ul>
          <a
            href={PRICING_ENTERPRISE.ctaHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex h-12 items-center rounded-full bg-[#0f172a] px-8 text-[15px] font-medium text-white transition-colors hover:bg-[#1e293b]"
          >
            {PRICING_ENTERPRISE.cta}
          </a>
        </article>
      </MarketingSection>

      <MarketingSection variant="muted">
        <MarketingSectionHeader
          eyebrow="FAQ"
          title="Frequently asked questions"
          description={
            <>
              Haven&apos;t found what you&apos;re looking for?{" "}
              <a href={PUBLIC_CONTACT_URL} className="font-semibold text-[#1972F5] hover:underline">
                Contact us
              </a>
            </>
          }
          align="center"
        />
        <dl className="mx-auto mt-12 max-w-2xl space-y-3">
          {PRICING_FAQ.map((item) => (
            <div key={item.question} className="rounded-xl border border-[#E2E8F0] bg-white p-5">
              <dt className="text-base font-semibold text-[#0f172a]">{item.question}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-[#64748b]">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </MarketingSection>

      <MarketingTestimonials />
    </>
  );
}
