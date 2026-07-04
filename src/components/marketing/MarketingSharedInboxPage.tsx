"use client";

import Image from "next/image";
import MarketingShell from "@/components/marketing/MarketingShell";
import MarketingShowcaseTabs from "@/components/marketing/MarketingShowcaseTabs";
import MarketingTestimonials from "@/components/marketing/MarketingTestimonials";
import MarketingHomeCta from "@/components/marketing/MarketingHomeCta";
import {
  MarketingPageHero,
  MarketingPillRow,
  MarketingSection,
  MarketingSectionHeader,
} from "@/components/marketing/marketing-ui";
import {
  SHARED_INBOX_AI,
  SHARED_INBOX_CHANNELS,
  SHARED_INBOX_COLLABORATE,
  SHARED_INBOX_HERO,
  SHARED_INBOX_ROUTING,
  SHARED_INBOX_SHOWCASE,
} from "@/lib/marketing-shared-inbox-data";
import { marketingSignupPath } from "@/lib/marketing-paths";

export default function MarketingSharedInboxPage() {
  return (
    <MarketingShell>
      <MarketingPageHero
        eyebrow={SHARED_INBOX_HERO.eyebrow}
        title={SHARED_INBOX_HERO.h1}
        subtitle={SHARED_INBOX_HERO.subtitle}
        primaryCta={{ label: "Get started free", href: marketingSignupPath() }}
        secondaryCta={{ label: "Explore features", href: "#showcase" }}
        trialNote={SHARED_INBOX_HERO.trialNote}
        image={{
          src: "/images/marketing/shared-inbox/hero-screenshot.webp",
          alt: "Bybelt shared inbox interface",
        }}
      />

      <MarketingShowcaseTabs
        id="showcase"
        eyebrow="Omnichannel"
        title="Explore our omnichannel shared inbox"
        items={SHARED_INBOX_SHOWCASE}
      />

      <MarketingSection variant="white">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Image
            src="/images/marketing/shared-inbox/inbound-illustration.webp"
            alt="Omnichannel inbound messages"
            width={560}
            height={420}
            className="h-auto w-full rounded-2xl border border-[#E2E8F0]"
          />
          <div>
            <MarketingSectionHeader
              eyebrow="Channels"
              title="Unlock the power of conversational experiences"
              description="Bring email, chat, social, and messaging apps into one timeline so your team always has the full customer story."
            />
            <div className="mt-6">
              <MarketingPillRow items={SHARED_INBOX_CHANNELS} />
            </div>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="muted">
        <MarketingSectionHeader title="Built to adapt to your specific needs" />
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {SHARED_INBOX_COLLABORATE.map((item) => (
            <article
              key={item.title}
              className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white"
            >
              <Image src={item.image} alt={item.title} width={400} height={260} className="h-auto w-full" />
              <div className="p-6">
                <h3 className="text-lg font-semibold text-[#0f172a]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#64748b]">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </MarketingSection>

      <MarketingSection variant="white">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <MarketingSectionHeader title="Route conversations automatically" />
            <ul className="mt-6 space-y-3">
              {SHARED_INBOX_ROUTING.map((rule) => (
                <li key={rule} className="flex items-center gap-3 text-[15px] text-[#334155]">
                  <span className="h-2 w-2 rounded-full bg-[#1972F5]" aria-hidden />
                  {rule}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <MarketingSectionHeader title="AI copilot in every conversation" />
            <ul className="mt-6 space-y-3">
              {SHARED_INBOX_AI.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-[15px] text-[#334155]">
                  <span className="h-2 w-2 rounded-full bg-[#8B5CF6]" aria-hidden />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </MarketingSection>

      <MarketingTestimonials />
      <MarketingHomeCta />
    </MarketingShell>
  );
}
