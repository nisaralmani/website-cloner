import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { FEATURES_POPULAR } from "@/lib/marketing-data";
import MarketingVideoPreview from "@/components/marketing/MarketingVideoPreview";

export default function MarketingFeaturesPopular() {
  return (
    <section className="bg-[#FCFCFD] px-6 py-20">
      <div className="mx-auto max-w-[1200px] space-y-24">
        {FEATURES_POPULAR.map((feature) => (
          <article
            key={feature.label}
            className={cn(
              "grid items-center gap-10 lg:grid-cols-2",
              feature.reverse && "lg:[&>*:first-child]:order-2",
            )}
          >
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-[#1972F5]">
                {feature.label}
              </p>
              <h2 className="mt-3 text-[28px] font-normal leading-tight text-[#19253B] sm:text-[36px]">
                {feature.title}
              </h2>
              <p className="mt-4 text-base leading-7 text-[#5F6D7F]">{feature.description}</p>
              {"channels" in feature && feature.channels && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {feature.channels.map((channel) => (
                    <span
                      key={channel}
                      className="rounded-full bg-white px-3 py-1.5 text-sm text-[#242F47] shadow-sm"
                    >
                      {channel}
                    </span>
                  ))}
                </div>
              )}
              <Link
                href={feature.href}
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#1972F5] hover:underline"
              >
                {feature.cta}
                <Image
                  src="/images/marketing/button-arrow.svg"
                  alt=""
                  width={16}
                  height={16}
                  aria-hidden
                />
              </Link>
            </div>
            <MarketingVideoPreview poster={feature.poster} alt={feature.title} />
          </article>
        ))}
      </div>
    </section>
  );
}
