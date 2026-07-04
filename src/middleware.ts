import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";
import { isAuthPagePath } from "@/lib/auth/safe-redirect";
import {
  APP_ORIGIN,
  isAppHost,
  isDocsHost,
  isHelpHost,
  isStatusHost,
  isMarketingHost,
  MARKETING_ORIGIN,
  normalizeHost,
} from "@/lib/domains";
import { MARKETING_PAGES } from "@/lib/marketing-pages";
import { logger } from "@/lib/logging/logger";
import { requestIdFrom, REQUEST_ID_HEADER } from "@/lib/logging/request-id";
import {
  APP_AGENT_PATH,
  APP_AUTH_LOGIN_PATH,
  APP_AUTH_ROOT_PATH,
  APP_CONTACTS_PATH,
  APP_CAMPAIGNS_PATH,
  APP_ANALYTICS_PATH,
  APP_EMBED_SCRIPT_PATH,
  APP_HELPDESK_PATH,
  APP_PLUGINS_PATH,
  APP_SETTINGS_ROOT_PATH,
  APP_VISITORS_PATH,
  APP_WIDGET_PATH,
  DEVELOPER_DOCS_PATH,
  HELP_CENTER_PATH,
  MARKETING_EN_ROOT_PATH,
  SYSTEM_STATUS_PATH,
} from "@/lib/marketing-paths";

const MARKETING_SLUGS = new Set(MARKETING_PAGES.map((page) => page.slug));

const PUBLIC_PREFIXES = [
  MARKETING_EN_ROOT_PATH,
  HELP_CENTER_PATH,
  DEVELOPER_DOCS_PATH,
  SYSTEM_STATUS_PATH,
  APP_AUTH_ROOT_PATH,
  APP_WIDGET_PATH,
  APP_EMBED_SCRIPT_PATH,
  "/uploads",
  "/api",
  "/article",
  "/assets",
  "/_next",
  "/images",
  "/fonts",
  "/seo",
  "/robots.txt",
  "/sitemap.xml",
  "/favicon.ico",
];

const APP_ONLY_SEGMENTS = new Set([
  APP_AGENT_PATH.slice(1),
  APP_VISITORS_PATH.slice(1),
  APP_CONTACTS_PATH.slice(1),
  APP_CAMPAIGNS_PATH.slice(1),
  APP_ANALYTICS_PATH.slice(1),
  APP_PLUGINS_PATH.slice(1),
  APP_HELPDESK_PATH.slice(1),
  APP_SETTINGS_ROOT_PATH.slice(1),
  "widget",
]);

