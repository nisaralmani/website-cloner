import Image from "next/image";
import Link from "next/link";
import { USE_CASES } from "@/lib/marketing-data";

export default function MarketingUseCases() {
  return (
    <section className="bg-[#F8F9FB] px-6 py-20">
      <div className="mx-auto max-w-[1200px]">
        <h2 className="mx-auto max-w-[760px] text-center text-[32px] font-normal leading-tight text-[#19253B] sm:text-[40px]">
          Built for customer support, marketing,
          <br />
          and sales teams. All together.
        </h2>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {USE_CASES.map((useCase) => (
            <Link
              key={useCase.title}
              href={useCase.href}
              className="group overflow-hidden rounded-3xl bg-white shadow-[0_8px_30px_rgba(25,37,59,0.06)] transition-transform hover:-translate-y-1"
            >
              <Image
                src={useCase.image}
                alt={useCase.title}
                width={800}
                height={500}
                className="h-48 w-full object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold text-[#19253B]">{useCase.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#5F6D7F]">{useCase.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
