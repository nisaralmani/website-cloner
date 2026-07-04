import { PLATFORM_FEATURES } from "@/lib/marketing-data";
import MarketingVideoPreview from "@/components/marketing/MarketingVideoPreview";

export default function MarketingPlatformSection() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-[1200px] rounded-[32px] bg-[linear-gradient(180deg,rgba(255,225,68,0.12),rgba(255,145,0,0.12))] px-6 py-14 sm:px-10 sm:py-16">
        <div className="mx-auto max-w-[760px] text-center">
          <h2 className="text-[32px] font-normal leading-tight text-[#19253B] sm:text-[40px]">
            One platform to delight your teams and customers
          </h2>
          <p className="mt-4 text-lg text-[#5F6D7F]">
            Automate 50% of your inquiries with AI, let your teams focus on what matters.
          </p>
        </div>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORM_FEATURES.map((feature) => (
            <li
              key={feature.title}
              className="rounded-2xl bg-white/90 p-6 shadow-[0_8px_30px_rgba(25,37,59,0.06)]"
            >
              <h3 className="text-lg font-semibold text-[#19253B]">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#5F6D7F]">{feature.description}</p>
            </li>
          ))}
        </ul>

        <div className="mt-12">
          <MarketingVideoPreview
            poster="/images/marketing/platform/ai-preview.webp"
            alt="Bybelt AI platform preview"
          />
        </div>
      </div>
    </section>
  );
}
