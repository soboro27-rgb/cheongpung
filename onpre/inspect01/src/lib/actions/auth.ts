'use server'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSession, deleteSession } from '@/lib/session'

export async function login(formData: FormData) {
  const loginId = formData.get('loginId') as string
  const password = formData.get('password') as string

  const user = await prisma.user.findUnique({ where: { loginId } })
  if (!user || !user.isActive) return { error: '아이디 또는 비밀번호가 올바르지 않습니다.' }

  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return { error: '아이디 또는 비밀번호가 올바르지 않습니다.' }

  await createSession({ userId: user.id, loginId: user.loginId, name: user.name, role: user.role })
  redirect('/')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}
