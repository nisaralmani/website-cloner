export type PluginBadge =
  | "Essentials"
  | "Mini"
  | "Plus"
  | "Free";

export interface Plugin {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  category: string;
  badge?: PluginBadge;
  price?: string;
  separateCheckout?: boolean;
  installed: boolean;
}

export interface PluginCategory {
  id: string;
  label: string;
  count: number;
}
