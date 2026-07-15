/**
 * Generic at-rest encryption for secret-ish settings fields (e.g. SMTP/IMAP
 * passwords) stored as plain workspace_settings rows. Keyed off SESSION_SECRET
 * so no extra secret needs to be provisioned.
 */
import crypto from "crypto";

const ENC_PREFIX = "enc:v1:";

function encryptionKey(): Buffer {
  const secret = process.env.SESSION_SECRET || "bybelt-dev-secret-change-me";
  return crypto.scryptSync(secret, "bybelt-field-secret-salt", 32);
}

export function encryptSecretField(plain: string): string {
  if (!plain) return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ENC_PREFIX + Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptSecretField(stored: string): string {
  if (!stored) return "";
  if (!stored.startsWith(ENC_PREFIX)) return stored;
  try {
    const raw = Buffer.from(stored.slice(ENC_PREFIX.length), "base64");
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const data = raw.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return "";
  }
}
