import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import QRCode from 'qrcode'
import LabelClient from './LabelClient'

export default async function LabelPage({
  params,
}: {
  params: Promise<{ id: string; qrId: string }>
}) {
  const { id, qrId } = await params
  const qr = await prisma.qRCode.findUnique({
    where: { id: parseInt(qrId) },
    include: {
      purchaseOrder: true,
      inspection: { include: { inspector: true } },
    },
  })
  if (!qr || !qr.inspection) notFound()

  const ins = qr.inspection
  const order = qr.purchaseOrder

  const qrImageUrl = await QRCode.toDataURL(qr.qrString, {
    width: 80,
    margin: 1,
    errorCorrectionLevel: 'M',
  })

  const labelData = {
    qrString: qr.qrString,
    seq: qr.seq,
    companyName: order.companyName,
    arrivalDate: order.arrivalDate,
    manufacturer: ins.manufacturer,
    model: ins.model,
    cpu: ins.cpu,
    ram: ins.ram,
    storage: ins.storage,
    vga: ins.vga,
    screenSize: ins.screenSize,
    resolution: ins.resolution,
    lcdCondition: ins.lcdCondition,
    keyboardTouch: ins.keyboardTouch,
    batteryLossPct: ins.batteryLossPct,
    battery45Checked: ins.battery45Checked,
    adapter: ins.adapter,
    disassembled: ins.disassembled,
    notes: ins.notes,
    defectStatus: ins.defectStatus,
    grade: ins.grade,
    purchasePrice: ins.purchasePrice,
    inspectorName: ins.inspector?.name ?? '',
    qrImageUrl,
    backUrl: `/orders/${id}`,
  }

  return <LabelClient data={labelData} />
}
