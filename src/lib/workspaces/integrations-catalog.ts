import type { IntegrationCategory } from "@/types/workspace-integrations";

export const WORKSPACE_INTEGRATIONS_INTRO =
  "Integrate Bybelt on one of these channels to get in touch with your customers.";

export const WORKSPACE_INTEGRATIONS_FOOTER_BUTTON = "See all integrations";

export const WORKSPACE_INTEGRATION_CATEGORIES: IntegrationCategory[] = [
  {
    title: "Website",
    channels: [
      { name: "HTML", image: "/images/integrations/chatbox.svg" },
      { name: "WordPress", image: "/images/integrations/wordpress.svg" },
      { name: "Shopify", image: "/images/integrations/shopify.svg" },
      { name: "Prestashop", image: "/images/integrations/prestashop.svg" },
      { name: "WooCommerce", image: "/images/integrations/woocommerce.svg" },
      { name: "WHMCS", image: "/images/integrations/whmcs.svg" },
      { name: "Adobe Commerce", image: "/images/integrations/adobe_commerce.svg" },
      { name: "iFrame", image: "/images/integrations/chatbox_embedded.svg" },
    ],
  },
  {
    title: "Email",
    channels: [
      { name: "Gmail", image: "/images/integrations/gmail.svg" },
      { name: "Outlook", image: "/images/integrations/outlook.svg" },
      { name: "Email", image: "/images/integrations/email.svg" },
    ],
  },
  {
    title: "Messaging Plugins",
    channels: [
      { name: "Instagram", image: "/images/integrations/instagram.svg" },
      { name: "Messenger", image: "/images/integrations/messenger.svg" },
      { name: "Slack", image: "/images/integrations/slack.svg" },
      { name: "Telegram", image: "/images/integrations/telegram.svg" },
      { name: "X (Twitter)", image: "/images/integrations/twitter.svg" },
      { name: "WhatsApp", image: "/images/integrations/whatsapp.svg" },
      { name: "Aircall", image: "/images/integrations/aircall.svg" },
      { name: "Auto-Responder", image: "/images/integrations/auto_responder.svg" },
      { name: "Bot", image: "/images/integrations/bot.svg" },
      { name: "Contact Form", image: "/images/integrations/contact_form.svg" },
      { name: "Discord", image: "/images/integrations/discord.svg" },
      { name: "GitHub", image: "/images/integrations/github.svg" },
      { name: "Hugo", image: "/images/plugins/hugo.png" },
      { name: "Klaviyo", image: "/images/integrations/klaviyo.svg" },
      { name: "Line", image: "/images/integrations/line.svg" },
      { name: "Ringover", image: "/images/integrations/ringover.svg" },
      { name: "Ticket Center", image: "/images/integrations/ticket_center.svg" },
      { name: "Triggers", image: "/images/integrations/triggers.svg" },
      { name: "Twilio", image: "/images/integrations/twilio.svg" },
      { name: "Viber", image: "/images/integrations/viber.svg" },
    ],
  },
  {
    title: "Native App SDKs",
    channels: [
      { name: "iOS SDK", image: "/images/integrations/ios.svg" },
      { name: "Android SDK", image: "/images/integrations/android.svg" },
      { name: "React Native SDK", image: "/images/integrations/react.svg" },
    ],
  },
];
