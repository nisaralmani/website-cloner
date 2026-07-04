import Image from "next/image";
import Link from "next/link";
import {
  FEATURES_MEGA_MENU,
  HELP_MEGA_MENU,
  MEGA_MENU_PROMOS,
} from "@/lib/marketing-data";

type MegaMenuKind = "Features" | "Help";

export function MarketingMegaMenu({ kind }: { kind: MegaMenuKind }) {
  if (kind === "Features") {
    return (
      <div className="w-[min(720px,calc(100vw-3rem))] rounded-2xl border border-[#E8EAEB] bg-white p-3 shadow-2xl">
        <div className="mb-2 grid gap-2 sm:grid-cols-2">
          {MEGA_MENU_PROMOS.map((promo) => (
            <Link
              key={promo.href}
              href={promo.href}
              className="rounded-xl border border-[#E8EAEB] bg-[#F9FAFB] p-3 transition-colors hover:border-[#1972F5] hover:bg-[#F4F6FB]"
            >
              <p className="text-[15px] font-semibold text-[#19253B]">{promo.title}</p>
              <p className="mt-1 text-sm leading-snug text-[#5F6D7F]">
                {promo.description}
              </p>
            </Link>
          ))}
        </div>
        <div className="grid gap-1 sm:grid-cols-2">
          {FEATURES_MEGA_MENU.map((item) => (
            <MegaMenuLink key={item.href} {...item} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-[min(360px,calc(100vw-3rem))] rounded-2xl border border-[#E8EAEB] bg-white p-2 shadow-2xl">
      {HELP_MEGA_MENU.map((item) => (
        <MegaMenuLink key={item.label} {...item} />
      ))}
    </div>
  );
}

function MegaMenuLink({
  label,
  href,
  description,
  icon,
  external,
}: {
  label: string;
  href: string;
  description: string;
  icon?: string;
  external?: boolean;
}) {
  const className =
    "flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[#F4F6FB]";

  const content = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EBF3FE]">
        {icon ? (
          <Image src={icon} alt="" width={22} height={22} className="h-[22px] w-[22px]" />
        ) : (
          <span className="text-sm font-bold text-[#1972F5]">{label.charAt(0)}</span>
        )}
      </span>
      <span className="min-w-0 text-left">
        <span className="block text-[15px] font-medium text-[#19253B]">{label}</span>
        <span className="mt-0.5 block text-sm leading-snug text-[#5F6D7F]">
          {description}
        </span>
      </span>
    </>
  );

  if (external || !href.startsWith("/")) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}
