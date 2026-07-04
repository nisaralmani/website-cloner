/**
 * Ephemeral browsing presence (ported from Ai Helpdesk presence.ts).
 * Complements DB-backed live visitors from chat session pings.
 */
import { lookupVisitorGeo, type VisitorGeo } from "@/lib/visitors/geo";

export const ONLINE_WINDOW_MS = 60_000;
export const ACTIVE_WINDOW_MS = 25_000;

export interface BrowsingVisitor {
  id: string;
  workspaceId: string;
  page: string;
  title: string;
  referrer: string;
  device: "desktop" | "mobile";
  country?: string;
  countryCode?: string;
  city?: string;
  lat?: number;
  lng?: number;
  name?: string;
  email?: string;
  firstSeen: number;
  lastSeen: number;
}

const visitors = new Map<string, BrowsingVisitor>();

function visitorKey(workspaceId: string, visitorId: string) {
  return `${workspaceId}:${visitorId}`;
}

function prune(workspaceId: string) {
  const cutoff = Date.now() - ONLINE_WINDOW_MS * 10;
  for (const [key, visitor] of visitors) {
    if (!key.startsWith(`${workspaceId}:`)) continue;
    if (visitor.lastSeen < cutoff) {
      visitors.delete(key);
    }
  }
}

export async function recordBrowsingPresence(input: {
  workspaceId: string;
  visitorId: string;
  page?: string;
  title?: string;
  referrer?: string;
  ip: string;
  ua?: string;
  name?: string;
  email?: string;
}): Promise<void> {
  if (!input.visitorId || !input.workspaceId) return;

  const key = visitorKey(input.workspaceId, input.visitorId);
  const now = Date.now();
  const ua = input.ua ?? "";
  const device: BrowsingVisitor["device"] = /android|iphone|ipad|ipod|mobile/i.test(ua)
    ? "mobile"
    : "desktop";

  const existing = visitors.get(key);
  const geo: VisitorGeo =
    existing?.lat !== undefined
      ? {
          country: existing.country,
          countryCode: existing.countryCode,
          city: existing.city,
          lat: existing.lat,
          lng: existing.lng,
        }
      : await lookupVisitorGeo(input.ip);

  visitors.set(key, {
    id: input.visitorId,
    workspaceId: input.workspaceId,
    page: input.page || existing?.page || "/",
    title: input.title || existing?.title || "",
    referrer: input.referrer || existing?.referrer || "",
    device,
    country: geo.country,
    countryCode: geo.countryCode,
    city: geo.city,
    lat: geo.lat,
    lng: geo.lng,
    name: input.name || existing?.name,
    email: input.email || existing?.email,
    firstSeen: existing?.firstSeen ?? now,
    lastSeen: now,
  });

  prune(input.workspaceId);
}

export function browsingPresenceSnapshot(workspaceId: string) {
  const now = Date.now();
  const live = [...visitors.values()]
    .filter((visitor) => visitor.workspaceId === workspaceId)
    .filter((visitor) => now - visitor.lastSeen <= ONLINE_WINDOW_MS)
    .sort((a, b) => b.lastSeen - a.lastSeen);

  const active = live.filter((visitor) => now - visitor.lastSeen <= ACTIVE_WINDOW_MS).length;
  return { visitors: live, online: live.length, active };
}
