import { Star } from "lucide-react";
import { marketingExternalUrl } from "@/lib/marketing-paths";
import { TESTIMONIALS } from "@/lib/marketing-data";

export default function MarketingTestimonials() {
  return (
    <section id="testimonials" className="bg-[#F8FAFC] px-6 py-24">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-[#1972F5]">
              Testimonials
            </p>
            <h2 className="mt-3 text-[2rem] font-medium leading-tight tracking-[-0.02em] text-[#0f172a] sm:text-[2.5rem]">
              Loved by support teams everywhere
            </h2>
            <div className="mt-3 flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-[#FBBF24] text-[#FBBF24]" aria-hidden />
              ))}
              <span className="ml-2 text-sm text-[#64748b]">4.8 average across 2,000+ reviews</span>
            </div>
          </div>
          <a
            href={marketingExternalUrl("/testimonials/")}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-[#1972F5] hover:underline"
          >
            Read all reviews →
          </a>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <blockquote
              key={item.author}
              className="flex flex-col rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm"
            >
              <p className="flex-1 text-[15px] leading-7 text-[#334155]">
                &ldquo;{item.quote}&rdquo;
              </p>
              <footer className="mt-5 border-t border-[#F1F5F9] pt-4 text-sm font-semibold text-[#0f172a]">
                {item.author}
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
