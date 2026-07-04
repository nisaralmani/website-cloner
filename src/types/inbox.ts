// Types for the Bybelt inbox UI clone. All data is mock/synthetic.

export type ConversationStatus = "pending" | "resolved" | "unassigned";

export interface ConversationAssignee {
  id: string;
  name: string;
  avatarGradient: string;
}

export interface Conversation {
  id: string;
  /** Display name, e.g. "visitor957296" or "Ckdisson" */
  name: string;
  /** Optional avatar initials (e.g. "Ck") when not a generic visitor */
  initials?: string;
  /** Last message preview (truncated in UI) */
  preview: string;
  /** Short relative time label, e.g. "5 Feb", "Jan 2025" */
  time: string;
  /** Unread message count shown in the blue badge (0 = hidden) */
  unread: number;
  status: ConversationStatus;
  /** Two-letter ISO country for the small flag glyph */
  country: string;
  /** Tailwind gradient classes for the avatar bubble */
  avatarGradient: string;
  /** Optional channel label for list customization */
  channel?: string;
  /** Assigned workspace operator, if any */
  assignee?: ConversationAssignee | null;
  /** Conversation segment labels */
  segments?: string[];
  /** ISO timestamp while snoozed until an active reminder */
  snoozedUntil?: string | null;
  /** Whether this card is the currently selected conversation */
  selected?: boolean;
  /** The current state in the AI review queue, if applicable */
  aiReviewState?: "pending_review" | "approved" | "rejected" | "edited" | "auto_sent" | "draft_created" | null;
}

export interface Message {
  id: string;
  /** "visitor" = incoming; "operator" = outgoing reply; "note" = internal team note; "reminder" = scheduled follow-up */
  from: "visitor" | "operator" | "note" | "reminder";
  text: string;
  /** Short time label, e.g. "4:51 PM" */
  time: string;
  /** Note/reminder author when applicable */
  author?: MessageAuthor | null;
  /** ISO timestamp when `from === "reminder"` */
  remindAt?: string;
  /** Active reminder id when `from === "reminder"` */
  reminderId?: string;
  /** ISO timestamp when the recipient received the message */
  deliveredAt?: string;
  /** ISO timestamp when the recipient read the message */
  readAt?: string;
  /** Optional file attachment (visitor uploads) */
  attachment?: MessageAttachment;
}

export interface MessageAuthor {
  id: string;
  name: string;
  avatarGradient: string;
}

export interface MessageAttachment {
  url: string;
  name: string;
  mime: string;
  size: number;
}

export interface CustomerDetails {
  email: string | null;
  location: string;
  localTime: string;
  timezone: string;
  countryFlag: string;
  channel: string;
  device: string;
  ip: string;
  visitorData: VisitorDataEntry[];
  segments: string[];
}

export interface VisitorDataEntry {
  key: string;
  value: string;
}

export interface SidebarNavItem {
  label: string;
  icon: string; // icon component key
  href?: string;
}

export interface Workspace {
  name: string;
  domain: string;
  initials: string;
  logoUrl?: string;
  notificationCount?: string;
}

export type OperatorPresence = "online" | "offline";

export interface CurrentUser {
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string | null;
  emailVerified?: boolean;
  avatarGradient: string;
  presence?: OperatorPresence;
  forceOffline?: boolean;
  autoAvailable?: boolean;
}
