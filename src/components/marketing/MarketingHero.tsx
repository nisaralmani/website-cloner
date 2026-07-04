import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { BybeltMark } from "@/components/icons";
import MarketingPlayVideoButton from "@/components/marketing/MarketingPlayVideoButton";
import { HOME_HERO_STATS } from "@/lib/marketing-data";
import { appLoginUrl, marketingSignupPath } from "@/lib/marketing-paths";

export default function MarketingHero() {
  return (
    <section className="relative overflow-hidden bg-[#060d1a] text-white">
      {/* Ambient background */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(25,114,245,0.35),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-32 top-20 h-[480px] w-[480px] rounded-full bg-[#1972F5]/20 blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 bottom-0 h-[360px] w-[360px] rounded-full bg-[#8B5CF6]/15 blur-[90px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1280px] px-6 pb-20 pt-16 lg:pb-28 lg:pt-24">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-10">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-[#60A5FA]" aria-hidden />
              <span className="text-white/90">AI-powered customer support platform</span>
            </div>

            <h1 className="text-[2.5rem] font-medium leading-[1.12] tracking-[-0.03em] sm:text-[3.25rem] lg:text-[3.75rem]">
              Support every customer.
              <span className="block bg-gradient-to-r from-[#60A5FA] via-[#1972F5] to-[#818CF8] bg-clip-text text-transparent">
                Scale without limits.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/65">
              Bybelt unifies inbox, AI agents, live chat, and analytics in one workspace — so your
              team resolves faster and customers feel heard.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={marketingSignupPath()}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#1972F5] px-8 text-base font-medium text-white shadow-[0_0_40px_rgba(25,114,245,0.45)] transition-all hover:bg-[#1565DB] hover:shadow-[0_0_50px_rgba(25,114,245,0.55)]"
              >
                Start free trial
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <a
                href={appLoginUrl()}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-8 text-base font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/10"
              >
                Go to dashboard
              </a>
            </div>

            <p className="mt-4 text-sm text-white/45">
              14-day free trial · No credit card · All features included
            </p>

            <MarketingPlayVideoButton
              title="See Bybelt in action"
              subtitle="2 min overview"
              poster="/images/marketing/hero-screenshot.png"
              posterAlt="Bybelt product overview"
              className="mt-8"
              variant="dark"
              icon={<Play className="h-4 w-4 fill-white text-white" aria-hidden />}
            />
          </div>

          <div className="relative mx-auto w-full max-w-[640px] lg:mx-0 lg:max-w-none">
            <div
              className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-[#1972F5]/40 via-transparent to-[#8B5CF6]/30 blur-2xl"
              aria-hidden
            />
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0f1729]/80 p-2 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                <BybeltMark size={22} />
                <span className="text-sm font-semibold text-white/90">bybelt</span>
                <span className="ml-auto rounded-full bg-[#40B630]/20 px-2.5 py-0.5 text-[11px] font-medium text-[#86EFAC]">
                  Live
                </span>
              </div>
              <Image
                src="/images/marketing/hero-screenshot.png"
                alt="Bybelt shared inbox — conversations, AI replies, and team collaboration"
                width={1400}
                height={900}
                className="h-auto w-full rounded-xl"
                priority
              />
            </div>
          </div>
        </div>

        <dl className="mt-16 grid grid-cols-2 gap-6 border-t border-white/10 pt-10 sm:grid-cols-4">
          {HOME_HERO_STATS.map((stat) => (
            <div key={stat.label}>
              <dt className="text-2xl font-semibold tracking-tight sm:text-3xl">{stat.value}</dt>
              <dd className="mt-1 text-sm text-white/50">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
