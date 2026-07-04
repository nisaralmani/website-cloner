// Custom brand icons for the Bybelt inbox clone.
// Generic UI glyphs come from `lucide-react`; only Bybelt-specific marks live here.
import type { SVGProps } from "react";

/** The Bybelt speech-bubble mark (blue rounded square with a tail). */
export function BybeltMark({ size = 40, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M10 6h28a4 4 0 0 1 4 4v22a4 4 0 0 1-4 4H22l-10 8 1.5-8H10a4 4 0 0 1-4-4V10a4 4 0 0 1 4-4Z"
        fill="#1972F5"
      />
      <circle cx="24" cy="20" r="3" fill="#fff" />
    </svg>
  );
}

/** Bybelt logo lockup: mark + wordmark, used in the empty conversation panel. */
export function BybeltLogo({ markSize = 56 }: { markSize?: number }) {
  return (
    <div className="flex items-center gap-4 select-none">
      <BybeltMark size={markSize} />
      <span
        className="font-bold tracking-tight text-[#1c293b]"
        style={{ fontSize: markSize * 0.82 }}
      >bybelt</span>
    </div>
  );
}

/** Generic person silhouette used inside avatar bubbles. */
export function PersonGlyph({ size = 20, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
    </svg>
  );
}

/** Small rounded-flag glyph by ISO country code (emoji-based, dependency-free). */
export function CountryFlag({ code, className }: { code: string; className?: string }) {
  const emoji = code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
  return (
    <span className={className} aria-label={code} role="img">
      {emoji}
    </span>
  );
}
