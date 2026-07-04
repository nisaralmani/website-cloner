/**
 * IP geolocation for live visitors (ported from Ai Helpdesk presence.ts).
 */
import { fetchWithTimeout } from "@/lib/http/fetch-with-timeout";

export interface VisitorGeo {
  country?: string;
  countryCode?: string;
  city?: string;
  lat?: number;
  lng?: number;
}

const geoCache = new Map<string, VisitorGeo>();

function isPrivateIp(ip: string): boolean {
  return (
    !ip ||
    ip === "::1" ||
    ip.startsWith("127.") ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
    ip.startsWith("::ffff:127.") ||
    ip.startsWith("fc") ||
    ip.startsWith("fd")
  );
}

export async function lookupVisitorGeo(ip: string): Promise<VisitorGeo> {
  if (isPrivateIp(ip)) {
    return {};
  }

  const cached = geoCache.get(ip);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetchWithTimeout(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,countryCode,city,lat,lon`,
      { timeout: 4000 },
    );
    if (response.ok) {
      const data = (await response.json()) as {
        status: string;
        country?: string;
        countryCode?: string;
        city?: string;
        lat?: number;
        lon?: number;
      };
      const geo: VisitorGeo =
        data.status === "success"
          ? {
              country: data.country,
              countryCode: data.countryCode,
              city: data.city,
              lat: data.lat,
              lng: data.lon,
            }
          : {};
      geoCache.set(ip, geo);
      return geo;
    }
  } catch {
    // best-effort
  }

  const empty: VisitorGeo = {};
  geoCache.set(ip, empty);
  return empty;
}

export function clientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "";
  }
  return request.headers.get("x-real-ip")?.trim() ?? "";
}
