// Settings navigation tree + per-page content registry for the Bybelt settings clone.
import { SETTINGS_REGISTRY } from "./settings-registry";

export interface NavItem {
  label: string;
  slug: string;
  icon?: string;
  badge?: string;
}

export interface NavCategory {
  label: string;
  icon: string;
  items: NavItem[];
}

export const settingsTree: NavCategory[] = [
  {
    label: "Account",
    icon: "UserRound",
    items: [
      { label: "Account information", slug: "account/information", icon: "UserRound" },
      { label: "Notifications", slug: "account/notifications", icon: "Bell" },
      { label: "Availability", slug: "account/availability", icon: "Clock" },
      { label: "Security", slug: "account/security", icon: "Shield" },
      { label: "Interface", slug: "account/interface", icon: "Laptop" },
      { label: "Keyboard shortcuts", slug: "account/shortcuts", icon: "Keyboard" },
    ],
  },
  {
    label: "Billing",
    icon: "CreditCard",
    items: [
      { label: "Plans & Subscriptions", slug: "billing/plans", icon: "CreditCard" },
      { label: "Cards", slug: "billing/cards", icon: "CreditCard" },
      { label: "Invoices", slug: "billing/invoices", icon: "ScrollText" },
    ],
  },
  {
    label: "Workspace Settings",
    icon: "LayoutGrid",
    items: [
      { label: "Workspace information", slug: "workspace/information", icon: "Building2" },
      { label: "Setup & Integrations", slug: "workspace/integrations", icon: "Code2" },
      { label: "Operators & Teams", slug: "workspace/operators", icon: "Users" },
      { label: "Billing settings", slug: "workspace/billing", icon: "CreditCard" },
      { label: "Team Transparency Log", slug: "workspace/transparency", icon: "ScrollText" },
      { label: "Advanced configuration", slug: "workspace/advanced", icon: "Wrench" },
      { label: "Data, Limits & Legal", slug: "workspace/data", icon: "Scale" },
      { label: "Danger Zone™", slug: "workspace/danger", icon: "AlertTriangle" },
    ],
  },
  {
    label: "Chatbox Settings",
    icon: "MessageSquare",
    items: [
      { label: "Chatbox Appearance", slug: "chatbox/appearance", icon: "MessageSquare" },
      { label: "Chatbox Behavior", slug: "chatbox/behavior", icon: "Activity" },
      { label: "Chatbox Search AI", slug: "chatbox/search-ai", icon: "HelpCircle" },
      { label: "Chatbox Security", slug: "chatbox/security", icon: "Shield" },
      { label: "Chatbox Restrictions", slug: "chatbox/restrictions", icon: "AlertTriangle" },
      { label: "Push Notifications", slug: "chatbox/push", icon: "Bell" },
    ],
  },
  {
    label: "Inbox Settings",
    icon: "Inbox",
    items: [
      { label: "Customize your Inbox", slug: "inbox/customize", icon: "Inbox" },
      { label: "Automatic Triage", slug: "inbox/triage", icon: "Activity" },
      { label: "Sub-Inboxes", slug: "inbox/sub-inboxes", icon: "LayoutGrid" },
      { label: "Operator Routing", slug: "inbox/routing", icon: "Users" },
      { label: "Message Shortcuts", slug: "inbox/shortcuts", icon: "Keyboard" },
    ],
  },
  {
    label: "Email Settings",
    icon: "Mail",
    items: [
      { label: "Email Behavior", slug: "email/behavior", icon: "Mail" },
      { label: "Email Domain", slug: "email/domain", icon: "Building2" },
      { label: "Email Delivery", slug: "email/delivery", icon: "Activity" },
    ],
  },
  {
    label: "AI Agent",
    icon: "Bot",
    items: [
      { label: "AI Configuration", slug: "agent/configuration", icon: "Settings" },
      { label: "Review Settings", slug: "agent/reviews", icon: "Eye" },
    ],
  },
];

export type TableRowCell =
  | { kind: "text"; value: string }
  | { kind: "location"; country: string; ip: string }
  | { kind: "dateFrom"; when: string; agent: string }
  | { kind: "badge"; value: string; tone: "green" | "grey" }
  | { kind: "action"; label: string; sessionId?: string }
  | { kind: "deleteIcon"; id?: string }
  | { kind: "auditAction"; action: string; badge?: string }
  | { kind: "operatorCell"; name: string; avatarUrl?: string }
  | { kind: "timeAgo"; value: string }
  | { kind: "auditIp"; country: string; ip: string }
  | { kind: "spacer" };

