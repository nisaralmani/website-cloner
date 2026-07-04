import "../bybelt-fonts.css";

export default function HelpCenterLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="bybelt-marketing min-h-full">{children}</div>;
}
