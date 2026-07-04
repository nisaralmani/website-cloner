import { appLoginUrl } from "@/lib/marketing-paths";

export const APPS_HERO = {
  h1: "Enjoy our customer service app for mobile & desktop",
  subtitle:
    "Download Bybelt apps for Windows, macOS, iOS, and Android to support customers from anywhere with the same shared inbox experience.",
} as const;

const APP_LOGIN_URL = appLoginUrl();

export const APPS_PLATFORMS = [
  {
    name: "Web",
    action: "Login to app",
    href: APP_LOGIN_URL,
    external: true,
    image: "/images/marketing/apps/platform-web.png",
    primary: true,
  },
  {
    name: "Mac",
    action: "Download for Mac",
    href: APP_LOGIN_URL,
    external: true,
    image: "/images/marketing/apps/platform-macos.png",
    primary: false,
  },
  {
    name: "Windows",
    action: "Download for Windows",
    href: APP_LOGIN_URL,
    external: true,
    image: "/images/marketing/apps/platform-windows.png",
    primary: false,
  },
  {
    name: "iOS",
    action: "Download on App Store",
    href: APP_LOGIN_URL,
    external: true,
    image: "/images/marketing/apps/platform-ios.png",
    primary: false,
  },
  {
    name: "Android",
    action: "Get it on Google Play",
    href: APP_LOGIN_URL,
    external: true,
    image: "/images/marketing/apps/platform-android.png",
    primary: false,
  },
] as const;

export const APPS_FEATURES = [
  {
    title: "Shared inbox on the go",
    description: "Reply to customers from mobile or desktop with the same team workspace.",
  },
  {
    title: "Push notifications",
    description: "Get alerted when customers need help, even when you're away from your desk.",
  },
  {
    title: "Offline drafts",
    description: "Compose replies offline and send when you're back online.",
  },
] as const;

export const SIGNUP_BENEFITS = [
  "14-day free trial on all plans",
  "All Bybelt features included",
  "No credit card required",
  "Set up in minutes",
] as const;
