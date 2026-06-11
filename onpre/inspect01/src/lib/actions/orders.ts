'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { makeQrString } from '@/lib/qr'

export async function createOrder(formData: FormData) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') throw new Error('권한 없음')

  const arrivalDate = formData.get('arrivalDate') as string
  const vendorNameEn = (formData.get('vendorNameEn') as string).trim()
  const managerLastEn = (formData.get('managerLastEn') as string).trim()
  const quantity = parseInt(formData.get('quantity') as string) || 1

  const order = await prisma.purchaseOrder.create({
    data: {
      companyName: formData.get('companyName') as string,
      erpName: (formData.get('erpName') as string) || '',
      bizNumber: (formData.get('bizNumber') as string) || '',
      managerName: (formData.get('managerName') as string) || '',
      contact: (formData.get('contact') as string) || '',
      quantityDesc: (formData.get('quantityDesc') as string) || '',
      arrivalDate,
      depositor: (formData.get('depositor') as string) || '',
      bank: (formData.get('bank') as string) || '',
      accountNumber: (formData.get('accountNumber') as string) || '',
      chargeAmount: parseInt(formData.get('chargeAmount') as string) || 0,
      memo: (formData.get('memo') as string) || '',
      vendorNameEn,
      managerLastEn,
      quantity,
      createdById: session.userId,
    },
  })

  const date = arrivalDate ? new Date(arrivalDate) : new Date()
  await Promise.all(
    Array.from({ length: quantity }, (_, i) =>
      prisma.qRCode.create({
        data: {
          qrString: makeQrString(date, vendorNameEn, managerLastEn, i + 1),
          seq: i + 1,
          purchaseOrderId: order.id,
        },
      })
    )
  )

  redirect(`/orders/${order.id}`)
}

export async function completeOrder(orderId: number) {
  const session = await getSession()
  if (!session) throw new Error('권한 없음')
  await prisma.purchaseOrder.update({ where: { id: orderId }, data: { status: 'DONE' } })
  revalidatePath(`/orders/${orderId}`)
}
