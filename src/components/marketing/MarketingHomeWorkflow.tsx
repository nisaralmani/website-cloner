import { HOME_WORKFLOW_STEPS } from "@/lib/marketing-data";

export default function MarketingHomeWorkflow() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-20">
          <div className="lg:sticky lg:top-28">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#1972F5]">
              How it works
            </p>
            <h2 className="mt-3 text-[2rem] font-medium leading-tight tracking-[-0.02em] text-[#0f172a] sm:text-[2.5rem]">
              Up and running in minutes
            </h2>
            <p className="mt-4 text-lg text-[#64748b]">
              Connect your channels, train your AI, and start resolving tickets — without a lengthy
              implementation project.
            </p>
          </div>

          <ol className="space-y-0">
            {HOME_WORKFLOW_STEPS.map((step, index) => (
              <li
                key={step.title}
                className="relative flex gap-6 border-l border-[#E2E8F0] pb-12 pl-8 last:pb-0"
              >
                <span
                  className="absolute -left-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#1972F5] text-sm font-bold text-white shadow-[0_0_0_4px_#fff]"
                  aria-hidden
                >
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-xl font-semibold text-[#0f172a]">{step.title}</h3>
                  <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[#64748b]">
                    {step.description}
                  </p>
                  {step.detail && (
                    <p className="mt-3 inline-flex rounded-lg bg-[#F1F5F9] px-3 py-1.5 text-sm text-[#475569]">
                      {step.detail}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
