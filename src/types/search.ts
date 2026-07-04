export type SearchResultKind =
  | "conversation"
  | "contact"
  | "plugin"
  | "settings"
  | "navigation"
  | "campaign"
  | "helpdesk"
  | "visitor"
  | "messageShortcut";

export interface SearchResult {
  id: string;
  kind: SearchResultKind;
  title: string;
  subtitle?: string;
  href: string;
}

export interface SearchResponse {
  query: string;
  conversations: SearchResult[];
  contacts: SearchResult[];
  plugins: SearchResult[];
  settings: SearchResult[];
  navigation: SearchResult[];
  campaigns: SearchResult[];
  helpdesk: SearchResult[];
  visitors: SearchResult[];
  messageShortcuts: SearchResult[];
}
