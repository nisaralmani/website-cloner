export function formatUserAgentLabel(userAgent: string) {
  const ua = userAgent.trim();
  if (!ua || ua === "Unknown") return "Unknown";

  const okhttpMatch = ua.match(/okhttp\/([\d.]+)/i);
  if (okhttpMatch) {
    return `okhttp/${okhttpMatch[1]}`;
  }

  let browser = "Unknown";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/Chrome\//i.test(ua)) browser = "Chrome";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Safari\//i.test(ua)) browser = "Safari";

  let os = "Unknown";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS X|Macintosh/i.test(ua)) os = "macOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad/i.test(ua)) os = "iOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  return `${browser} (${os})`;
}
