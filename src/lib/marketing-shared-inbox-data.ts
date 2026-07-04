export const SHARED_INBOX_HERO = {
  eyebrow: "Shared Inbox",
  h1: "A shared inbox to bring seamless collaboration in one place",
  subtitle:
    "Centralize all your inbound conversations from every channel into one collaborative inbox. Your team can access, manage, and respond to messages efficiently — without stepping on each other.",
  trialNote: "14 days free trial — All Bybelt features — No card required",
} as const;

export const SHARED_INBOX_SHOWCASE = [
  {
    id: "productivity",
    title: "Made to change the way you handle customers' communication",
    description:
      "Bring every channel into one workspace so agents stop switching tabs and start resolving conversations faster.",
    image: "/images/marketing/shared-inbox/showcase-productivity.webp",
  },
  {
    id: "customization",
    title: "Take your teams' capabilities to the next level",
    description:
      "Customize views, filters, and shortcuts so each teammate works the way your support operation actually runs.",
    image: "/images/marketing/shared-inbox/showcase-customization.webp",
  },
  {
    id: "personalization",
    title: "Forget about colliding with your teammates",
    description:
      "See who is viewing or replying to a conversation in real time and avoid duplicate answers to the same customer.",
    image: "/images/marketing/shared-inbox/showcase-personalization.webp",
  },
  {
    id: "time",
    title: "Prevent repetitive questions from piling up in your inbox",
    description:
      "Use templates, knowledge base suggestions, and AI replies to handle recurring questions without manual copy-paste.",
    image: "/images/marketing/shared-inbox/showcase-time.webp",
  },
] as const;

export const SHARED_INBOX_COLLABORATE = [
  {
    title: "Auto-assign conversations",
    description:
      "Route new conversations to the right teammate or group automatically using round-robin and custom rules.",
    image: "/images/marketing/shared-inbox/collaborate-autoassign.webp",
  },
  {
    title: "Reminders & follow-ups",
    description:
      "Snooze conversations and set reminders so nothing falls through the cracks when your team is busy.",
    image: "/images/marketing/shared-inbox/collaborate-reminders.webp",
  },
  {
    title: "Private notes",
    description:
      "Leave internal context for teammates without exposing private notes to customers in the thread.",
    image: "/images/marketing/shared-inbox/collaborate-private-notes.webp",
  },
] as const;

export const SHARED_INBOX_ROUTING = [
  "Round-robin assignment",
  "Route by origin channel",
  "Route by customer intent",
  "Custom routing rules",
] as const;

export const SHARED_INBOX_AI = [
  "Smart reply suggestions",
  "Conversation summaries",
  "Auto-translate messages",
  "Transcribe audio messages",
  "Auto-categorize conversations",
  "Grammar & tone improvements",
  "Expand and rephrase drafts",
] as const;

export const SHARED_INBOX_CHANNELS = [
  "Website chat",
  "Email",
  "WhatsApp",
  "Messenger",
  "Instagram",
  "SMS",
  "Telegram",
  "Slack",
] as const;
