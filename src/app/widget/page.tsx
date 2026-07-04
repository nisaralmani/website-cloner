import type { Metadata } from "next";
import VisitorChatWidget from "@/components/chatbox/VisitorChatWidget";

export const metadata: Metadata = {
  title: "Chat Widget | Bybelt",
  robots: { index: false, follow: false },
};

export default async function WidgetPage({
  searchParams,
}: {
  searchParams: Promise<{
    domain?: string;
    workspaceId?: string;
    embed?: string;
    email?: string;
    name?: string;
  }>;
}) {
  const params = await searchParams;
  const domain = params.domain ?? "fashionsis.com";
  const workspaceId = params.workspaceId;
  const embed = params.embed === "1";
  const initialEmail = params.email;
  const initialName = params.name;

  return (
    <main
      className={
        embed
          ? "h-dvh w-full overflow-hidden bg-transparent"
          : "flex min-h-screen items-center justify-center bg-[#F4F6FB] p-6"
      }
    >
      <VisitorChatWidget
        domain={domain}
        workspaceId={workspaceId}
        initialEmail={initialEmail}
        initialName={initialName}
        className={
          embed
            ? "h-full w-full max-h-none max-w-none rounded-none border-0 shadow-none"
            : undefined
        }
      />
    </main>
  );
}
