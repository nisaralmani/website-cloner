import Image from "next/image";
import Link from "next/link";
import { FEATURES_OTHERS } from "@/lib/marketing-data";

export default function MarketingFeaturesOthers() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-[1200px]">
        <h2 className="max-w-[760px] text-[28px] font-normal leading-tight text-[#19253B] sm:text-[36px]">
          As your business grows, you&apos;re facing more complex queries. Bybelt makes it easy to
          solve them all.
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {FEATURES_OTHERS.map((feature) => (
            <article
              key={feature.label}
              className="overflow-hidden rounded-3xl border border-[#E8EAEB] bg-white"
            >
              <div className="flex items-center justify-center bg-[#F8F9FB] p-8">
                <Image
                  src={feature.image}
                  alt={feature.label}
                  width={448}
                  height={320}
                  className="h-auto max-h-[220px] w-auto object-contain"
                />
              </div>
              <div className="p-6">
                <div className="mb-3 flex items-center gap-2">
                  <Image src={feature.icon} alt="" width={16} height={16} aria-hidden />
                  <p className="text-sm font-bold text-[#1972F5]">{feature.label}</p>
                </div>
                <h3 className="text-xl font-semibold leading-snug text-[#19253B]">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#5F6D7F]">{feature.description}</p>
                <Link
                  href={feature.href}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#1972F5] hover:underline"
                >
                  Learn more
                  <Image
                    src="/images/marketing/button-arrow.svg"
                    alt=""
                    width={16}
                    height={16}
                    aria-hidden
                  />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
