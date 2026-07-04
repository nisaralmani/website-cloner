export const CHATBOT_HERO = {
  eyebrow: "AI Chatbot",
  h1: "Unite AI chatbots and support teams for a better collaboration, not competition",
  subtitle:
    "Deploy an omnichannel AI chatbot trained on your knowledge base and website content. Automate repetitive questions while keeping humans in the loop for complex cases.",
  trialNote: "14 days free trial — All Bybelt features — No card required",
} as const;

export const CHATBOT_SHOWCASE = [
  {
    id: "information",
    title: "Answer instantly with accurate information",
    description:
      "Train your chatbot on your website, help articles, and files so customers get reliable answers without waiting.",
    image: "/images/marketing/chatbot/showcase-information.webp",
  },
  {
    id: "handover",
    title: "Hand over to humans when it matters",
    description:
      "Escalate to your team with full conversation context when the chatbot reaches the limits of automation.",
    image: "/images/marketing/chatbot/showcase-handover.webp",
  },
  {
    id: "ai",
    title: "Combine AI and agent workflows",
    description:
      "Blend scripted chatbot scenarios with Hugo AI so repetitive flows and open-ended questions are both covered.",
    image: "/images/marketing/chatbot/showcase-ai.webp",
  },
  {
    id: "flexibility",
    title: "Flexible across every channel",
    description:
      "Run the same chatbot logic on your website widget, WhatsApp, Messenger, Instagram, and email.",
    image: "/images/marketing/chatbot/showcase-flexibility.webp",
  },
] as const;

export const CHATBOT_ENGAGE = [
  {
    title: "Proactive engagement",
    description:
      "Trigger chatbot conversations based on visitor behavior and route qualified leads to sales or support.",
    image: "/images/marketing/chatbot/engage-engagement.png",
  },
  {
    title: "Human-like experiences",
    description:
      "Combine rich message types, quick replies, and seamless handovers so automated chats still feel personal.",
    image: "/images/marketing/chatbot/engage-human.webp",
  },
] as const;

export const CHATBOT_TRAIN_SOURCES = [
  "Website crawling",
  "Knowledge base articles",
  "PDF & document uploads",
  "Conversation history",
  "Custom snippets",
] as const;

export const CHATBOT_BUILDER_SCENARIOS = [
  "FAQ deflection",
  "HTTP API callbacks",
  "Recurring automations",
  "WhatsApp flows",
  "Follow-up sequences",
  "Third-party integrations",
] as const;
