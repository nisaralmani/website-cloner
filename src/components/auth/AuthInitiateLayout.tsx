import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { BybeltLogo } from "@/components/icons";

import { PUBLIC_HELP_CENTER_URL } from "@/lib/docs-links";
import { marketingHomeUrl } from "@/lib/marketing-paths";
import {
  AUTH_HELP_ARTICLE_TRIGGERS,
} from "@/lib/settings-help-urls";

const FEATURE = {
  title: "Get 2x More Sales Using Triggers",
  description:
    "Send automated messages that create a proactive customer service which converts visitors into opportunities.",
  learnMoreHref: AUTH_HELP_ARTICLE_TRIGGERS,
  image: "/images/login/triggers.png",
  imageClassName: "h-[400px] w-[310px]",
} as const;

type AuthInitiateLayoutProps = {
  children: ReactNode;
};

export default function AuthInitiateLayout({ children }: AuthInitiateLayoutProps) {
  return (
    <div className="flex min-h-screen bg-white text-[#2c405a]">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-20 items-center justify-between px-6">
          <a href={marketingHomeUrl()}>
            <BybeltLogo markSize={32} />
          </a>
          <div className="flex items-center gap-4 text-sm">
            <a
              href={PUBLIC_HELP_CENTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-[#3B86FB]"
            >
              Need help?
            </a>
            <span className="h-4 w-px bg-[#E8EAEB]" />
            <button
              type="button"
              className="flex items-center gap-1.5 text-sm font-semibold text-[#2c405a]"
            >
              <span aria-hidden>🇬🇧</span>
              English
              <ChevronDown size={14} className="text-[#828EA1]" />
            </button>
          </div>
        </header>

        <main className="flex flex-1 justify-center px-6 pb-16 pt-6">{children}</main>
      </div>

      <aside className="relative hidden w-[460px] shrink-0 bg-[#4091E7] lg:flex lg:flex-col">
        <div className="flex flex-1 flex-col px-10 pt-16 text-white">
          <h2 className="text-2xl font-bold leading-snug">{FEATURE.title}</h2>
          <p className="mt-3 max-w-[340px] text-base leading-6 text-white/90">
            {FEATURE.description}
          </p>
          <a
            href={FEATURE.learnMoreHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 inline-block text-sm font-bold text-white underline-offset-2 hover:underline"
          >
            Learn More
          </a>
        </div>
        <div
          className={`mx-auto mb-10 bg-contain bg-center bg-no-repeat ${FEATURE.imageClassName}`}
          style={{ backgroundImage: `url("${FEATURE.image}")` }}
          role="img"
          aria-label={FEATURE.title}
        />
      </aside>
    </div>
  );
}
