"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { DOCS_AI_AGENT_URL } from "@/lib/docs-links";
import { APP_INBOX_PATH, appSettingsPath, appWidgetPath } from "@/lib/marketing-paths";
import { useUpgradePlan } from "@/hooks/useUpgradePlan";

const STEPS = [
  {
    index: "01",
    title: "Feed Hugo your knowledge.",
    description: "Upload your docs, FAQs, whatever you've got.",
    image: "/images/agent/step_1.png",
    href: appSettingsPath("workspace/data"),
  },
  {
    index: "02",
    title: "Make it yours.",
    description: "Tweak how Hugo responds and set routing rules.",
    image: "/images/agent/step_2.png",
    href: appSettingsPath("chatbox/behavior"),
  },
  {
    index: "03",
    title: "Test it out.",
    description: "Use the real chat widget to test it before going live.",
    image: "/images/agent/step_3.png",
    href: appWidgetPath(),
  },
  {
    index: "04",
    title: "Let it run.",
    description: "Watch Hugo handle conversations.",
    image: "/images/agent/step_4.png",
    href: APP_INBOX_PATH,
  },
] as const;

function StepCard({
  index,
  title,
  description,
  image,
  href,
}: (typeof STEPS)[number]) {
  return (
    <Link href={href} className="group flex w-[402px] flex-col gap-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1C1C1C] font-mono text-sm text-white transition group-hover:bg-[#1972F5]">
        {index}
      </div>
      <div>
        <h3 className="text-lg leading-[26px] text-[#1C293B] group-hover:text-[#1972F5]">
          {title}
        </h3>
        <p className="mt-1 text-sm leading-5 text-[#777F89]">{description}</p>
      </div>
      <Image
        src={image}
        alt=""
        width={402}
        height={400}
        className="h-auto w-full"
      />
    </Link>
  );
}

export default function AgentWelcome() {
  const { openBilling, opening: upgrading } = useUpgradePlan();

  const handleUpgrade = async () => {
    await openBilling();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white text-[#2C405A]">
      <header
        className="bg-[radial-gradient(ellipse_at_center,_#FFFFFF_0%,_#EBF3FE_100%)] pt-8"
        style={{
          backgroundImage:
            "url(/images/agent/noise.png), radial-gradient(ellipse at center, #FFFFFF 0%, #EBF3FE 100%)",
        }}
      >
        <div className="mx-auto max-w-[1456px] px-[100px] pb-[165px]">
          <h1 className="max-w-[985px] text-[64px] font-normal leading-[76px] text-[#2C405A]">
            Meet Hugo, your brand&apos;s most efficient support teammate.
          </h1>
        </div>
      </header>

      <section className="mx-auto max-w-[1456px] px-[100px] pb-[100px]">
        <div className="grid grid-cols-[402px_402px] gap-x-6 gap-y-10">
          <div className="flex w-[402px] flex-col">
            <h2 className="text-[40px] font-normal leading-[52px] text-[#1C293B]">
              Four Steps.
            </h2>
            <p className="text-[40px] font-normal leading-[52px] text-black/48">
              From setup to conversations in minutes.
            </p>
            <button
              type="button"
              disabled={upgrading}
              onClick={() => void handleUpgrade()}
              className="mt-6 inline-flex h-[43px] w-fit items-center gap-2 rounded bg-[#1972F5] px-4 text-sm font-bold text-white disabled:opacity-60"
            >
              {upgrading ? "Upgrading…" : "Upgrade and setup your AI Agent"}
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
            <a
              href={DOCS_AI_AGENT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex h-9 items-center gap-2 text-sm font-semibold text-[#1972F5] hover:underline"
            >
              <BookOpen size={16} aria-hidden />
              AI Agent documentation
            </a>
          </div>

          {STEPS.map((step) => (
            <StepCard key={step.index} {...step} />
          ))}
        </div>
      </section>
    </div>
  );
}
