import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";

// 앱인토스 미니앱(WebView)은 다른 Origin에서 호출하므로 쿠키 대신 Bearer 토큰을 쓴다.
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "igenuguya-dev-secret-change-in-prod");

function allowedOrigins(): string[] {
  const app = process.env.MINIAPP_NAME ?? "igenuguya-miniapp";
  const list = [
    `https://${app}.apps.tossmini.com`,
    `https://${app}.private-apps.tossmini.com`,
    `https://${app}.web.tossmini.com`,
    `https://${app}.private-web.tossmini.com`,
  ];
  if (process.env.NODE_ENV !== "production") list.push("http://localhost:5173", "http://127.0.0.1:5173");
  return list;
}

export function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get("origin");
  const h: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
  if (origin && allowedOrigins().includes(origin)) h["Access-Control-Allow-Origin"] = origin;
  return h;
}

export function preflight(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export function json(req: NextRequest, body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: corsHeaders(req) });
}

export async function signMobileToken(userId: number): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience("miniapp")
    .setExpirationTime("30d")
    .sign(SECRET);
}

export async function getMobileUserId(req: NextRequest): Promise<number | null> {
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET, { audience: "miniapp" });
    return typeof payload.userId === "number" ? payload.userId : null;
  } catch {
    return null;
  }
}
