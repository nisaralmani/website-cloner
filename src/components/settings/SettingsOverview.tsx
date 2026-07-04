import Link from "next/link";
import { cn } from "@/lib/utils";
import { appSettingsPath } from "@/lib/marketing-paths";

function BentoCard({
  title,
  description,
  button,
  href,
  primary,
  imageUrl,
  width,
  height,
}: (typeof overviewCards)[number]) {
  return (
    <article
      className="flex flex-col rounded-lg border border-[#E8EAEB] bg-white px-[18px] pb-[26px] pt-5"
      style={{ width, height }}
    >
      <h3 className="text-[17.5px] font-extrabold leading-snug text-[#2c405a]">{title}</h3>
      <p className="mt-2 text-[13px] leading-relaxed text-[#75869c]">{description}</p>
      <div className="relative mt-3 min-h-0 flex-1 overflow-hidden">
        <img src={imageUrl} alt="" className="h-full w-full object-contain object-left-bottom" />
      </div>
      <div className="mt-4">
        <Link
          href={href}
          className={cn(
            "inline-flex h-9 items-center rounded px-4 text-[13px] font-bold",
            primary
              ? "bg-[#1972F5] text-white"
              : "border border-[#E6EAF0] bg-[#F4F4F5] text-[#1c293b]",
          )}
        >
          {button}
        </Link>
      </div>
    </article>
  );
}

const overviewCards = [
  {
    title: "Invite your team",
    description:
      "Invite your colleagues to join your Bybelt workspace. Collaborate seamlessly and manage conversations together efficiently.",
    button: "Add Operators",
    href: appSettingsPath("workspace/operators"),
    primary: true,
    imageUrl: "/images/settings/bento-operators.webp",
    width: 563,
    height: 360,
  },
  {
    title: "Adjust your Chatbox design to fit your brand and website",
    description:
      "Customize the look and feel of your chatbox to create a seamless user experience.",
    button: "Customize Chatbox",
    href: appSettingsPath("chatbox/appearance"),
    primary: false,
    imageUrl: "/images/settings/bento-chatbox.webp",
    width: 281,
    height: 360,
  },
  {
    title: "Boost efficiency with Shortcuts",
    description:
      "Save time and improve response rates by creating shortcuts for common messages.",
    button: "Add Shortcuts",
    href: appSettingsPath("inbox/shortcuts"),
    primary: false,
    imageUrl: "/images/settings/bento-shortcuts.webp",
    width: 375,
    height: 401,
  },
  {
    title: "Set your Availability days and hours",
    description:
      "Let visitors know when you're available to chat by setting up your schedule.",
    button: "Define availability schedule",
    href: appSettingsPath("account/availability"),
    primary: true,
    imageUrl: "/images/settings/bento-schedule.webp",
    width: 469,
    height: 401,
  },
] as const;

export default function SettingsOverview() {
  const [operators, chatbox, shortcuts, availability] = overviewCards;

  return (
    <div className="flex-1 h-full overflow-y-auto bg-white px-6 py-5">
      <div className="flex w-[864px] max-w-full flex-col gap-5">
        <div className="flex gap-5">
          <BentoCard {...operators} />
          <BentoCard {...chatbox} />
        </div>
        <div className="flex gap-5">
          <BentoCard {...shortcuts} />
          <BentoCard {...availability} />
        </div>
      </div>
    </div>
  );
}
