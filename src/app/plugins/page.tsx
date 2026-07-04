import type { Metadata } from "next";
import { Suspense } from "react";
import AppShell from "@/components/app/AppShell";
import PluginsNav from "@/components/plugins/PluginsNav";
import PluginsPanel from "@/components/plugins/PluginsPanel";

export const metadata: Metadata = {
  title: "Plugins | Bybelt",
};

function PluginsLoading() {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-center bg-[#FBFBFB] text-sm text-[#828EA1]">
      Loading plugins…
    </div>
  );
}

export default function PluginsPage() {
  return (
    <AppShell>
      <div className="flex min-w-0 flex-1 overflow-hidden">
        <Suspense fallback={<PluginsLoading />}>
          <PluginsNav />
        </Suspense>
        <Suspense fallback={<PluginsLoading />}>
          <PluginsPanel />
        </Suspense>
      </div>
    </AppShell>
  );
}
