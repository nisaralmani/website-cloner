export type ContactSegment = "chat" | "shopify";

export interface Contact {
  id: string;
  name: string;
  initials?: string;
  email: string;
  location: string;
  company: string;
  segments: ContactSegment[];
  lastActive: string;
  score: number;
  avatarGradient: string;
}
