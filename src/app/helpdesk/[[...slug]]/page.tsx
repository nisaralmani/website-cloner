import type { Metadata } from "next";
import HelpdeskPanel from "@/components/helpdesk/HelpdeskPanel";
import { HELPDESK_NAV } from "@/lib/helpdesk-routes";
import { APP_HELPDESK_PATH } from "@/lib/marketing-paths";

export const metadata: Metadata = {
  title: "Knowledge Base | Bybelt",
};

export function generateStaticParams() {
  const slugs = HELPDESK_NAV.flatMap((section) =>
    section.items.map((item) => ({
      slug: item.href.replace(`${APP_HELPDESK_PATH}/`, "").split("/"),
    })),
  );
  return [{ slug: [] }, ...slugs];
}

export default function HelpdeskPage() {
  return <HelpdeskPanel />;
}