export type SectionItem =
  | { kind: "avatar"; help?: string; imageUrl?: string }
  | {
      kind: "imageField";
      label: string;
      instructions: string;
      imageUrl?: string;
      button: string;
    }
  | {
      kind: "field";
      label: string;
      placeholder?: string;
      value?: string;
      help?: string;
      required?: boolean;
      full?: boolean;
    }
  | { kind: "textarea"; label: string; value?: string; help?: string; full?: boolean }
  | {
      kind: "select";
      label: string;
      value: string;
      options?: string[];
      help?: string;
      full?: boolean;
      variant?: "vertical" | "horizontal";
      disabled?: boolean;
      fieldWidth?: number;
    }
  | {
      kind: "buttonRow";
      label: string;
      button: string;
      primary?: boolean;
      help?: string;
      disabled?: boolean;
      variant?: "card" | "horizontal";
      helpBelow?: boolean;
      layout?: "fixed-label" | "spread";
      buttonTone?: "default" | "blue" | "red";
    }
  | {
      kind: "toggle";
      label: string;
      help?: string;
      on?: boolean;
      disabled?: boolean;
      shortcut?: string[];
      labelTone?: "muted" | "default";
    }
  | { kind: "note"; text: string }
  | {
      kind: "linkRow";
      label: string;
      href: string;
      action?: string;
      variant?: "inline" | "horizontal" | "actionButton" | "external";
    }
  | {
      kind: "integrationCatalog";
      intro: string;
      footerButton: string;
      categories?: { title: string; channels: { name: string; image: string }[] }[];
    }
  | {
      kind: "operatorsPanel";
      addButton: string;
      sortButton: string;
      clearButton: string;
      operators?: {
        name: string;
        self?: boolean;
        email: string;
        avatarUrl: string;
        role: string;
        online?: boolean;
      }[];
    }
  | {
      kind: "billingPaymentGroup";
      addButton: string;
      actionsTitle: string;
      actionsLink: string;
      actionsHref: string;
    }
  | {
      kind: "auditFilters";
      operator: string;
      action: string;
      dateFrom: string;
      dateTo: string;
      disabled?: boolean;
    }
  | {
      kind: "triageFilters";
      label: string;
      searchPlaceholder: string;
      actionValue: string;
      actionOptions?: string[];
    }
  | {
      kind: "triageRuleset";
      ruleset: "block" | "sort";
      title: string;
      activeCount: string;
      addButton: string;
      emptyTitle: string;
      emptyDescription: string;
      disclaimer?: {
        title: string;
        body: string;
        bodyBold?: string;
      };
    }
  | {
      kind: "shortcutsInputRow";
      shortcutLabel: string;
      shortcutPlaceholder: string;
      tagLabel: string;
      tagPlaceholder: string;
    }
  | {
      kind: "messageComposer";
      label: string;
      placeholder: string;
    }
  | {
      kind: "borderedIconButton";
      label: string;
      icon: "plus-left";
      buttonTone?: "blue" | "green";
      disabled?: boolean;
    }
  | {
      kind: "messageShortcutsManage";
      title: string;
      subheading: string;
      searchPlaceholder: string;
      emptyTitle: string;
      emptyDescription: string;
    }
  | {
      kind: "suffixField";
      label: string;
      value?: string;
      placeholder?: string;
      suffix: string;
      required?: boolean;
    }
  | {
      kind: "inlineInfoStatus";
      text: string;
    }
  | {
      kind: "spreadActionRow";
      statusText: string;
      button: string;
      buttonTone?: "green";
      buttonIcon?: "check-left";
      disabled?: boolean;
    }
  | {
      kind: "infoStatusBlock";
      title: string;
      paragraphs: { text: string; bold?: boolean }[];
    }
  | {
      kind: "emailIpStatusPanel";
      subgroupTitle: string;
      reputationBadge: string;
      activeText: string;
      installButton: string;
      pluginId?: string;
      poolBadge: string;
      poolText: string;
      whyHref: string;
      whyLabel: string;
    }
  | {
      kind: "trainingOption";
      title: string;
      description: string;
      disclaimer?: string;
      button: string;
      buttonStyle: "solid" | "outline";
      join?: "top" | "bottom";
    }
  | {
      kind: "usageLimit";
      label: string;
      main: string;
      secondary?: string;
      progress: number;
      tone?: "blue" | "black";
      button: string;
    }
  | {
      kind: "contractAgreement";
      label: string;
      uploadButton: string;
      viewButton: string;
      viewHref: string;
    }
  | {
      kind: "dangerZoneAction";
      variant: "leave" | "delete";
      title: string;
      description: string;
      button: string;
    }
  | {
      kind: "upgradeLinkRow";
      label: string;
      link: string;
      href: string;
    }
  | {
      kind: "frequentSearchesPanel";
      title: string;
      description: string;
      addButton: string;
      locale: string;
      emptyText: string;
    }
  | {
      kind: "statusButtonRow";
      label: string;
      button: string;
      variant: "green" | "black";
    }
  | { kind: "divider"; size?: "default" | "large" }
  | {
      kind: "dayTabs";
      label: string;
      limit?: string;
      days: string[];
      selected: string[];
      disabled?: boolean;
    }
  | {
      kind: "hoursRow";
      label: string;
      placeholders: [string, string, string, string];
      button: string;
      disabled?: boolean;
    }
  | {
      kind: "entriesTable";
      variant?: "default" | "audit" | "restrictions";
      columns: { label: string; width: string; align?: "left" | "center" }[];
      rows: TableRowCell[][];
    }
  | { kind: "colorTheme"; label: string; selected?: string }
  | {
      kind: "copyField";
      label: string;
      value: string;
      help?: string;
      variant?: "vertical" | "horizontal";
      multiline?: boolean;
    }
  | {
      kind: "footerLink";
      before: string;
      link: string;
      after?: string;
    }
  | {
      kind: "danger";
      label: string;
      description: string;
      button: string;
    }
  | { kind: "sectionIntro"; title: string; description: string }
  | { kind: "infoLines"; lines: { text: string; bold?: boolean }[] }
  | {
      kind: "emptyState";
      title: string;
      description: string;
      variant?: "centered" | "block" | "mini";
      icon?: "thunder" | "globe" | "eye";
    }
  | { kind: "iconButton"; label: string; icon?: "CreditCard" }
  | {
      kind: "workspacePlan";
      name: string;
      avatarUrl: string;
      planTag: string;
      amount: string;
      period: string;
      status: string;
      billingOwner: string;
      button: string;
    }
  | { kind: "billingCardsPanel" }
  | { kind: "billingInvoicesPanel"; emptyTitle: string; emptyDescription: string }
  | { kind: "billingPlansPanel" }
  | { kind: "emailSignature" }
  | { kind: "chatboxAttachments" };

