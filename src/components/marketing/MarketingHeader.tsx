"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { BybeltLogo } from "@/components/icons";
import { MarketingMegaMenu } from "@/components/marketing/MarketingMegaMenu";
import {
  FEATURES_DROPDOWN_LINKS,
  HELP_MEGA_MENU,
  MARKETING_NAV,
} from "@/lib/marketing-data";
import { appHomeUrl, appLoginUrl, marketingFeaturePath, marketingSignupPath } from "@/lib/marketing-paths";

type OpenDropdown = "Features" | "Help" | null;

export default function MarketingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null);

  const toggleDropdown = (label: OpenDropdown) => {
    setOpenDropdown((current) => (current === label ? null : label));
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#E2E8F0]/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between gap-4 px-6">
        <div className="flex min-w-0 flex-1 items-center gap-6 lg:gap-10">
          <Link href={marketingFeaturePath("/")} className="shrink-0 scale-[0.72] origin-left">
            <BybeltLogo markSize={40} />
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {MARKETING_NAV.map((item) =>
              "hasDropdown" in item ? (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(item.label as OpenDropdown)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    type="button"
                    onClick={() => toggleDropdown(item.label as OpenDropdown)}
                    className="flex items-center gap-1 text-[15px] font-medium text-[#334155] transition-colors hover:text-[#1972F5]"
                    aria-expanded={openDropdown === item.label}
                  >
                    {item.label}
                    <ChevronDown size={14} className="text-[#94A3B8]" />
                  </button>
                  {openDropdown === item.label && (
                    <div className="absolute left-0 top-full z-40 pt-2">
                      <MarketingMegaMenu kind={item.label as "Features" | "Help"} />
                    </div>
                  )}
                </div>
              ) : (
                <MarketingNavLink
                  key={item.label}
                  href={item.href}
                  className="text-[15px] font-medium text-[#334155] transition-colors hover:text-[#1972F5]"
                >
                  {item.label}
                </MarketingNavLink>
              ),
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href={appLoginUrl()}
            className="hidden text-[15px] font-medium text-[#334155] transition-colors hover:text-[#1972F5] md:inline"
          >
            Log in
          </a>
          <Link
            href={marketingSignupPath()}
            className="hidden rounded-full border border-[#E2E8F0] px-5 py-2 text-[15px] font-medium text-[#334155] transition-colors hover:border-[#1972F5] hover:text-[#1972F5] md:inline"
          >
            Start free trial
          </Link>
          <a
            href={appHomeUrl()}
            className="hidden rounded-full bg-[#1972F5] px-5 py-2 text-[15px] font-medium text-white transition-colors hover:bg-[#1565DB] sm:inline"
          >
            Dashboard
          </a>
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[#334155] hover:bg-[#F1F5F9] lg:hidden"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {openDropdown && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 hidden bg-black/10 lg:block"
          onClick={() => setOpenDropdown(null)}
        />
      )}

      {mobileOpen && (
        <div className="border-t border-[#E2E8F0] bg-white px-6 py-4 lg:hidden">
          <div className="space-y-1">
            {MARKETING_NAV.map((item) =>
              "hasDropdown" in item ? (
                <div key={item.label} className="py-1">
                  <p className="px-2 py-1 text-xs font-bold uppercase tracking-wide text-[#94A3B8]">
                    {item.label}
                  </p>
                  {(item.label === "Features"
                    ? FEATURES_DROPDOWN_LINKS
                    : HELP_MEGA_MENU
                  ).map((link) => (
                    <MarketingNavLink
                      key={link.label}
                      href={link.href}
                      className="block rounded-lg px-2 py-2 text-[15px] text-[#334155] hover:bg-[#F1F5F9]"
                    >
                      {link.label}
                    </MarketingNavLink>
                  ))}
                </div>
              ) : (
                <MarketingNavLink
                  key={item.label}
                  href={item.href}
                  className="block rounded-lg px-2 py-2 text-[15px] text-[#334155] hover:bg-[#F1F5F9]"
                >
                  {item.label}
                </MarketingNavLink>
              ),
            )}
          </div>
          <div className="mt-4 space-y-2 border-t border-[#E2E8F0] pt-4">
            <a
              href={appLoginUrl()}
              className="block rounded-lg px-2 py-2 text-[15px] text-[#334155] hover:bg-[#F1F5F9]"
            >
              Log in
            </a>
            <Link
              href={marketingSignupPath()}
              className="block rounded-lg px-2 py-2 text-[15px] text-[#334155] hover:bg-[#F1F5F9]"
            >
              Start free trial
            </Link>
            <a
              href={appHomeUrl()}
              className="block rounded-full bg-[#1972F5] px-4 py-2.5 text-center text-[15px] font-medium text-white"
            >
              Dashboard
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

function MarketingNavLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}
