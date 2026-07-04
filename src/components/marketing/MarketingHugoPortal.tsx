import Image from "next/image";
import Link from "next/link";
import { marketingFeaturePath, marketingSignupPath } from "@/lib/marketing-paths";
export default function MarketingHugoPortal() {
  return (
    <section className="px-6 pb-8 pt-4">
      <div className="mx-auto grid max-w-[1200px] gap-4 md:grid-cols-2">
        <Link
          href={marketingSignupPath()}
          className="group relative min-h-[280px] overflow-hidden rounded-[28px] bg-[#0B1B3A] p-8 text-white md:min-h-[300px]"
        >
          <Image
            src="/images/marketing/portal/bybelt-texture.png"
            alt=""
            fill
            className="object-cover opacity-40"
            aria-hidden
          />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <Image
                src="/images/marketing/portal/bybelt-logo.png"
                alt="Bybelt"
                width={80}
                height={28}
                className="mb-6 h-auto w-20"
              />
              <h2 className="text-2xl font-normal leading-snug sm:text-[28px]">
                Ready to build exceptional customer support?
              </h2>
            </div>
            <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold">
              Get your AI agent
              <Image
                src="/images/marketing/portal/arrow-right-white.svg"
                alt=""
                width={18}
                height={18}
                aria-hidden
              />
            </span>
          </div>
        </Link>

        <Link
          href={marketingFeaturePath("/ai-agent")}
          className="group relative min-h-[280px] overflow-hidden rounded-[28px] bg-[#1A1033] p-8 text-white md:min-h-[300px]"
        >
          <Image
            src="/images/marketing/portal/hugo-texture.png"
            alt=""
            fill
            className="object-cover opacity-50"
            aria-hidden
          />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <Image
                src="/images/marketing/portal/hugo-logo.png"
                alt="Hugo"
                width={88}
                height={28}
                className="mb-6 h-auto w-[88px]"
              />
              <h2 className="text-2xl font-normal leading-snug sm:text-[28px]">
                Meet Hugo, your brand&apos;s most efficient support teammate.
              </h2>
            </div>
            <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold">
              Discover Hugo
              <Image
                src="/images/marketing/portal/arrow-right-white.svg"
                alt=""
                width={18}
                height={18}
                aria-hidden
              />
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}