function isPublicPath(pathname: string) {
  if (pathname === "/favicon.ico") return true;
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isAppPath(pathname: string) {
  if (isPublicPath(pathname)) return false;
  if (pathname.startsWith("/__smoke")) return false;
  return true;
}

function isMarketingSlugPath(pathname: string): boolean {
  if (pathname === "/") return true;
  const slug = pathname.split("/").filter(Boolean)[0];
  return slug ? MARKETING_SLUGS.has(slug) : false;
}

function redirectTo(origin: string, pathname: string, search: string) {
  return NextResponse.redirect(new URL(pathname + search, origin), 301);
}

function rewriteTo(pathname: string, request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.rewrite(url);
}

function routeByHost(request: NextRequest): NextResponse {
  const hostHeader = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const host = normalizeHost(hostHeader);
  const { pathname, search } = request.nextUrl;

  if (isHelpHost(host)) {
    if (pathname.startsWith(HELP_CENTER_PATH)) return NextResponse.next();
    return rewriteTo(pathname === "/" ? HELP_CENTER_PATH : `${HELP_CENTER_PATH}${pathname}`, request);
  }

  if (isDocsHost(host)) {
    if (pathname.startsWith(DEVELOPER_DOCS_PATH)) return NextResponse.next();
    return rewriteTo(pathname === "/" ? DEVELOPER_DOCS_PATH : `${DEVELOPER_DOCS_PATH}${pathname}`, request);
  }

  if (isStatusHost(host)) {
    if (pathname.startsWith(SYSTEM_STATUS_PATH)) return NextResponse.next();
    return rewriteTo(pathname === "/" ? SYSTEM_STATUS_PATH : `${SYSTEM_STATUS_PATH}${pathname}`, request);
  }

  if (isMarketingHost(host)) {
    if (pathname === MARKETING_EN_ROOT_PATH || pathname === `${MARKETING_EN_ROOT_PATH}/`) {
      return redirectTo(MARKETING_ORIGIN, "/", search);
    }
    if (pathname.startsWith(`${MARKETING_EN_ROOT_PATH}/`)) {
      const barePath = pathname.slice(MARKETING_EN_ROOT_PATH.length) || "/";
      const bareSegment = barePath.split("/").filter(Boolean)[0];
      const bareIsAppMarketingSlug =
        barePath.split("/").filter(Boolean).length === 1 &&
        bareSegment !== undefined &&
        MARKETING_SLUGS.has(bareSegment) &&
        APP_ONLY_SEGMENTS.has(bareSegment);
      if (!bareIsAppMarketingSlug) {
        return redirectTo(MARKETING_ORIGIN, barePath, search);
      }
    }

    const segment = pathname.split("/").filter(Boolean)[0];
    const pathParts = pathname.split("/").filter(Boolean);
    const isMarketingLanding =
      pathParts.length === 1 && segment !== undefined && MARKETING_SLUGS.has(segment);

    if (
      isMarketingLanding &&
      segment &&
      APP_ONLY_SEGMENTS.has(segment) &&
      !pathname.startsWith(MARKETING_EN_ROOT_PATH)
    ) {
      return rewriteTo(`${MARKETING_EN_ROOT_PATH}${pathname}`, request);
    }

    if (
      pathname.startsWith(APP_AUTH_ROOT_PATH) ||
      pathname.startsWith(APP_SETTINGS_ROOT_PATH) ||
      pathname.startsWith("/api") ||
      (segment && APP_ONLY_SEGMENTS.has(segment) && !isMarketingLanding)
    ) {
      return redirectTo(APP_ORIGIN, pathname, search);
    }

    if (!pathname.startsWith(MARKETING_EN_ROOT_PATH) && isMarketingSlugPath(pathname)) {
      return rewriteTo(pathname === "/" ? MARKETING_EN_ROOT_PATH : `${MARKETING_EN_ROOT_PATH}${pathname}`, request);
    }

    return NextResponse.next();
  }

  if (isAppHost(host)) {
    if (pathname === MARKETING_EN_ROOT_PATH || pathname.startsWith(`${MARKETING_EN_ROOT_PATH}/`)) {
      const clean =
        pathname === MARKETING_EN_ROOT_PATH ? "/" : pathname.slice(MARKETING_EN_ROOT_PATH.length);
      const cleanSegment = clean.split("/").filter(Boolean)[0];
      const cleanIsAppMarketingSlug =
        clean.split("/").filter(Boolean).length === 1 &&
        cleanSegment !== undefined &&
        MARKETING_SLUGS.has(cleanSegment) &&
        APP_ONLY_SEGMENTS.has(cleanSegment);
      if (!cleanIsAppMarketingSlug) {
        return redirectTo(MARKETING_ORIGIN, clean, search);
      }
      return NextResponse.next();
    }
    if (pathname !== "/" && isMarketingSlugPath(pathname)) {
      const segment = pathname.split("/").filter(Boolean)[0];
      if (!segment || !APP_ONLY_SEGMENTS.has(segment)) {
        return redirectTo(MARKETING_ORIGIN, pathname, search);
      }
    }

    if ((host === "localhost" || host === "127.0.0.1") && isMarketingSlugPath(pathname) && !pathname.startsWith(MARKETING_EN_ROOT_PATH)) {
      const segment = pathname.split("/").filter(Boolean)[0];
      if (!segment || !APP_ONLY_SEGMENTS.has(segment)) {
        return rewriteTo(pathname === "/" ? MARKETING_EN_ROOT_PATH : `${MARKETING_EN_ROOT_PATH}${pathname}`, request);
      }
    }
  }

  return NextResponse.next();
}

function effectivePathname(request: NextRequest, response: NextResponse): string {
  const rewrite = response.headers.get("x-middleware-rewrite");
  if (rewrite) {
    return new URL(rewrite, request.url).pathname;
  }
  return request.nextUrl.pathname;
}

/** Forward x-request-id to downstream handlers while preserving host rewrites. */
function forwardRequestId(
  request: NextRequest,
  routed: NextResponse,
  requestId: string,
): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);

  const rewrite = routed.headers.get("x-middleware-rewrite");
  const response = rewrite
    ? NextResponse.rewrite(new URL(rewrite, request.url), { request: { headers: requestHeaders } })
    : NextResponse.next({ request: { headers: requestHeaders } });

  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}

export async function middleware(request: NextRequest) {
  const requestId = requestIdFrom(request);

  const incomingHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const incomingPath = request.nextUrl.pathname;
  const routed = routeByHost(request);
  const rewriteHeader = routed.headers.get("x-middleware-rewrite");
  const redirectHeader = routed.headers.get("location");
  logger.info("request", {
    requestId,
    route: incomingPath,
    method: request.method,
    host: incomingHost,
    status: routed.status,
    rewrite: rewriteHeader ?? undefined,
    redirect: redirectHeader ?? undefined,
  });

  if (routed.status >= 300 && routed.status < 400) {
    routed.headers.set(REQUEST_ID_HEADER, requestId);
    return routed;
  }

  if (process.env.SMOKE_BYPASS_AUTH === "1") {
    return forwardRequestId(request, routed, requestId);
  }

  const authPath = effectivePathname(request, routed);
  if (!isAppPath(authPath)) {
    return forwardRequestId(request, routed, requestId);
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const claims = token ? await verifySessionToken(token) : null;

  if (!claims?.userId) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = APP_AUTH_LOGIN_PATH;
    loginUrl.search = "";
    if (!isAuthPagePath(authPath)) {
      loginUrl.searchParams.set("next", authPath);
    }
    const redirect = NextResponse.redirect(loginUrl);
    redirect.headers.set(REQUEST_ID_HEADER, requestId);
    return redirect;
  }

  return forwardRequestId(request, routed, requestId);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
