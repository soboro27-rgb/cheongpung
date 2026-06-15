'use server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function saveInspection(qrId: number, orderId: number, formData: FormData) {
  const session = await getSession()
  if (!session) throw new Error('권한 없음')

  const existing = await prisma.inspection.findUnique({ where: { qrId } })
  if (existing && existing.inspectorId !== Number(session.userId)) {
    redirect(`/orders/${orderId}?locked=1`)
  }

  const data = {
    manufacturer: (formData.get('manufacturer') as string) || '',
    model: (formData.get('model') as string) || '',
    cpu: (formData.get('cpu') as string) || '',
    ram: (formData.get('ram') as string) || '',
    storage: (formData.get('storage') as string) || '',
    vga: (formData.get('vga') as string) || '',
    screenSize: (formData.get('screenSize') as string) || '',
    resolution: (formData.get('resolution') as string) || '',
    lcdCondition: (formData.get('lcdCondition') as string) || '',
    keyboardTouch: (formData.get('keyboardTouch') as string) || '',
    batteryLossPct: parseFloat(formData.get('batteryLossPct') as string) || 0,
    battery45Checked: formData.get('battery45Checked') === 'on',
    notes: (formData.get('notes') as string) || '',
    adapter: formData.get('adapter') === 'O',
    disassembled: formData.get('disassembled') === 'O',
    inspectorId: session.userId,
    inspectedAt: new Date(),
  }

  await prisma.inspection.upsert({
    where: { qrId },
    create: { qrId, ...data },
    update: data,
  })

  await prisma.qRCode.update({ where: { id: qrId }, data: { isInspected: true } })

  redirect(`/orders/${orderId}`)
}

export async function saveStamping(qrId: number, orderId: number, formData: FormData) {
  const session = await getSession()
  if (!session) throw new Error('권한 없음')
  if (session.role !== 'FINAL_INSPECTOR' && session.role !== 'ADMIN') {
    redirect(`/orders/${orderId}?noauth=1`)
  }

  const existing = await prisma.inspection.findUnique({ where: { qrId } })
  if (!existing) throw new Error('1차 검수 데이터가 없습니다')

  await prisma.inspection.update({
    where: { qrId },
    data: {
      defectStatus: (formData.get('defectStatus') as string) || 'MODEL',
      grade: (formData.get('grade') as string) || '',
      purchasePrice: parseInt(formData.get('purchasePrice') as string) || 0,
      isStamped: true,
      stampedAt: new Date(),
      stampedById: session.userId,
    },
  })

  redirect(`/orders/${orderId}`)
}
