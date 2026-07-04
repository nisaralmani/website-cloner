import Link from "next/link";
import { CheckCircle2, ExternalLink } from "lucide-react";
import MarketingShell from "@/components/marketing/MarketingShell";
import { MarketingSection } from "@/components/marketing/marketing-ui";
import { APP_HOST, DOCS_HOST, HELP_HOST, MARKETING_HOSTS } from "@/lib/domains";
import { PUBLIC_DOCS_URL, PUBLIC_HELP_CENTER_URL } from "@/lib/docs-links";
import { appHomeUrl, marketingHomeUrl } from "@/lib/marketing-paths";
import { marketingPageMetadata } from "@/lib/seo-metadata";

export const metadata = marketingPageMetadata(
  "System Status | Bybelt",
  "Current operational status for Bybelt services.",
);

const SERVICES = [
  { name: `App (${APP_HOST})`, status: "Operational" },
  { name: `Marketing site (${MARKETING_HOSTS[0]})`, status: "Operational" },
  { name: `Help Center (${HELP_HOST})`, status: "Operational" },
  { name: `Developer docs (${DOCS_HOST})`, status: "Operational" },
  { name: "Live chat widget", status: "Operational" },
  { name: "Email delivery", status: "Operational" },
] as const;

export default function SystemStatusPage() {
  return (
    <MarketingShell>
      <section className="relative overflow-hidden bg-[#060d1a] px-6 pb-12 pt-20 text-white">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(34,197,94,0.2),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-[#4ADE80]" aria-hidden />
          <h1 className="mt-4 text-[2.5rem] font-medium tracking-[-0.03em]">
            All systems operational
          </h1>
          <p className="mt-4 text-lg text-white/60">
            Bybelt services are running normally. Subscribe to updates from your workspace settings.
          </p>
        </div>
      </section>

      <MarketingSection variant="white">
        <div className="mx-auto max-w-2xl">
          <ul className="divide-y divide-[#E2E8F0] rounded-2xl border border-[#E2E8F0] bg-white">
            {SERVICES.map((service) => (
              <li
                key={service.name}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <span className="text-[15px] font-medium text-[#0f172a]">{service.name}</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF5] px-3 py-1 text-xs font-semibold text-[#15803D]">
                  <span className="h-2 w-2 rounded-full bg-[#22C55E]" aria-hidden />
                  {service.status}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-4 text-sm font-semibold">
            <Link href={appHomeUrl()} className="inline-flex items-center gap-1 text-[#1972F5] hover:underline">
              Open app
              <ExternalLink size={14} aria-hidden />
            </Link>
            <Link href={PUBLIC_HELP_CENTER_URL} className="text-[#1972F5] hover:underline">
              Help Center
            </Link>
            <Link href={PUBLIC_DOCS_URL} className="text-[#1972F5] hover:underline">
              Developer docs
            </Link>
            <Link href={marketingHomeUrl()} className="text-[#1972F5] hover:underline">
              bybelt.com
            </Link>
          </div>
        </div>
      </MarketingSection>
    </MarketingShell>
  );
}
