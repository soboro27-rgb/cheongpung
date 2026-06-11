export function makeQrString(
  purchaseDate: Date,
  vendorNameEn: string,
  managerLastEn: string,
  seq: number
): string {
  const year = purchaseDate.getFullYear()
  const mm = String(purchaseDate.getMonth() + 1).padStart(2, '0')
  const dd = String(purchaseDate.getDate()).padStart(2, '0')
  const datePart = `${year}_${mm}${dd}`
  const vendorPart = vendorNameEn.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 8)
  const managerPart = managerLastEn.replace(/[^a-zA-Z]/g, '').toLowerCase().slice(0, 2)
  return `${datePart}_${vendorPart}_${managerPart}_${String(seq).padStart(3, '0')}`
}
