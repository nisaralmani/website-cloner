import Image from "next/image";
import { CUSTOMER_LOGOS } from "@/lib/marketing-data";

export default function MarketingCustomersStrip() {
  return (
    <section className="border-y border-[#E2E8F0] bg-white py-12">
      <div className="mx-auto max-w-[1280px] px-6">
        <p className="mb-8 text-center text-sm font-semibold uppercase tracking-widest text-[#94A3B8]">
          Trusted by 10,000+ companies worldwide
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
          {CUSTOMER_LOGOS.map((logo) => (
            <Image
              key={logo.name}
              src={logo.src}
              alt={logo.name}
              width={200}
              height={logo.height}
              className="h-auto w-auto max-h-[36px] opacity-50 grayscale transition-opacity hover:opacity-80"
              style={{ maxHeight: logo.height }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
