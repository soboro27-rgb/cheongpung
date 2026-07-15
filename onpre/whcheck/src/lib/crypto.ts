import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

const KEY_HEX = process.env.PII_ENCRYPTION_KEY ?? "";
function getKey(): Buffer {
  if (!KEY_HEX || KEY_HEX.length < 64)
    throw new Error("PII_ENCRYPTION_KEY must be 64 hex chars (32 bytes)");
  return Buffer.from(KEY_HEX, "hex");
}

export function encryptPII(plain: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("hex"), tag.toString("hex"), encrypted.toString("hex")].join(":");
}

export function decryptPII(encoded: string): string {
  const key = getKey();
  const [ivHex, tagHex, dataHex] = encoded.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const data = Buffer.from(dataHex, "hex");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data).toString("utf8") + decipher.final("utf8");
}

export function hashPhone(phone: string): string {
  const normalized = phone.replace(/\D/g, "");
  return createHash("sha256")
    .update(normalized + (process.env.PHONE_HASH_SALT ?? "whcheck"))
    .digest("hex");
}

export function maskPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length === 11) return `${d.slice(0, 3)}-****-${d.slice(7)}`;
  return "***-****-" + d.slice(-4);
}
