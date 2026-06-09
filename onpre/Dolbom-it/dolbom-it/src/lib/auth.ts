import NextAuth from "next-auth"
import KakaoProvider from "next-auth/providers/kakao"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export type Role = "PARENT" | "CAREGIVER" | "ADMIN"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID ?? "dev",
      clientSecret: process.env.KAKAO_CLIENT_SECRET ?? "dev",
    }),
  ],
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id
      session.user.role = (user as unknown as { role: Role }).role ?? "PARENT"
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
})
