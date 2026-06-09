"use server"
import { signIn } from "@/lib/auth"
import { AuthError } from "next-auth"

export async function loginAction(email: string): Promise<{ error?: string }> {
  try {
    await signIn("credentials", {
      email,
      password: "",
      redirectTo: "/swipe",
    })
    return {}
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "등록되지 않은 이메일입니다" }
    }
    throw e
  }
}
