import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { BybeltLogo } from "@/components/icons";
import { PUBLIC_STATUS_URL } from "@/lib/docs-links";
import { FOOTER_COLUMNS, SOCIAL_LINKS } from "@/lib/marketing-data";
import { marketingFeaturePath } from "@/lib/marketing-paths";

export default function MarketingFooter() {
  return (
    <footer className="border-t border-[#E2E8F0] bg-[#060d1a] text-white">
      <div className="mx-auto max-w-[1280px] px-6 pt-16 pb-10">
        <div className="mb-12 grid gap-10 lg:grid-cols-[1.2fr_repeat(4,1fr)]">
          <div>
            <div className="mb-5 scale-[0.85] origin-left [&_span]:!text-white">
              <BybeltLogo markSize={36} />
            </div>
            <p className="text-lg font-medium text-white/90">The AI customer support platform.</p>
            <p className="mt-1 text-lg text-white/50">Built for every company.</p>

            <p className="mt-8 text-sm font-semibold text-white/70">Socials</p>
            <ul className="mt-3 flex flex-wrap gap-4">
              {SOCIAL_LINKS.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm capitalize text-white/50 transition-colors hover:text-[#60A5FA]"
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>

            <Link
              href={marketingFeaturePath("/apps")}
              className="mt-6 inline-block text-sm text-[#60A5FA] hover:underline"
            >
              Download Bybelt apps →
            </Link>

            <button
              type="button"
              className="mt-4 flex items-center gap-2 text-sm font-medium text-white/70"
            >
              English (United States)
              <ChevronDown size={14} className="text-white/40" aria-hidden />
            </button>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="mb-4 text-sm font-semibold text-white/90">{column.title}</h3>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-white/50 transition-colors hover:text-[#60A5FA]"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-white/50 transition-colors hover:text-[#60A5FA]"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-sm text-white/40 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Bybelt</p>
          <a href={PUBLIC_STATUS_URL} className="transition-colors hover:text-[#60A5FA]">
            System status
          </a>
        </div>
      </div>
    </footer>
  );
}
