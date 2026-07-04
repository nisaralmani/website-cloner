export function clientIpFromRequest(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "127.0.0.1";
}

export function clientUserAgentFromRequest(request: Request) {
  return request.headers.get("user-agent")?.trim() || "Unknown";
}

export function clientCountryFromRequest(_request: Request) {
  return "Pakistan";
}

export function clientMetaFromRequest(request: Request) {
  return {
    ipAddress: clientIpFromRequest(request),
    userAgent: clientUserAgentFromRequest(request),
    country: clientCountryFromRequest(request),
  };
}
