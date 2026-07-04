import { Check } from "lucide-react";
import MarketingShell from "@/components/marketing/MarketingShell";
import MarketingHomeCta from "@/components/marketing/MarketingHomeCta";
import { MarketingSection } from "@/components/marketing/marketing-ui";
import { SIGNUP_BENEFITS } from "@/lib/marketing-apps-data";
import { MARKETING_PAGE_BY_SLUG } from "@/lib/marketing-pages";
import { appLoginUrl } from "@/lib/marketing-paths";

const page = MARKETING_PAGE_BY_SLUG.signup;

export default function MarketingSignupPage() {
  return (
    <MarketingShell>
      <MarketingSection variant="muted" className="!py-16 md:!py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-[#1972F5]">Sign up</p>
            <h1 className="mt-3 text-[2.25rem] font-medium leading-tight tracking-[-0.03em] text-[#0f172a] md:text-[2.75rem]">
              {page.h1}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-[#64748b]">{page.subtitle}</p>
            <ul className="mt-8 space-y-3">
              {SIGNUP_BENEFITS.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 text-[15px] text-[#334155]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1972F5]" aria-hidden />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-[0_8px_40px_rgba(15,23,42,0.08)]">
            <h2 className="text-xl font-semibold text-[#0f172a]">Create your workspace</h2>
            <p className="mt-2 text-sm text-[#64748b]">Start your free trial — no credit card required.</p>
            <form className="mt-6 space-y-4" action={appLoginUrl()} method="get">
              <label className="block">
                <span className="text-sm font-medium text-[#334155]">Work email</span>
                <input
                  type="email"
                  name="email"
                  placeholder="you@company.com"
                  className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[#1972F5] focus:ring-2 focus:ring-[#1972F5]/20"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[#334155]">Company name</span>
                <input
                  type="text"
                  name="company"
                  placeholder="Acme Inc."
                  className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] px-4 py-2.5 text-sm outline-none transition-colors focus:border-[#1972F5] focus:ring-2 focus:ring-[#1972F5]/20"
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-full bg-[#1972F5] px-4 py-3 text-[15px] font-medium text-white transition-colors hover:bg-[#1565DB]"
              >
                Create my account
              </button>
            </form>
            <p className="mt-4 text-center text-sm text-[#94A3B8]">
              Already have an account?{" "}
              <a href={appLoginUrl()} className="font-semibold text-[#1972F5] hover:underline">
                Log in
              </a>
            </p>
          </div>
        </div>
      </MarketingSection>
      <MarketingHomeCta />
    </MarketingShell>
  );
}
