import type { PageConfig } from "./settings-data";
import {
  CHATBOX_APPEARANCE_FIELD_OPTIONS,
} from "./chatbox/appearance-preferences";
import {
  CHATBOX_BEHAVIOR_FIELD_OPTIONS,
} from "./chatbox/behavior-preferences";
import { helpArticleUrl } from "@/lib/docs-links";
import { DOCS_CHAT_WIDGET_URL, DOCS_REST_API_REFERENCE_URL } from "./docs-links";
import { SETTINGS_KEYBOARD_SHORTCUTS_URL } from "./settings-help-urls";
import { appSettingsPath } from "./marketing-paths";

/** Full page configs aligned with Bybelt settings UI. */
export const SETTINGS_REGISTRY: Record<string, PageConfig> = {
  "account/information": {
    title: "Account information",
    breadcrumb: ["Account", "Account information"],
    alert: {
      text: "Your account email address has not been verified.",
      action: "Send an email now?",
    },
    sections: [
      {
        title: "Avatar",
        items: [
          {
            kind: "avatar",
            imageUrl: "/images/avatars/operator-nisar.jpg",
            help: "File smaller than 10 MB and at least 400px by 400px (1:1 ratio). This image will be shown to your visitors.",
          },
        ],
      },
      {
        title: "Personal Details",
        columns: 2,
        items: [
          {
            kind: "field",
            label: "First Name",
            value: "Nisar",
            placeholder: "Enter your first name",
            required: true,
            help: "Only your first name is visible to users. Your last name is kept private anytime.",
          },
          {
            kind: "field",
            label: "Last Name",
            value: "Ali",
            placeholder: "Enter your last name",
            required: true,
          },
          {
            kind: "field",
            label: "Email",
            value: "contact@fashionpara.com",
            placeholder: "Enter your email address",
            required: true,
            help: "Your email is used to send you notifications. Your visitors will not see it.",
          },
          {
            kind: "field",
            label: "Phone",
            placeholder: "Enter a number (eg. +16281234567)",
            help: "A phone number can be used for account recovery purposes. It is required for 2-Step.",
          },
        ],
      },
      {
        title: "Security",
        items: [
          {
            kind: "buttonRow",
            variant: "horizontal",
            label: "Password",
            button: "Change password",
            primary: true,
          },
          {
            kind: "buttonRow",
            variant: "horizontal",
            label: "2-Step",
            button: "Enable Two Factor Authentication",
            disabled: true,
            help: "A phone number is required for 2-Step.",
            helpBelow: true,
          },
        ],
      },
    ],
    footerLink: {
      before: "Looking to remove your Bybelt account?",
      link: "Delete your account there.",
      muted: true,
    },
  },

  "account/notifications": {
    title: "Notifications",
    breadcrumb: ["Account", "Notifications"],
    sections: [
      {
        items: [
          { kind: "toggle", label: "Disable all notifications", on: false },
          {
            kind: "toggle",
            label: "Notify me of messages when I am online",
            on: true,
          },
          {
            kind: "toggle",
            label: "Notify me of messages when I am offline",
            on: true,
          },
          {
            kind: "toggle",
            label: "Notify me when a visitor is browsing my website",
            on: false,
          },
          { kind: "toggle", label: "Play notification sounds", on: true },
          { kind: "toggle", label: "Email me unread messages", on: false },
          { kind: "toggle", label: "Email me transcripts of conversations", on: false },
          { kind: "toggle", label: "Email me user ratings", on: false },
          {
            kind: "toggle",
            label: "Email me paid invoices (only if you use a paid plan)",
            on: true,
          },
        ],
      },
    ],
  },

  "account/availability": {
    title: "Availability",
    breadcrumb: ["Account", "Availability"],
    showHelp: true,
    statusBanner: {
      variant: "success",
      title: "You are currently seen as:",
      titleHighlight: "Online",
      body: "Set yourself available on schedule, by configuring days and times (in your timezone). Visitors will see you as away off scheduled hours, but they can still send you messages.",
      bodyBold:
        "If you are member of a workspace with multiple operators, the chatbox will be seen as online if at least one operator is available, and away if all operators are unavailable.",
    },
    sections: [
      {
        items: [
          { kind: "toggle", label: "Force offline (invisible mode)", on: false },
          { kind: "toggle", label: "Set me available when using the app", on: true },
          { kind: "toggle", label: "Enable availability schedule", on: false },
          {
            kind: "dayTabs",
            label: "Days",
            limit: "(6/7)",
            days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            selected: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
            disabled: true,
          },
          { kind: "divider", size: "large" },
          {
            kind: "select",
            variant: "horizontal",
            label: "Timezone",
            value: "UTC+05:00",
            disabled: true,
            fieldWidth: 340,
          },
          {
            kind: "hoursRow",
            label: "Hours",
            placeholders: ["—", "—", "—", "—"],
            button: "Add",
            disabled: true,
          },
        ],
      },
    ],
  },

  "account/security": {
    title: "Security",
    breadcrumb: ["Account", "Security"],
    showHelp: true,
    description: "Manage apps connected to your Bybelt account. Review session history.",
    sections: [
      {
        title: "Authorized apps",
        items: [
          {
            kind: "entriesTable",
            columns: [
              { label: "User Agent", width: "47%" },
              { label: "Location", width: "35%" },
              { label: "Actions", width: "18%", align: "center" },
            ],
            rows: [
              [
                { kind: "text", value: "Chrome (Windows)" },
                { kind: "location", country: "Pakistan", ip: "39.48.199.245" },
                { kind: "action", label: "Close session" },
              ],
              [
                { kind: "text", value: "Chrome (Windows)" },
                { kind: "location", country: "Pakistan", ip: "39.48.199.245" },
                { kind: "action", label: "Close session" },
              ],
              [
                { kind: "text", value: "Chrome (Windows)" },
                { kind: "location", country: "Pakistan", ip: "39.48.199.245" },
                { kind: "action", label: "Close session" },
              ],
              [
                { kind: "text", value: "okhttp/4.12.0" },
                { kind: "location", country: "Pakistan", ip: "39.48.196.15" },
                { kind: "action", label: "Close session" },
              ],
              [
                { kind: "text", value: "okhttp/4.12.0" },
                { kind: "location", country: "Pakistan", ip: "39.48.212.13" },
                { kind: "action", label: "Close session" },
              ],
              [
                { kind: "text", value: "okhttp/4.12.0" },
                { kind: "location", country: "Pakistan", ip: "39.51.38.42" },
                { kind: "action", label: "Close session" },
              ],
              [
                { kind: "text", value: "okhttp/4.12.0" },
                { kind: "location", country: "Pakistan", ip: "119.160.2.147" },
                { kind: "action", label: "Close session" },
              ],
              [
                { kind: "text", value: "okhttp/4.12.0" },
                { kind: "location", country: "Pakistan", ip: "119.160.2.147" },
                { kind: "action", label: "Close session" },
              ],
            ],
          },
        ],
      },
      {
        title: "Recent login history",
        items: [
          {
            kind: "entriesTable",
            columns: [
              { label: "Date", width: "47%" },
              { label: "Location", width: "35%" },
              { label: "State", width: "18%", align: "center" },
            ],
            rows: [
              [
                { kind: "dateFrom", when: "17m", agent: "Chrome (Windows)" },
                { kind: "location", country: "Pakistan", ip: "39.48.199.245" },
                { kind: "badge", value: "Authorized", tone: "green" },
              ],
              [
                { kind: "dateFrom", when: "1h (3:52 AM)", agent: "Chrome (Windows)" },
                { kind: "location", country: "Pakistan", ip: "39.48.199.245" },
                { kind: "badge", value: "Authorized", tone: "green" },
              ],
              [
                { kind: "dateFrom", when: "1h (3:51 AM)", agent: "Chrome (Windows)" },
                { kind: "location", country: "Pakistan", ip: "39.48.199.245" },
                { kind: "badge", value: "Authorized", tone: "green" },
              ],
              [
                { kind: "dateFrom", when: "21 Feb (1:19 PM)", agent: "okhttp/4.12.0" },
                { kind: "location", country: "Pakistan", ip: "39.48.196.15" },
                { kind: "badge", value: "Authorized", tone: "green" },
              ],
              [
                { kind: "dateFrom", when: "10 Feb (8:01 AM)", agent: "okhttp/4.12.0" },
                { kind: "location", country: "Pakistan", ip: "39.48.212.13" },
                { kind: "badge", value: "Authorized", tone: "green" },
              ],
              [
                { kind: "dateFrom", when: "31 Jan (4:23 PM)", agent: "Chrome (Windows)" },
                { kind: "location", country: "Pakistan", ip: "39.57.35.221" },
                { kind: "badge", value: "Closed", tone: "grey" },
              ],
              [
                { kind: "dateFrom", when: "29 Jan (11:51 PM)", agent: "okhttp/4.12.0" },
                { kind: "location", country: "Pakistan", ip: "39.51.38.42" },
                { kind: "badge", value: "Authorized", tone: "green" },
              ],
              [
                { kind: "dateFrom", when: "29 Jan (9:26 AM)", agent: "okhttp/4.12.0" },
                { kind: "location", country: "Pakistan", ip: "119.160.2.147" },
                { kind: "badge", value: "Authorized", tone: "green" },
              ],
              [
                { kind: "dateFrom", when: "29 Jan (9:26 AM)", agent: "okhttp/4.12.0" },
                { kind: "location", country: "Pakistan", ip: "119.160.2.147" },
                { kind: "badge", value: "Authorized", tone: "green" },
              ],
              [
                { kind: "dateFrom", when: "12 Jan (1:24 AM)", agent: "okhttp/4.12.0" },
                { kind: "location", country: "Pakistan", ip: "39.48.223.170" },
                { kind: "badge", value: "Closed", tone: "grey" },
              ],
            ],
          },
        ],
      },
    ],
  },

  "account/interface": {
    title: "Interface",
    breadcrumb: ["Account", "Interface"],
    description: "Manage your interface preferences for a personalized experience.",
    sections: [
      {
        columns: 2,
        items: [
          {
            kind: "select",
            label: "Language",
            value: "Auto-Detect",
            options: [
              "Auto-Detect",
              "Czech",
              "Danish",
              "German",
              "English",
              "Spanish",
              "Finnish",
              "French",
              "Hungarian",
              "Indonesian",
              "Italian",
              "Japanese",
              "Korean",
              "Dutch",
              "Polish",
              "Portuguese",
              "Portuguese (Brazil)",
              "Romanian",
              "Russian",
              "Swedish",
              "Thai",
              "Turkish",
              "Ukrainian",
              "Vietnamese",
              "Chinese (Taiwan)",
            ],
          },
          {
            kind: "select",
            label: "Appearance",
            value: "Light Mode",
            options: ["Same as System", "Light Mode", "Dark Mode"],
          },
        ],
      },
    ],
  },

  "account/shortcuts": {
    title: "Keyboard shortcuts",
    breadcrumb: ["Account", "Keyboard shortcuts"],
    sections: [
      {
        title: "General Interface",
        items: [
          {
            kind: "toggle",
            label: "Search",
            on: true,
            shortcut: ["Ctrl", "F"],
            labelTone: "default",
          },
          {
            kind: "toggle",
            label: "Command palette",
            on: true,
            shortcut: ["Ctrl", "P"],
            labelTone: "default",
          },
        ],
      },
      {
        title: "Inbox",
        items: [
          {
            kind: "toggle",
            label: "Enable editor actions shortcuts (? and !)",
            on: true,
            labelTone: "default",
          },
        ],
      },
      {
        items: [
          {
            kind: "linkRow",
            label: "All keyboard shortcuts",
            action: "See keyboard shortcuts",
            href: SETTINGS_KEYBOARD_SHORTCUTS_URL,
            variant: "horizontal",
          },
        ],
      },
    ],
  },

  "billing/plans": {
    title: "Plans & Subscriptions",
    breadcrumb: ["Billing", "Plans & Subscriptions"],
    hideSavedBadge: true,
    alert: {
      text: "You do not have any payment method. Add one to subscribe to paid features.",
      action: "Go to billing settings",
      actionHref: appSettingsPath("billing/cards"),
    },
    billingBanner: {
      currency: "$",
      amount: "0",
      cents: ".00",
      title: "This is what you pay monthly.",
      description:
        "Payments are done monthly or yearly based on your plan preferences.",
    },
    sections: [
      {
        gap: "wide",
        items: [
          {
            kind: "sectionIntro",
            title: "Manage all workspace plans",
            description: "Manage all your workspace plan subscriptions.",
          },
          { kind: "billingPlansPanel" },
        ],
      },
    ],
  },

  "billing/cards": {
    title: "Cards",
    breadcrumb: ["Billing", "Cards"],
    showHelp: true,
    hideSavedBadge: true,
    alert: {
      text: "No payment method. Add a payment method to start adding subscriptions to your workspaces!",
    },
    sections: [
      {
        items: [
          {
            kind: "infoLines",
            lines: [
              {
                text: "You can cancel or subscribe at anytime. No commitment.",
              },
              {
                text: "A payment method can be linked to multiple workspaces (eg: if you have workspaces for multiple businesses)",
                bold: true,
              },
            ],
          },
          { kind: "billingCardsPanel" },
        ],
      },
    ],
  },

  "billing/invoices": {
    title: "Invoices",
    breadcrumb: ["Billing", "Invoices"],
    showHelp: true,
    hideSavedBadge: true,
    sections: [
      {
        gap: "none",
        items: [
          {
            kind: "infoLines",
            lines: [
              { text: "Those are your invoices for all your payment methods" },
              {
                text: "You may download those invoices regularly, to keep a copy of them.",
                bold: true,
              },
            ],
          },
          {
            kind: "billingInvoicesPanel",
            emptyTitle: "There are no invoices for this payment method.",
            emptyDescription:
              "Looking for workspace invoices? Go to the workspace settings and check the Billing section. The billing owner email address will be shown there. You will need to login to this Bybelt account in order to retrieve all your invoices.",
          },
        ],
      },
    ],
  },

  "workspace/information": {
    title: "Workspace information",
    breadcrumb: ["Workspace Settings", "Workspace information"],
    showHelp: true,
    description:
      "Configure your workspace information. This defines how your workspace appear to your users.",
    sections: [
      {
        title: "General information",
        columns: 2,
        items: [
          {
            kind: "imageField",
            label: "Icon",
            instructions:
              "File smaller than 5 MB and at least 400px by 400px (1:1 ratio).",
            imageUrl: "/images/avatars/workspace-fashionsis.jpg",
            button: "Upload image",
          },
          {
            kind: "field",
            label: "Domain",
            value: "fashionsis.com",
            placeholder: "acme.com",
            required: true,
          },
          {
            kind: "field",
            label: "Name",
            value: "FashionSis",
            placeholder: "Acme Inc.",
            required: true,
          },
          { kind: "divider", size: "large" },
        ],
      },
      {
        title: "Contact information",
        description:
          "Set your public contact information so that visitors have other ways to directly contact you.",
        columns: 2,
        items: [
          {
            kind: "field",
            label: "Email",
            value: "contact@fashionsis.com",
            placeholder: "support@acme.com",
          },
          {
            kind: "field",
            label: "Phone",
            value: "3322528575",
            placeholder: "+1 (628) 123-4567",
          },
          {
            kind: "field",
            label: "Messenger",
            placeholder: "Messenger username",
          },
          {
            kind: "field",
            label: "Telegram",
            placeholder: "Telegram username",
          },
          {
            kind: "field",
            label: "X (Twitter)",
            placeholder: "X username",
          },
          {
            kind: "field",
            label: "WhatsApp",
            placeholder: "+16281234567",
          },
          {
            kind: "field",
            label: "Instagram",
            placeholder: "Instagram username",
          },
        ],
      },
    ],
  },

  "workspace/integrations": {
    title: "Setup & Integrations",
    breadcrumb: ["Workspace Settings", "Setup & Integrations"],
    showHelp: true,
    hideSavedBadge: true,
    sections: [
      {
        gap: "none",
        items: [
          {
            kind: "copyField",
            label: "Website ID",
            value: "",
            variant: "horizontal",
          },
          {
            kind: "copyField",
            label: "Install code",
            value: "",
            variant: "vertical",
            multiline: true,
            help: "Paste this snippet before the closing </body> tag on your website.",
          },
          {
            kind: "linkRow",
            label: "Chatbox",
            action: "Chatbox setup instructions",
            href: DOCS_CHAT_WIDGET_URL,
            variant: "actionButton",
          },
          { kind: "divider", size: "large" },
        ],
      },
      {
        title: "Integrate with Bybelt",
        items: [
          {
            kind: "integrationCatalog",
            intro:
              "Integrate Bybelt on one of these channels to get in touch with your customers.",
            footerButton: "See all integrations",
          },
        ],
      },
    ],
  },

  "workspace/operators": {
    title: "Operators & Teams",
    breadcrumb: ["Workspace Settings", "Operators & Teams"],
    showHelp: true,
    description:
      "Add people that will be able to handle support for the workspace.",
    statusBanner: {
      variant: "success",
      title: "Support is",
      titleHighlight: "Online",
      highlightDot: true,
      body: "as at least one operator is online.",
      inline: true,
    },
    sections: [
      {
        title: "Options",
        items: [
          {
            kind: "toggle",
            label:
              "Prevent non-owner operators to remove data (conversations & contacts)",
            on: false,
          },
          {
            kind: "toggle",
            label: "Force operators to have Two Factor Authentication enabled",
            on: false,
          },
          { kind: "divider", size: "large" },
        ],
      },
      {
        title: "Operators",
        description: "Invite and manage operators",
        items: [
          {
            kind: "operatorsPanel",
            addButton: "Add Operator",
            sortButton: "Name",
            clearButton: "Empty Last Active",
          },
        ],
      },
    ],
  },

  "workspace/billing": {
    title: "Billing settings",
    breadcrumb: ["Workspace Settings", "Billing settings"],
    showHelp: true,
    hideSavedBadge: true,
    description:
      "Select the payment method to be used for this workspace, used for subscriptions payment.",
    sections: [
      {
        items: [
          {
            kind: "billingPaymentGroup",
            addButton: "Add new payment method",
            actionsTitle: "Want to manage all payment cards?",
            actionsLink: "Go to Cards…",
            actionsHref: appSettingsPath("billing/cards"),
          },
        ],
      },
    ],
  },

  "workspace/transparency": {
    title: "Team Transparency Log",
    breadcrumb: ["Workspace Settings", "Team Transparency Log"],
    showHelp: true,
    description:
      "Security log of important actions that workspace operators have taken.",
    pluginBanner: {
      text: "Please install the Team Transparency Log plugin to see all your logs.",
      button: "Install Plugin",
      pluginId: "watchdog",
    },
    sections: [
      {
        gap: "none",
        items: [
          {
            kind: "toggle",
            label: "Collect transparency logs from all team members",
            on: true,
            labelTone: "default",
          },
          { kind: "divider", size: "large" },
          {
            kind: "auditFilters",
            operator: "All operators",
            action: "All actions",
            dateFrom: "__/__/__",
            dateTo: "__/__/__",
            disabled: true,
          },
          {
            kind: "entriesTable",
            variant: "audit",
            columns: [
              { label: "Action", width: "34%" },
              { label: "Operator", width: "23%" },
              { label: "Time Ago", width: "17%" },
              { label: "IP Address", width: "20%" },
              { label: "", width: "6%" },
            ],
            rows: [
              [
                { kind: "auditAction", action: "Operator logged in", badge: "Write" },
                {
                  kind: "operatorCell",
                  name: "Nisar Ali",
                  avatarUrl: "/images/avatars/operator-nisar.jpg",
                },
                { kind: "timeAgo", value: "45m" },
                { kind: "auditIp", country: "Pakistan", ip: "39.48.199.245" },
                { kind: "spacer" },
              ],
              [
                { kind: "auditAction", action: "Operator logged in", badge: "Write" },
                {
                  kind: "operatorCell",
                  name: "Nisar Ali",
                  avatarUrl: "/images/avatars/operator-nisar.jpg",
                },
                { kind: "timeAgo", value: "1h (3:51 AM)" },
                { kind: "auditIp", country: "Pakistan", ip: "39.48.199.245" },
                { kind: "spacer" },
              ],
              [
                { kind: "auditAction", action: "Operator logged out", badge: "Write" },
                {
                  kind: "operatorCell",
                  name: "Nisar Ali",
                  avatarUrl: "/images/avatars/operator-nisar.jpg",
                },
                { kind: "timeAgo", value: "1h (3:51 AM)" },
                { kind: "auditIp", country: "Pakistan", ip: "39.48.199.245" },
                { kind: "spacer" },
              ],
              [
                { kind: "auditAction", action: "Workspace settings", badge: "Write" },
                {
                  kind: "operatorCell",
                  name: "Nisar Ali",
                  avatarUrl: "/images/avatars/operator-nisar.jpg",
                },
                { kind: "timeAgo", value: "5 May (7:08 PM)" },
                { kind: "auditIp", country: "Pakistan", ip: "39.48.197.175" },
                { kind: "spacer" },
              ],
            ],
          },
        ],
      },
    ],
  },

  "workspace/advanced": {
    title: "Advanced configuration",
    breadcrumb: ["Workspace Settings", "Advanced configuration"],
    showHelp: true,
    description:
      "Configure API token, Web Hooks, identity verification, and more.",
    sections: [
      {
        title: "Workspace Defaults",
        items: [
          {
            kind: "select",
            label: "Workspace default language (if user language is unknown)",
            value: "Do not use any fallback language",
            options: [
              "Do not use any fallback language",
              "English",
              "French",
              "Spanish",
              "German",
              "Portuguese",
              "Arabic",
            ],
            variant: "horizontal",
            fieldWidth: 300,
          },
        ],
      },
      {
        title: "REST API + MCP Server Tokens",
        headerButton: "Create Token",
        items: [
          {
            kind: "emptyState",
            variant: "block",
            icon: "thunder",
            title: "You have no API Token",
            description: "Your API Token will appear here.",
          },
          {
            kind: "linkRow",
            label: "View API reference",
            href: DOCS_REST_API_REFERENCE_URL,
            variant: "external",
          },
        ],
      },
      {
        title: "Web Hooks",
        badge: { text: "0 hooks", tone: "grey" },
        headerButton: "Add a Web Hook",
        items: [
          {
            kind: "emptyState",
            variant: "block",
            icon: "globe",
            title: "You have no Web Hook",
            description: "Your Web Hooks will appear here.",
          },
        ],
      },
      {
        title: "Identity Verification",
        badge: { text: "disabled", tone: "orange", dot: true },
        items: [
          {
            kind: "toggle",
            label: "Verify user emails with cryptographic signatures",
            on: false,
            labelTone: "default",
          },
        ],
      },
    ],
  },

  "workspace/data": {
    title: "Data, Limits & Legal",
    breadcrumb: ["Workspace Settings", "Data, Limits & Legal"],
    showHelp: true,
    description: "Review your data usage, manage your legal compliance settings.",
    sections: [
      {
        title: "MagicReply & Copilot Data Training",
        gap: "none",
        items: [
          {
            kind: "trainingOption",
            join: "top",
            title: "Train your MagicReply AI with latest Inbox Messages",
            description:
              "As time passes, your human operators generate new data in your Bybelt Inbox. Refreshing the MagicReply AI Data trains your AI with your latest messages. This is only used for private AI responses.",
            disclaimer:
              "MagicReply & Copilot were never trained. Run a first training now!",
            button: "Start Training MagicReply",
            buttonStyle: "solid",
          },
          {
            kind: "trainingOption",
            join: "bottom",
            title: "Write Knowledge Base articles as training data",
            description:
              "You do not have a Bybelt Knowledge Base. Did you know that articles that you write there are also used as training data for MagicReply and Copilot?",
            button: "Setup Knowledge Base",
            buttonStyle: "outline",
          },
          { kind: "divider", size: "large" },
        ],
      },
      {
        title: "Limits & Quotas Usage",
        gap: "wide",
        items: [
          {
            kind: "usageLimit",
            label: "Campaign recipients limit",
            main: "50",
            progress: 0,
            tone: "blue",
            button: "Edit",
          },
          {
            kind: "usageLimit",
            label: "Workspace operators limit",
            main: "1 / 2",
            secondary: "(in total)",
            progress: 50,
            tone: "blue",
            button: "Edit",
          },
          { kind: "divider", size: "large" },
          {
            kind: "usageLimit",
            label: "Files uploaded",
            main: "0 / 500",
            secondary: "Every 1d",
            progress: 0,
            tone: "black",
            button: "Edit",
          },
          { kind: "divider", size: "large" },
        ],
      },
      {
        title: "Contract Agreements",
        items: [
          {
            kind: "contractAgreement",
            label: "GDPR Data Processing Agreement",
            uploadButton: "Upload signed",
            viewButton: "See contract",
            viewHref: "/documents/gdpr_dpa_contract.pdf",
          },
        ],
      },
    ],
  },

  "workspace/danger": {
    title: "Danger Zone™",
    breadcrumb: ["Workspace Settings", "Danger Zone™"],
    showHelp: true,
    hideSavedBadge: true,
    description: "Perform dangerous operations on this workspace.",
    sections: [
      {
        gap: "none",
        items: [
          {
            kind: "dangerZoneAction",
            variant: "leave",
            title: "Leave workspace",
            description: "You will not be able to access the workspace anymore.",
            button: "Leave workspace",
          },
          { kind: "divider", size: "large" },
          {
            kind: "dangerZoneAction",
            variant: "delete",
            title: "Delete workspace",
            description:
              "All Bybelt data will be permanently deleted and non-recoverable.",
            button: "Delete workspace",
          },
        ],
      },
    ],
  },

  "chatbox/appearance": {
    title: "Chatbox Appearance",
    breadcrumb: ["Chatbox Settings", "Chatbox Appearance"],
    showHelp: true,
    description: "Customize how your chatbox looks like on your website or app.",
    sections: [
      {
        title: "Chatbox Theme",
        gap: "wide",
        items: [
          {
            kind: "select",
            label: "Color theme (chatbox color)",
            value: "Default (Blue)",
            variant: "horizontal",
            fieldWidth: 300,
            options: [...CHATBOX_APPEARANCE_FIELD_OPTIONS.colorTheme],
          },
          {
            kind: "select",
            label: "Layout theme (chatbox header, etc.)",
            value: "Colorized",
            variant: "horizontal",
            fieldWidth: 300,
            options: [...CHATBOX_APPEARANCE_FIELD_OPTIONS.layoutTheme],
          },
          {
            kind: "select",
            label: "Color mode (light or dark)",
            value: "Light Mode",
            variant: "horizontal",
            fieldWidth: 300,
            options: [...CHATBOX_APPEARANCE_FIELD_OPTIONS.colorMode],
          },
          {
            kind: "select",
            label: "Text theme (text visible on chatbox header)",
            value: "Questions? Chat with us!",
            variant: "horizontal",
            fieldWidth: 300,
            options: [...CHATBOX_APPEARANCE_FIELD_OPTIONS.textTheme],
          },
          {
            kind: "select",
            label: "Welcome message (first message seen by users)",
            value: "Hello! How can I help you? :)",
            variant: "horizontal",
            fieldWidth: 300,
            options: [...CHATBOX_APPEARANCE_FIELD_OPTIONS.welcomeMessage],
          },
          {
            kind: "select",
            label: "Chatbox background (messages texture)",
            value: "Death Star",
            variant: "horizontal",
            fieldWidth: 300,
            options: [...CHATBOX_APPEARANCE_FIELD_OPTIONS.chatboxBackground],
          },
          {
            kind: "select",
            label: "Chatbox language (autodetect, or force a language)",
            value: "Detect from user country",
            variant: "horizontal",
            fieldWidth: 300,
            options: [...CHATBOX_APPEARANCE_FIELD_OPTIONS.chatboxLanguage],
          },
          {
            kind: "upgradeLinkRow",
            label: "Advanced chatbox customization",
            link: "Open advanced customization",
            href: appSettingsPath("billing/plans"),
          },
        ],
      },
      {
        title: "Chatbox Button",
        items: [
          { kind: "toggle", label: "Show workspace logo in chatbox button", on: false },
          {
            kind: "toggle",
            label:
              "Show last active operator face in chatbox button (when no chat is ongoing)",
            on: false,
          },
          {
            kind: "toggle",
            label: "Show operator face in chatbox button (when a chat is ongoing)",
            on: true,
            labelTone: "default",
          },
          {
            kind: "toggle",
            label: "Show activity metrics in the chatbox (eg: mean time to reply)",
            on: false,
          },
          {
            kind: "toggle",
            label: "Show the availability tooltip when chatbox is closed",
            on: false,
          },
          {
            kind: "toggle",
            label: "Reverse the position of the chatbox (show on the left)",
            on: false,
          },
        ],
      },
    ],
  },

  "chatbox/behavior": {
    title: "Chatbox Behavior",
    breadcrumb: ["Chatbox Settings", "Chatbox Behavior"],
    showHelp: true,
    description: "Enable or disable features on your chatbox.",
    sections: [
      {
        title: "Chatbox Home",
        items: [
          {
            kind: "select",
            label: "Default section to show when the chatbox is opened",
            value: "Messages (default)",
            variant: "horizontal",
            fieldWidth: 300,
            options: [...CHATBOX_BEHAVIOR_FIELD_OPTIONS.defaultSection],
          },
          {
            kind: "toggle",
            label: "Show a home section in the chatbox (helps guiding visitors)",
            on: false,
          },
          { kind: "divider", size: "large" },
        ],
      },
      {
        title: "Visitors",
        items: [
          {
            kind: "toggle",
            label: "Ask visitors for their email address",
            on: true,
            labelTone: "default",
          },
          { kind: "toggle", label: "Ask visitors for their phone number", on: false },
          {
            kind: "toggle",
            label: "Force visitors to identify themselves (email or phone)",
            on: false,
          },
          { kind: "divider", size: "large" },
        ],
      },
      {
        title: "Files",
        items: [
          {
            kind: "toggle",
            label: "Allow files to be sent from the chatbox",
            on: true,
            labelTone: "default",
          },
          {
            kind: "toggle",
            label: "Allow audio recordings to be sent from the chatbox",
            on: true,
            labelTone: "default",
          },
          { kind: "chatboxAttachments" },
          { kind: "divider", size: "large" },
        ],
      },
      {
        title: "Knowledge Base",
        items: [
          {
            kind: "toggle",
            label:
              "Show Knowledge Base in the chatbox (if Bybelt Knowledge Base is configured)",
            on: true,
            labelTone: "default",
          },
          { kind: "toggle", label: "Knowledge Base-only mode on the chatbox", on: false },
          {
            kind: "select",
            label: "Knowledge Base navigation mode on the chatbox",
            value: "Frequently-Read Articles",
            variant: "horizontal",
            fieldWidth: 300,
            options: [...CHATBOX_BEHAVIOR_FIELD_OPTIONS.knowledgeBaseNavigation],
          },
          { kind: "divider", size: "large" },
        ],
      },
      {
        title: "Status",
        items: [
          {
            kind: "toggle",
            label:
              "Show an alert when status reports dead (if Bybelt Status is configured)",
            on: true,
            labelTone: "default",
          },
          { kind: "divider", size: "large" },
        ],
      },
      {
        title: "Hide Chatbox",
        items: [
          { kind: "toggle", label: "Hide the chatbox if all operators are away", on: false },
          { kind: "toggle", label: "Hide the chatbox on mobile devices", on: false },
          {
            kind: "upgradeLinkRow",
            label: "Advanced Chatbox restrictions",
            link: "Go to restrictions",
            href: appSettingsPath("chatbox/restrictions"),
          },
          { kind: "divider", size: "large" },
        ],
      },
      {
        title: "Privacy",
        items: [
          {
            kind: "toggle",
            label: "Operator privacy mode (eg. disable read markers in chatbox)",
            on: false,
          },
          {
            kind: "toggle",
            label: "Operators can see what visitors write in real-time (MagicType)",
            on: true,
            labelTone: "default",
          },
          { kind: "divider", size: "large" },
        ],
      },
      {
        title: "Other",
        items: [
          {
            kind: "toggle",
            label:
              "Allow visitors to create new conversations (multi-conversational chatbox)",
            on: true,
            labelTone: "default",
          },
          {
            kind: "toggle",
            label: "Suggest to play a wait game when operators are slow to reply",
            on: true,
            labelTone: "default",
          },
        ],
      },
    ],
  },

  "chatbox/search-ai": {
    title: "Chatbox Search AI",
    breadcrumb: ["Chatbox Settings", "Chatbox Search AI"],
    showHelp: true,
    description:
      "Let your users use AI search to find answers from your AI Agent training data, right from your chatbox.",
    chatboxPreview: true,
    pluginBanner: {
      text: "Please install the Overlay plugin to use Search AI on your chatbox.",
      button: "Install Plugin",
      pluginId: "overlay",
    },
    sections: [
      {
        title: "Search AI Setup",
        items: [
          {
            kind: "toggle",
            label: "Enable Search AI on my Bybelt Chatbox widget",
            on: false,
          },
          {
            kind: "toggle",
            label: "Direct users to use search before reaching out",
            on: false,
          },
          { kind: "divider", size: "large" },
        ],
      },
      {
        title: "Search Interface",
        items: [
          {
            kind: "frequentSearchesPanel",
            title: "Frequent searches",
            description:
              "Add frequently asked questions from your users there, so that they appear as 1-click search suggestions in your search widget, helping reduce messages to your support.",
            addButton: "Add",
            locale: "Default language",
            emptyText: "There is nothing there (yet!).",
          },
        ],
      },
    ],
  },

  "chatbox/security": {
    title: "Chatbox Security",
    breadcrumb: ["Chatbox Settings", "Chatbox Security"],
    showHelp: true,
    description: "Configure security and privacy preferences here.",
    sections: [
      {
        items: [
          {
            kind: "toggle",
            label: "Lock the chatbox to website domain (and subdomains)",
            on: false,
          },
          { kind: "divider", size: "large" },
          {
            kind: "statusButtonRow",
            label: "Ignore user privacy choices (MagicType, MagicBrowse)",
            button: "Privacy choices honored",
            variant: "green",
          },
          {
            kind: "statusButtonRow",
            label: "Do not auto-create chat sessions and cookies without user intent",
            button: "Total Privacy™ is inactive",
            variant: "black",
          },
        ],
      },
    ],
  },

  "chatbox/restrictions": {
    title: "Chatbox Restrictions",
    breadcrumb: ["Chatbox Settings", "Chatbox Restrictions"],
    showHelp: true,
    description:
      "Hide or block your chatbox for certain pages of your website, countries, etc.",
    sections: [
      {
        items: [
          {
            kind: "toggle",
            label: "Place support in vacation (hide chatbox)",
            on: false,
          },
          { kind: "divider", size: "large" },
          {
            kind: "buttonRow",
            variant: "horizontal",
            layout: "spread",
            buttonTone: "blue",
            label: "Show chatbox only on pages",
            button: "Add an allowed page",
          },
          { kind: "divider", size: "large" },
          {
            kind: "buttonRow",
            variant: "horizontal",
            layout: "spread",
            buttonTone: "blue",
            label: "Hide chatbox on pages",
            button: "Add a blocked page",
          },
          {
            kind: "entriesTable",
            variant: "restrictions",
            columns: [
              { label: "Url", width: "90%" },
              { label: "Action", width: "10%", align: "center" },
            ],
            rows: [],
          },
          { kind: "divider", size: "large" },
          {
            kind: "buttonRow",
            variant: "horizontal",
            layout: "spread",
            buttonTone: "blue",
            label: "Hide chatbox for countries",
            button: "Add a blocked country",
          },
          { kind: "divider", size: "large" },
          {
            kind: "buttonRow",
            variant: "horizontal",
            layout: "spread",
            buttonTone: "blue",
            label: "Hide chatbox for locales",
            button: "Add a blocked locale",
          },
          { kind: "divider", size: "large" },
          {
            kind: "buttonRow",
            variant: "horizontal",
            layout: "spread",
            buttonTone: "blue",
            label: "Hide chatbox for IPs",
            button: "Add a blocked IP",
          },
          { kind: "divider", size: "large" },
          {
            kind: "buttonRow",
            variant: "horizontal",
            layout: "spread",
            buttonTone: "red",
            label: "Blocked visitors",
            button: "Clear all block rules (IP & Email)",
          },
        ],
      },
    ],
  },

  "chatbox/push": {
    title: "Push Notifications",
    breadcrumb: ["Chatbox Settings", "Push Notifications"],
    showHelp: true,
    description:
      "Enable push notifications for your chatbox mobile SDKs for mobile apps.",
    sections: [
      {
        title: "Firebase Cloud Messaging",
        badge: { text: "disabled", tone: "orange", dot: true },
        items: [
          { kind: "toggle", label: "Notify users using Android", on: false },
          { kind: "divider", size: "large" },
        ],
      },
      {
        title: "Apple Push Notification Service",
        badge: { text: "disabled", tone: "orange", dot: true },
        items: [
          { kind: "toggle", label: "Notify users using iOS", on: false },
        ],
      },
    ],
  },

  "inbox/customize": {
    title: "Customize your Inbox",
    breadcrumb: ["Inbox Settings", "Customize your Inbox"],
    sections: [
      {
        title: "General Options",
        items: [
          { kind: "toggle", label: 'Hide the "Send confirm" popup', on: false },
          {
            kind: "select",
            label: "Email preview",
            value: "Automatic",
            variant: "horizontal",
            fieldWidth: 300,
            options: ["Automatic", "Always show original", "Always show as text"],
          },
          { kind: "divider", size: "large" },
        ],
      },
      {
        title: "Conversations list",
        items: [
          {
            kind: "buttonRow",
            variant: "horizontal",
            layout: "spread",
            buttonTone: "blue",
            label: "List layout",
            button: "Change list layout",
          },
          { kind: "toggle", label: "Show segments", on: false },
          { kind: "toggle", label: "Show channel", on: false },
          { kind: "toggle", label: "Show waiting since date", on: false },
          { kind: "toggle", label: "Show subject", on: false },
          { kind: "toggle", label: "Show notes in last message", on: true },
          { kind: "toggle", label: "Show assignee", on: false },
          { kind: "toggle", label: "Show snoozed conversations", on: false },
          { kind: "divider", size: "large" },
        ],
      },
      {
        title: "Keyboard shortcuts",
        items: [
          {
            kind: "toggle",
            label: "Enable editor actions shortcuts (? and !)",
            on: false,
          },
          {
            kind: "linkRow",
            label: "All keyboard shortcuts",
            action: "See keyboard shortcuts",
            href: SETTINGS_KEYBOARD_SHORTCUTS_URL,
            variant: "horizontal",
          },
        ],
      },
    ],
  },

  "inbox/triage": {
    title: "Automatic Triage",
    breadcrumb: ["Inbox Settings", "Automatic Triage"],
    description:
      "Block and sort your incoming messages, regardless of where they come from.",
    statusBanner: {
      variant: "info",
      title: "What are Triage Rules?",
      paragraphs: [
        {
          lead: "Triage rules help you block and sort your incoming messages.",
          text: "Think of them like the filter rules of traditional email apps, but for every kind of messages coming to your Bybelt Inbox: Chats, Emails, WhatsApp, etc.",
        },
        {
          lead: "Triage rules have 2 stages: Block and Sort.",
          text: "Block rules are processed first, and allow you to quickly dismiss messages that you do not want. Then, it will get to the Sort stage, where you can eg. apply segments.",
        },
      ],
    },
    sections: [
      {
        items: [
          {
            kind: "triageFilters",
            label: "Find a rule",
            searchPlaceholder: "Search",
            actionValue: "All actions",
            actionOptions: [
              "All actions",
              "Send to Spam",
              "Drop Message",
              "Assign Segment",
              "Set Data Value",
              "Resolve Conversation",
            ],
          },
          { kind: "divider", size: "large" },
          {
            kind: "triageRuleset",
            ruleset: "block",
            title: "Block Ruleset",
            activeCount: "0 active rules",
            addButton: "Add Blocking Rule",
            emptyTitle: "There are no block rules",
            emptyDescription:
              "Block rules automatically send messages to your spam inbox, eg. stop email floods.",
          },
          { kind: "divider", size: "large" },
          {
            kind: "triageRuleset",
            ruleset: "sort",
            title: "Sort Ruleset",
            activeCount: "0 active rules",
            addButton: "Add Sorting Rule",
            disclaimer: {
              title: "The Sort Ruleset does not replace your Inbox & Routing rules",
              body: "The sorting rules configured here allow you to transform conversation metadata, eg. set a segment.",
              bodyBold:
                "It complements your existing Inbox & Routing rules. They are processed before any other rules: your Inbox & Routing will be evaluated after your Sort rules.",
            },
            emptyTitle: "There are no sort rules",
            emptyDescription:
              "Sort rules automatically apply segments & data for messages, eg. add SLA segment.",
          },
        ],
      },
    ],
  },

  "inbox/sub-inboxes": {
    title: "Sub-Inboxes",
    breadcrumb: ["Inbox Settings", "Sub-Inboxes"],
    description:
      "Automatically organize conversations into sub-inboxes based on segments, user data, user locale, and more.",
    sections: [
      {
        title: "Sub-Inboxes",
        headerButton: "Add a sub-inbox",
        headerButtonTone: "blue",
        items: [
          {
            kind: "emptyState",
            variant: "block",
            icon: "eye",
            title: "You have no sub-inbox",
            description: "Your sub-inboxes will appear here.",
          },
        ],
      },
    ],
  },

  "inbox/routing": {
    title: "Operator Routing",
    breadcrumb: ["Inbox Settings", "Operator Routing"],
    showHelp: true,
    description:
      "Enable or disable routing and configure operators to assign based on rules.",
    sections: [
      {
        title: "General Options",
        items: [
          {
            kind: "toggle",
            label: "Assign operator who responded upon response",
            on: false,
          },
          { kind: "divider", size: "large" },
        ],
      },
      {
        title: "Routing Rules",
        headerButton: "Add a routing rule",
        headerButtonTone: "blue",
        items: [
          { kind: "toggle", label: "Enable routing rules", on: false },
          {
            kind: "toggle",
            label: "Re-run rules 24h after last operator reply",
            on: false,
          },
          {
            kind: "toggle",
            label: "Re-run rules if assigned operator is offline",
            on: false,
          },
          {
            kind: "emptyState",
            variant: "block",
            icon: "globe",
            title: "You have no routing rule",
            description: "Your routing rules will appear here.",
          },
        ],
      },
    ],
  },

  "inbox/shortcuts": {
    title: "Message Shortcuts",
    breadcrumb: ["Inbox Settings", "Message Shortcuts"],
    showHelp: true,
    hideSavedBadge: true,
    upgradeGate: {
      title: "Upgrade your plan to unlock",
      titleHighlight: "Message Shortcuts",
      featureName: "Message Shortcuts",
      plans: [
        "Included in Mini plan",
        "Included in Essentials plan",
        "Included in Plus plan",
      ],
      description:
        "Message Shortcuts let your team save and reuse common replies in one click, no more typing the same answers over and over. Define shortcuts like !pricing or !refund, and insert them instantly during a chat. It works on web, desktop, and mobile, making support quicker and more consistent across your team.",
      bullets: [
        "Train new operators faster",
        "Save time on repetitive replies",
        "Keep support consistent",
        "Answer faster, even on mobile",
      ],
      button: "Upgrade your Bybelt plan",
      footnotes: ["Refund if unsatisfied", "5/7 Live chat support"],
    },
    sections: [
      {
        items: [
          {
            kind: "sectionIntro",
            title: "Add a new shortcut",
            description:
              "Create a new shortcut. Give it a !bang, a group tag, and write a message for this shortcut. Then, use it in conversations to quickly answer to visitors using the shortcut !bang.",
          },
          {
            kind: "shortcutsInputRow",
            shortcutLabel: "Shortcut",
            shortcutPlaceholder: "!bang",
            tagLabel: "In tag",
            tagPlaceholder: "—",
          },
          {
            kind: "messageComposer",
            label: "Message",
            placeholder: "Enter a message for this shortcut !bang…",
          },
          {
            kind: "borderedIconButton",
            label: "Add Shortcut",
            icon: "plus-left",
            buttonTone: "blue",
            disabled: true,
          },
          { kind: "divider", size: "large" },
          {
            kind: "messageShortcutsManage",
            title: "Manage all shortcuts",
            subheading:
              "Manage your shortcuts. They are grouped by tag to help you organize them.",
            searchPlaceholder: "Search",
            emptyTitle: "You have no shortcut",
            emptyDescription: "Your shortcuts will appear here.",
          },
        ],
      },
    ],
  },

  "email/behavior": {
    title: "Email Behavior",
    breadcrumb: ["Email Settings", "Email Behavior"],
    sections: [
      {
        title: "General Options",
        items: [
          { kind: "toggle", label: "Email users transcripts of conversations", on: true },
          {
            kind: "toggle",
            label: "Enable ratings (in chatbox and transcript emails)",
            on: true,
          },
          {
            kind: "toggle",
            label: "Send emails that might be junk to the Spam inbox",
            on: true,
          },
          { kind: "divider", size: "large" },
        ],
      },
      {
        title: "Custom Email Signature",
        badge: { text: "disabled", tone: "orange", dot: true },
        items: [
          {
            kind: "toggle",
            label: "Append a text signature at the bottom of all sent emails",
            on: false,
          },
          { kind: "emailSignature" },
        ],
      },
    ],
  },

  "email/domain": {
    title: "Email Domain",
    breadcrumb: ["Email Settings", "Email Domain"],
    sections: [
      {
        title: "Custom Email Domain",
        items: [
          {
            kind: "suffixField",
            label: "Basic domain",
            value: "fabzop",
            placeholder: "acme",
            suffix: ".on.bybelt.com",
            required: true,
          },
          {
            kind: "field",
            label: "Custom domain",
            placeholder: "emails.acme.com",
            full: true,
          },
          {
            kind: "inlineInfoStatus",
            text: "This domain does not require any setup (default domain provided by Bybelt).",
          },
          {
            kind: "spreadActionRow",
            statusText: "This domain is currently in use on your workspace.",
            button: "Verify domain setup",
            buttonTone: "green",
            buttonIcon: "check-left",
          },
        ],
      },
    ],
  },

  "email/delivery": {
    title: "Email Delivery",
    breadcrumb: ["Email Settings", "Email Delivery"],
    sections: [
      {
        title: "Outbound Email IPs",
        items: [
          {
            kind: "infoStatusBlock",
            title: "What are outbound email IPs?",
            paragraphs: [
              {
                text: "When emails are sent to your users for your Bybelt messages and campaigns, they are sent using an IP address that has a reputation attached to it. The likelihood that your emails go to spam is based on the IP reputation.",
                bold: true,
              },
              {
                text: "You can either use a default shared IP pool, or a dedicated IP address to improve email deliverability.",
              },
            ],
          },
          {
            kind: "emailIpStatusPanel",
            subgroupTitle: "Your outbound email IP status",
            reputationBadge: "High",
            activeText: "You are using the shared email IP pool",
            installButton: "Install the Dedicated Email IP plugin",
            pluginId: "dedicated-email-ip",
            poolBadge: "High",
            poolText: "Using high-reputation shared pool",
            whyHref: helpArticleUrl("2egyqk"),
            whyLabel: "Why?",
          },
          { kind: "divider", size: "large" },
        ],
      },
      {
        title: "Custom Email SMTP & IMAP",
        badge: { text: "inactive", tone: "orange", dot: true },
        items: [
          {
            kind: "toggle",
            label: "Use custom SMTP/IMAP for this workspace's email channel",
            on: false,
          },
          {
            kind: "field",
            label: "SMTP host",
            placeholder: "smtp.example.com",
            full: true,
          },
          {
            kind: "field",
            label: "SMTP port",
            placeholder: "587",
          },
          {
            kind: "field",
            label: "SMTP username",
            placeholder: "username",
          },
          {
            kind: "field",
            label: "SMTP password",
            placeholder: "Leave blank to keep current password",
          },
          {
            kind: "field",
            label: "From address",
            placeholder: "noreply@example.com",
          },
          {
            kind: "field",
            label: "From name",
            placeholder: "Support",
          },
          { kind: "divider" },
          {
            kind: "field",
            label: "IMAP host",
            placeholder: "imap.example.com",
            full: true,
          },
          {
            kind: "field",
            label: "IMAP port",
            placeholder: "993",
          },
          {
            kind: "field",
            label: "IMAP username",
            placeholder: "username",
          },
          {
            kind: "field",
            label: "IMAP password",
            placeholder: "Leave blank to keep current password",
          },
          {
            kind: "emailConnectionTest",
            button: "Test connection",
          },
        ],
      },
    ],
  },
  "agent/configuration": {
    title: "AI Configuration",
    breadcrumb: ["AI Agent", "Configuration"],
    alert: {
      text: "AI Agent is currently answering 100% of matching queries.",
      action: "View Analytics",
    },
    sections: [
      {
        title: "Model Settings",
        items: [
          {
            kind: "select",
            label: "Primary Model",
            value: "gpt-4-turbo",
            options: [
              "GPT-4 Turbo (Recommended)",
              "Claude 3.5 Sonnet",
            ],
            help: "The default LLM used for generative responses.",
          },
          {
            kind: "field",
            label: "Brand Voice Guidelines",
            placeholder: "e.g. Friendly but professional, never use slang...",
            full: true,
            help: "These instructions are passed to the AI to control its tone.",
          },
        ],
      },
      {
        title: "Knowledge Base",
        items: [
          {
            kind: "toggle",
            label: "Use Shopify store data for grounding",
            on: true,
            help: "When enabled, the AI will automatically fetch product availability and policies from Shopify.",
          },
          {
            kind: "toggle",
            label: "Only answer from Knowledge Base",
            on: false,
            help: "Restrict the AI to only answering questions explicitly covered in your help articles.",
          },
        ],
      },
    ],
  },
  "agent/reviews": {
    title: "Review Settings",
    breadcrumb: ["AI Agent", "Review Settings"],
    sections: [
      {
        title: "Confidence Thresholds",
        items: [
          {
            kind: "field",
            label: "Auto-send Threshold (%)",
            value: "90",
            help: "If the AI is more confident than this value, it will reply automatically.",
          },
          {
            kind: "field",
            label: "Human Review Threshold (%)",
            value: "70",
            help: "Between this value and the auto-send threshold, messages will be sent to the Review Queue.",
          },
        ],
      },
      {
        title: "Escalation",
        items: [
          {
            kind: "toggle",
            label: "Automatically assign to Human on repeated low-confidence",
            on: true,
            help: "If the AI fails to answer with high confidence twice in a row, a human agent will be pinged.",
          },
        ],
      },
    ],
  },
};
