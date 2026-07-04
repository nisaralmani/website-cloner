import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";

/* ── Section layout ─────────────────────────────────────────── */

export function MarketingSection({
  children,
  className = "",
  id,
  variant = "white",
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  variant?: "white" | "muted" | "dark";
}) {
  const bg =
    variant === "muted"
      ? "bg-[#F8FAFC]"
      : variant === "dark"
        ? "bg-[#060d1a] text-white"
        : "bg-white";
  return (
    <section id={id} className={`px-6 py-20 md:py-24 ${bg} ${className}`}>
      <div className="mx-auto max-w-[1280px]">{children}</div>
    </section>
  );
}

export function MarketingSectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  dark = false,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  align?: "left" | "center";
  dark?: boolean;
}) {
  const alignClass = align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl";
  return (
    <header className={alignClass}>
      {eyebrow ? (
        <p className="text-sm font-semibold uppercase tracking-widest text-[#1972F5]">{eyebrow}</p>
      ) : null}
      <h2
        className={`mt-3 text-[1.75rem] font-medium leading-tight tracking-[-0.02em] sm:text-[2.25rem] ${
          dark ? "text-white" : "text-[#0f172a]"
        }`}
      >
        {title}
      </h2>
      {description ? (
        <p className={`mt-4 text-lg ${dark ? "text-white/60" : "text-[#64748b]"}`}>{description}</p>
      ) : null}
    </header>
  );
}

/* ── CTAs ───────────────────────────────────────────────────── */

export function MarketingPrimaryButton({
  href,
  children,
  external,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
}) {
  const className =
    "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#1972F5] px-7 text-[15px] font-medium text-white shadow-[0_0_30px_rgba(25,114,245,0.25)] transition-all hover:bg-[#1565DB] hover:shadow-[0_0_40px_rgba(25,114,245,0.35)]";
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function MarketingSecondaryButton({
  href,
  children,
  external,
  dark,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
  dark?: boolean;
}) {
  const className = dark
    ? "inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 text-[15px] font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/10"
    : "inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#E2E8F0] px-7 text-[15px] font-medium text-[#334155] transition-colors hover:border-[#1972F5] hover:text-[#1972F5]";
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

/* ── Cards & pills ──────────────────────────────────────────── */

export function MarketingFeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-[#E2E8F0] bg-white p-6 transition-all hover:border-[#1972F5]/25 hover:shadow-[0_8px_30px_rgba(25,114,245,0.06)]">
      {icon ? <div className="mb-4">{icon}</div> : null}
      <h3 className="text-lg font-semibold text-[#0f172a]">{title}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-[#64748b]">{description}</p>
    </article>
  );
}

export function MarketingPillRow({ items }: { items: readonly string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-medium text-[#334155]"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

/* ── Page hero ──────────────────────────────────────────────── */

export type MarketingPageHeroProps = {
  eyebrow?: string;
  title: string;
  subtitle: string;
  primaryCta?: { label: string; href: string; external?: boolean };
  secondaryCta?: { label: string; href: string; external?: boolean };
  trialNote?: string;
  image?: { src: string; alt: string; width?: number; height?: number; className?: string };
  variant?: "dark" | "light";
  centered?: boolean;
};

export function MarketingPageHero({
  eyebrow,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  trialNote,
  image,
  variant = "dark",
  centered = false,
}: MarketingPageHeroProps) {
  const isDark = variant === "dark";

  return (
    <section
      className={`relative overflow-hidden px-6 pb-16 pt-14 md:pb-20 md:pt-20 ${
        isDark ? "bg-[#060d1a] text-white" : "bg-[#F8FAFC]"
      }`}
    >
      {isDark ? (
        <>
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(25,114,245,0.3),transparent)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-32 top-10 h-[400px] w-[400px] rounded-full bg-[#1972F5]/15 blur-[100px]"
            aria-hidden
          />
        </>
      ) : null}

      <div
        className={`relative mx-auto max-w-[1280px] ${
          image && !centered
            ? "grid items-center gap-12 lg:grid-cols-2 lg:gap-16"
            : centered
              ? "max-w-3xl text-center"
              : ""
        }`}
      >
        <div className={centered ? "mx-auto" : ""}>
          {eyebrow ? (
            <p
              className={`mb-4 text-sm font-semibold uppercase tracking-widest ${
                isDark ? "text-[#60A5FA]" : "text-[#1972F5]"
              }`}
            >
              {eyebrow}
            </p>
          ) : null}
          <h1
            className={`text-[2rem] font-medium leading-[1.15] tracking-[-0.03em] sm:text-[2.75rem] lg:text-[3rem] ${
              isDark ? "text-white" : "text-[#0f172a]"
            }`}
          >
            {title}
          </h1>
          <p
            className={`mt-5 max-w-xl text-lg leading-relaxed ${
              isDark ? "text-white/60" : "text-[#64748b]"
            } ${centered ? "mx-auto" : ""}`}
          >
            {subtitle}
          </p>
          {(primaryCta || secondaryCta) && (
            <div
              className={`mt-8 flex flex-wrap gap-3 ${centered ? "justify-center" : ""}`}
            >
              {primaryCta ? (
                <MarketingPrimaryButton href={primaryCta.href} external={primaryCta.external}>
                  {primaryCta.label}
                </MarketingPrimaryButton>
              ) : null}
              {secondaryCta ? (
                <MarketingSecondaryButton
                  href={secondaryCta.href}
                  external={secondaryCta.external}
                  dark={isDark}
                >
                  {secondaryCta.label}
                </MarketingSecondaryButton>
              ) : null}
            </div>
          )}
          {trialNote ? (
            <p
              className={`mt-4 text-sm ${isDark ? "text-white/40" : "text-[#94A3B8]"} ${
                centered ? "text-center" : ""
              }`}
            >
              {trialNote}
            </p>
          ) : null}
        </div>

        {image && !centered ? (
          <div className="relative flex justify-center lg:justify-end">
            {isDark ? (
              <div
                className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-[#1972F5]/30 to-transparent blur-2xl"
                aria-hidden
              />
            ) : null}
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width ?? 640}
              height={image.height ?? 480}
              className={
                image.className ??
                `relative h-auto w-full max-w-[560px] rounded-2xl ${
                  isDark ? "border border-white/10 shadow-2xl" : "shadow-lg"
                }`
              }
              priority
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
