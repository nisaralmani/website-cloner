import { eq, max } from "drizzle-orm";
import type { AppDatabase } from "@/db/client";
import { selectOne } from "@/db/client";
import { visitorChatSessions, visitors } from "@/db/schema";
import { pickVisitorGradient } from "@/lib/chatbox/visitor-session";

import type { VisitorGeo } from "@/lib/visitors/geo";

type VisitorChatSessionRow = typeof visitorChatSessions.$inferSelect;

const COUNTRY_COORDS: Record<string, { city: string; location: string; lat: number; lng: number }> =
  {
    US: { city: "New York", location: "United States", lat: 40.7128, lng: -74.006 },
    CA: { city: "Toronto", location: "Canada", lat: 43.6532, lng: -79.3832 },
    GB: { city: "London", location: "United Kingdom", lat: 51.5074, lng: -0.1278 },
    FR: { city: "Paris", location: "France", lat: 48.8566, lng: 2.3522 },
    DE: { city: "Berlin", location: "Germany", lat: 52.52, lng: 13.405 },
    ZA: { city: "Johannesburg", location: "South Africa", lat: -26.2041, lng: 28.0473 },
    PK: { city: "Karachi", location: "Pakistan", lat: 24.8607, lng: 67.0011 },
    AU: { city: "Sydney", location: "Australia", lat: -33.8688, lng: 151.2093 },
    IN: { city: "Mumbai", location: "India", lat: 19.076, lng: 72.8777 },
    BR: { city: "São Paulo", location: "Brazil", lat: -23.5505, lng: -46.6333 },
  };

function coordsForCountry(country: string) {
  return COUNTRY_COORDS[country] ?? COUNTRY_COORDS.US;
}

export async function upsertLiveVisitorFromSession(
  db: AppDatabase,
  session: VisitorChatSessionRow,
  input: { pageUrl?: string; latitude?: number; longitude?: number; geo?: VisitorGeo } = {},
) {
  const country = input.geo?.countryCode?.toUpperCase().slice(0, 2) || session.country?.toUpperCase().slice(0, 2) || "US";
  const fallbackGeo = coordsForCountry(country);
  const pageUrl = input.pageUrl?.trim() || session.pageUrl?.trim() || "/";
  const latitude = Number.isFinite(input.latitude)
    ? input.latitude!
    : input.geo?.lat ?? fallbackGeo.lat;
  const longitude = Number.isFinite(input.longitude)
    ? input.longitude!
    : input.geo?.lng ?? fallbackGeo.lng;
  const city = input.geo?.city || fallbackGeo.city;
  const location = input.geo?.country || fallbackGeo.location;

  const existing = await selectOne(
    db.select().from(visitors).where(eq(visitors.id, session.id)),
  );

  if (existing) {
    await db
      .update(visitors)
      .set({
        currentPage: pageUrl,
        isActive: 1,
        latitude,
        longitude,
        city,
        location,
        country,
      })
      .where(eq(visitors.id, session.id));
    return existing.id;
  }

  const [maxOrderRow] = await db
    .select({ value: max(visitors.sortOrder) })
    .from(visitors)
    .where(eq(visitors.workspaceId, session.workspaceId));

  await db.insert(visitors).values({
    id: session.id,
    workspaceId: session.workspaceId,
    name: session.visitorNickname,
    initials: null,
    city,
    location,
    country,
    currentPage: pageUrl,
    isActive: 1,
    avatarGradient: pickVisitorGradient(session.id),
    latitude,
    longitude,
    sortOrder: (maxOrderRow?.value ?? -1) + 1,
  });

  return session.id;
}
