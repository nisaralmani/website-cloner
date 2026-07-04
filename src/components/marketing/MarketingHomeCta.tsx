import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BybeltMark } from "@/components/icons";
import { marketingFeaturePath, marketingSignupPath } from "@/lib/marketing-paths";

export default function MarketingHomeCta() {
  return (
    <section className="px-6 pb-24 pt-4">
      <div className="relative mx-auto max-w-[1280px] overflow-hidden rounded-3xl bg-[#060d1a] px-8 py-16 text-center text-white sm:px-16 sm:py-20">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_50%_120%,rgba(25,114,245,0.4),transparent)]"
          aria-hidden
        />
        <div className="relative z-10">
          <div className="mx-auto mb-6 flex w-fit items-center gap-3">
            <BybeltMark size={36} />
            <span className="text-2xl font-bold tracking-tight">bybelt</span>
          </div>
          <h2 className="mx-auto max-w-2xl text-[2rem] font-medium leading-tight tracking-[-0.02em] sm:text-[2.75rem]">
            Ready to transform your customer support?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-white/60">
            Join thousands of teams using Bybelt to deliver faster, smarter, more personal support.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={marketingSignupPath()}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-8 text-base font-semibold text-[#060d1a] transition-colors hover:bg-white/90"
            >
              Get started free
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href={marketingFeaturePath("/pricing")}
              className="inline-flex h-12 items-center gap-2 rounded-full border border-white/20 px-8 text-base font-medium text-white transition-colors hover:bg-white/10"
            >
              View pricing
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
