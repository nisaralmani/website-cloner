import MarketingTopBanner from "@/components/marketing/MarketingTopBanner";
import MarketingHeader from "@/components/marketing/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import MarketingChatBubble from "@/components/marketing/MarketingChatBubble";

export default function MarketingShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-white text-[#0f172a] antialiased">
      <MarketingTopBanner />
      <MarketingHeader />
      <main>{children}</main>
      <MarketingFooter />
      <MarketingChatBubble />
    </div>
  );
}