export interface PageSection {
  title?: string;
  description?: string;
  columns?: 1 | 2;
  gap?: "default" | "wide" | "none";
  headerButton?: string;
  headerButtonTone?: "solid" | "blue";
  badge?: {
    text: string;
    tone: "grey" | "orange";
    dot?: boolean;
  };
  items: SectionItem[];
}

export interface BillingBanner {
  currency: string;
  amount: string;
  cents: string;
  title: string;
  description: string;
}

export interface PageAlert {
  text: string;
  action?: string;
  actionHref?: string;
}

export interface PluginBanner {
  text: string;
  button: string;
  pluginId?: string;
}

export interface PageStatusBanner {
  variant: "success" | "warning" | "info";
  title: string;
  titleHighlight?: string;
  highlightDot?: boolean;
  body?: string;
  bodyBold?: string;
  paragraphs?: { lead?: string; text: string }[];
  inline?: boolean;
}

export interface PageUpgradeGate {
  title: string;
  titleHighlight: string;
  featureName: string;
  plans: string[];
  description: string;
  bullets: string[];
  button: string;
  footnotes: [string, string];
}

export interface PageConfig {
  title: string;
  breadcrumb: [string, string];
  showHelp?: boolean;
  hideSavedBadge?: boolean;
  description?: string;
  statusBanner?: PageStatusBanner;
  alert?: PageAlert;
  pluginBanner?: PluginBanner;
  billingBanner?: BillingBanner;
  chatboxPreview?: boolean;
  upgradeGate?: PageUpgradeGate;
  sections: PageSection[];
  footerNote?: string;
  footerLink?: { before: string; link: string; after?: string; muted?: boolean };
}

const LABEL_OF: Record<string, string> = Object.fromEntries(
  settingsTree.flatMap((c) => c.items.map((i) => [i.slug, i.label])),
);

export function getPageConfig(slug: string): PageConfig | null {
  if (SETTINGS_REGISTRY[slug]) return SETTINGS_REGISTRY[slug];
  const label = LABEL_OF[slug];
  if (!label) return null;
  return null;
}

export function allSlugs(): string[] {
  return settingsTree.flatMap((c) => c.items.map((i) => i.slug));
}
