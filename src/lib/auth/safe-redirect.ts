import { APP_AUTH_LOGIN_PATH, APP_AUTH_ROOT_PATH } from "@/lib/marketing-paths";

/** Auth routes must never be used as a post-login `next` target (prevents redirect loops). */
export function isAuthPagePath(pathname: string): boolean {
  return (
    pathname === APP_AUTH_LOGIN_PATH || pathname.startsWith(`${APP_AUTH_ROOT_PATH}/`)
  );
}

function pathnameFromRedirectTarget(target: string): string {
  if (target.startsWith("/")) {
    return target.split("?")[0] ?? target;
  }
  try {
    return new URL(target).pathname;
  } catch {
    return target;
  }
}

/** Safe post-login redirect for inbox paths or Shopify plugin handoff. */
export function isAllowedAuthRedirect(next: string | null | undefined): boolean {
  if (!next) return false;
  if (isAuthPagePath(pathnameFromRedirectTarget(next))) return false;
  if (next.startsWith("/") && !next.startsWith("//")) return true;
  try {
    const url = new URL(next);
    return url.protocol === "https:" && url.hostname.endsWith("bybelt.com");
  } catch {
    return false;
  }
}

export function resolveAuthRedirect(next: string | null | undefined, fallback: string): string {
  if (next && isAllowedAuthRedirect(next)) return next;
  return fallback;
}

/** Strip nested login redirects from a return path before building a login URL. */
export function sanitizeLoginNext(raw: string | null | undefined): string | null {
  if (!raw || !isAllowedAuthRedirect(raw)) return null;

  if (!raw.startsWith("/")) return raw;

  const queryIndex = raw.indexOf("?");
  if (queryIndex === -1) return raw;

  const pathname = raw.slice(0, queryIndex);
  const params = new URLSearchParams(raw.slice(queryIndex + 1));
  const nestedNext = params.get("next");
  if (nestedNext && !isAllowedAuthRedirect(nestedNext)) {
    return pathname;
  }

  return raw;
}

export function loginUrlWithNext(returnPath: string | null | undefined): string {
  const safe = sanitizeLoginNext(returnPath);
  if (!safe) return APP_AUTH_LOGIN_PATH;
  const params = new URLSearchParams({ next: safe });
  return `${APP_AUTH_LOGIN_PATH}?${params.toString()}`;
}