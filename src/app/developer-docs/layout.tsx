import "../bybelt-fonts.css";

export default function DeveloperDocsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="bybelt-marketing min-h-full">{children}</div>;
}
