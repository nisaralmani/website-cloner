import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings | Bybelt",
  description: "Bybelt workspace settings — UI clone (mock data)",
};

export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
