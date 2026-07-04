// Mock inbox data for FashionSis workspace.
import type {
  Conversation,
  Workspace,
  CurrentUser,
  Message,
  CustomerDetails,
} from "@/types/inbox";

export const workspace: Workspace = {
  name: "FashionSis",
  domain: "fashionsis.com",
  initials: "FS",
  logoUrl: "/images/fashionsis-workspace.jpg",
  notificationCount: "99+",
};

export const inboxCounts = {
  mainInbox: 148,
  getStarted: 8,
  spam: 2,
  shopify: 5,
};

export const currentUser: CurrentUser = {
  name: "Nisar Ali",
  email: "contact@fashionpara.com",
  avatarGradient: "from-emerald-400 to-cyan-500",
};

const GRADIENTS = [
  "from-violet-400 to-blue-500",
  "from-sky-400 to-indigo-500",
  "from-fuchsia-400 to-purple-500",
  "from-cyan-400 to-blue-500",
  "from-rose-400 to-fuchsia-500",
  "from-indigo-400 to-violet-500",
  "from-amber-400 to-orange-500",
  "from-teal-400 to-emerald-500",
];

/** Verbatim conversation list from live inbox (Most Recent order). */
export const conversations: Conversation[] = [
  {
    id: "c1",
    name: "Ckdisson",
    initials: "Ck",
    preview: "does this have a waistline? Or does the belt give it one ?",
    time: "9h",
    unread: 0,
    status: "pending",
    country: "US",
    avatarGradient: GRADIENTS[0],
  },
  {
    id: "c2",
    name: "visitor961789",
    preview: "are these prices in Canadian dollars?",
    time: "8 Jun",
    unread: 0,
    status: "pending",
    country: "CA",
    avatarGradient: GRADIENTS[1],
  },
  {
    id: "c3",
    name: "Shoteliangel",
    initials: "Sh",
    preview: "i live in south africa",
    time: "8 May",
    unread: 0,
    status: "pending",
    country: "ZA",
    avatarGradient: GRADIENTS[2],
  },
  {
    id: "c4",
    name: "visitor957296",
    preview: "is there any reviews",
    time: "5 Feb",
    unread: 0,
    status: "pending",
    country: "US",
    avatarGradient: GRADIENTS[3],
  },
  {
    id: "c5",
    name: "visitor956512",
    preview: "where do you ship from?",
    time: "26 Jan",
    unread: 0,
    status: "pending",
    country: "US",
    avatarGradient: GRADIENTS[4],
  },
  {
    id: "c6",
    name: "visitor953191",
    preview: "entrega no Brasil?",
    time: "Jan 2025",
    unread: 1,
    status: "pending",
    country: "BR",
    avatarGradient: GRADIENTS[5],
  },
  {
    id: "c7",
    name: "Amanda Altice",
    initials: "AA",
    preview:
      "when will I receive my order 1413568. it has been months. I want my money back.",
    time: "Dec 2024",
    unread: 0,
    status: "pending",
    country: "US",
    avatarGradient: GRADIENTS[6],
  },
  {
    id: "c8",
    name: "visitor949325",
    preview: "back",
    time: "Dec 2024",
    unread: 3,
    status: "pending",
    country: "US",
    avatarGradient: GRADIENTS[7],
  },
  {
    id: "c9",
    name: "visitor946947",
    preview:
      "Hello! I'm Monalisa from the Shopify Help Center support community. I've taken a look at your store and see a lot of potential for growth in your popular niche. However, I noticed it's missing some…",
    time: "Nov 2024",
    unread: 0,
    status: "pending",
    country: "NG",
    avatarGradient: GRADIENTS[0],
  },
  {
    id: "c10",
    name: "visitor938485",
    preview: "joseanereis86@gmail.com",
    time: "Oct 2024",
    unread: 6,
    status: "pending",
    country: "BR",
    avatarGradient: GRADIENTS[1],
  },
];

const COUNTRY_INFO: Record<
  string,
  { loc: string; tz: string; time: string; flag: string }
> = {
  US: {
    loc: "United States",
    tz: "UTC-5",
    time: "4:51 PM",
    flag: "US",
  },
  BR: { loc: "Brazil", tz: "UTC-3", time: "6:51 PM", flag: "BR" },
  NG: { loc: "Nigeria", tz: "UTC+1", time: "10:51 PM", flag: "NG" },
  CA: { loc: "Canada", tz: "UTC-5", time: "4:51 PM", flag: "CA" },
  ZA: { loc: "South Africa", tz: "UTC+2", time: "11:51 PM", flag: "ZA" },
};

export function detailsFor(c: Conversation): CustomerDetails {
  const info = COUNTRY_INFO[c.country] ?? COUNTRY_INFO.US;
  return {
    email: c.id === "c7" ? "amanda.altice@example.com" : null,
    location: info.loc,
    localTime: info.time,
    timezone: info.tz,
    countryFlag: info.flag,
    channel: "Chat",
    device: "Mobile Safari 26 on iOS",
    ip: "•••.•••.•••.•••",
    visitorData: c.id === "c7" ? [{ key: "order_id", value: "1413568" }] : [],
    segments: c.id === "c7" ? ["refund"] : [],
  };
}

export function threadFor(c: Conversation): Message[] {
  if (c.id === "c5") {
    return [
      {
        id: "c5-m1",
        from: "visitor",
        text: "where do you ship from?",
        time: "26 Jan",
      },
    ];
  }
  return [
    {
      id: `${c.id}-m1`,
      from: "visitor",
      text: c.preview,
      time: c.time,
    },
  ];
}
