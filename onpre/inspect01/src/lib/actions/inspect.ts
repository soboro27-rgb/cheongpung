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
    defectStatus: (formData.get('defectStatus') as string) || 'GOOD',
    grade: (formData.get('grade') as string) || '',
    purchasePrice: parseInt(formData.get('purchasePrice') as string) || 0,
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
