import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { marketingFeaturePath } from "@/lib/marketing-paths";

export default function MarketingTopBanner() {
  return (
    <div className="bg-[#1972F5] text-white">
      <Link
        href={marketingFeaturePath("/ai-agent")}
        className="mx-auto flex max-w-[1280px] items-center justify-center gap-2 px-4 py-2.5 text-sm transition-opacity hover:opacity-90"
      >
        <span className="rounded bg-white/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide">
          New
        </span>
        <span className="font-medium">Bybelt AI Agent — automate up to 70% of support tickets</span>
        <ArrowRight className="hidden h-3.5 w-3.5 sm:block" aria-hidden />
      </Link>
    </div>
  );
}
