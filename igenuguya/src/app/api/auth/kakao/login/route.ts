import { NextResponse } from "next/server";
import { getKakaoAuthUrl } from "@/lib/kakao";

export function GET() {
  return NextResponse.redirect(getKakaoAuthUrl());
}
