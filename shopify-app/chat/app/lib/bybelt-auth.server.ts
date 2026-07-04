import { bybeltInboxUrl, themeEmbedActivateUrl } from "./bybelt.server";
import { redirectDocument } from "react-router";

export type BybeltWorkspace = {
  id: string;
  name: string;
  domain: string;
};

export type BybeltSessionPayload = {
  authenticated: boolean;
  user?: { id: string; email: string; name: string };
  workspace?: { id: string; name: string; domain: string };
  workspaces?: BybeltWorkspace[];
};

function bybeltApiOrigin(): string {
  return bybeltInboxUrl();
}

export async function fetchBybeltSession(
  request: Request,
): Promise<BybeltSessionPayload | null> {
  const cookie = request.headers.get("Cookie") ?? "";
  if (!cookie.trim()) {
    return null;
  }

  const response = await fetch(`${bybeltApiOrigin()}/api/auth/workspace`, {
    headers: { Cookie: cookie },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as BybeltSessionPayload;
  return payload.authenticated ? payload : null;
}

function sameBybeltAppPath(returnTo: string): string | null {
  try {
    const url = new URL(returnTo);
    if (url.hostname === "chat.bybelt.com" || url.hostname.endsWith(".bybelt.com")) {
      return `${url.pathname}${url.search}`;
    }
  } catch {
    if (returnTo.startsWith("/") && !returnTo.startsWith("//")) {
      return returnTo;
    }
  }
  return null;
}

export function bybeltLoginRedirectUrl(returnTo: string): string {
  const origin = bybeltInboxUrl().replace(/\/$/, "");
  const sameAppPath = sameBybeltAppPath(returnTo);
  const next =
    sameAppPath != null
      ? `${origin}${sameAppPath}`
      : returnTo.startsWith("http")
        ? returnTo
        : `${origin}${returnTo.startsWith("/") ? returnTo : `/${returnTo}`}`;
  return `${origin}/initiate/login?next=${encodeURIComponent(next)}`;
}

export function throwBybeltLoginRedirect(returnTo: string): never {
  throw redirectDocument(bybeltLoginRedirectUrl(returnTo));
}

export function pluginReturnUrl(request: Request, shop: string, path: string): string {
  const appOrigin =
    process.env.SHOPIFY_APP_URL?.replace(/\/$/, "") || new URL(request.url).origin;
  const incoming = new URL(request.url);
  const url = new URL(path, appOrigin);
  for (const [key, value] of incoming.searchParams.entries()) {
    if (key !== "shop") {
      url.searchParams.set(key, value);
    }
  }
  url.searchParams.set("shop", shop);
  return url.toString();
}

export { themeEmbedActivateUrl };
