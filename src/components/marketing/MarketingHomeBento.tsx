import Link from "next/link";
import {
  BarChart3,
  Bot,
  Inbox,
  MessageSquare,
  Megaphone,
  BookOpen,
  ArrowUpRight,
} from "lucide-react";
import { HOME_BENTO_FEATURES } from "@/lib/marketing-data";

const ICONS = {
  inbox: Inbox,
  bot: Bot,
  message: MessageSquare,
  chart: BarChart3,
  megaphone: Megaphone,
  book: BookOpen,
} as const;

export default function MarketingHomeBento() {
  return (
    <section className="bg-[#F8FAFC] px-6 py-24">
      <div className="mx-auto max-w-[1280px]">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#1972F5]">
            Platform
          </p>
          <h2 className="mt-3 text-[2rem] font-medium leading-tight tracking-[-0.02em] text-[#0f172a] sm:text-[2.5rem]">
            Everything your support team needs
          </h2>
          <p className="mt-4 text-lg text-[#64748b]">
            One workspace for conversations, automation, and insights — no duct-taping tools together.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HOME_BENTO_FEATURES.map((feature) => {
            const Icon = ICONS[feature.icon];

            return (
              <Link
                key={feature.title}
                href={feature.href}
                className="group relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition-all hover:border-[#1972F5]/30 hover:shadow-[0_8px_30px_rgba(25,114,245,0.08)]"
              >
                <div>
                  <div
                    className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${feature.iconBg}`}
                  >
                    <Icon className={`h-5 w-5 ${feature.iconColor}`} aria-hidden />
                  </div>
                  <h3 className="text-xl font-semibold text-[#0f172a]">{feature.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-[#64748b]">
                    {feature.description}
                  </p>
                </div>
                <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-[#1972F5] opacity-0 transition-opacity group-hover:opacity-100">
                  Learn more
                  <ArrowUpRight className="h-4 w-4" aria-hidden />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
