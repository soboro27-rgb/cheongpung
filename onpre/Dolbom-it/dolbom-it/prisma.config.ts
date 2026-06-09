import { defineConfig } from "prisma/config";

// Prisma's Rust URL parser is strict about RFC 3986 — special chars in
// passwords (e.g. +, =, /) must be percent-encoded. pg is lenient but Prisma isn't.
function encodeDbUrl(raw: string): string {
  if (!raw) return raw;

  const schemeMatch = raw.match(/^(postgresql?:\/\/)/);
  if (!schemeMatch) return raw;

  const scheme = schemeMatch[1];
  const withoutScheme = raw.slice(scheme.length);

  // Use lastIndexOf so passwords containing '@' are handled correctly
  const lastAt = withoutScheme.lastIndexOf("@");
  if (lastAt === -1) return raw;

  const userinfo = withoutScheme.slice(0, lastAt);
  const hostAndDb = withoutScheme.slice(lastAt + 1);

  const colonIdx = userinfo.indexOf(":");
  if (colonIdx === -1) return raw;

  const user = userinfo.slice(0, colonIdx);
  const password = userinfo.slice(colonIdx + 1);

  // Decode first to avoid double-encoding, then re-encode
  let encodedPassword: string;
  try {
    encodedPassword = encodeURIComponent(decodeURIComponent(password));
  } catch {
    encodedPassword = encodeURIComponent(password);
  }

  return `${scheme}${encodeURIComponent(user)}:${encodedPassword}@${hostAndDb}`;
}

const url = encodeDbUrl(process.env.DATABASE_URL ?? "");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url,
  },
});
