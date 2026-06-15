import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

// 색상 상수
const CYAN = 'FF00B0F0'    // 헤더 라벨 배경 (하늘색)
const PINK = 'FFFFC7CE'    // 테이블 헤더 배경 (분홍)
const YELLOW = 'FFFFFF00'  // 진행중 배지
const GREEN = 'FFC6EFCE'   // 완료 배지
const LABEL_FONT = { bold: true, size: 9, name: '맑은 고딕' }
const VALUE_FONT = { size: 9, name: '맑은 고딕' }
const ALL_BORDER: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FF000000' } }
const BORDERS = { top: ALL_BORDER, left: ALL_BORDER, bottom: ALL_BORDER, right: ALL_BORDER }

function label(ws: ExcelJS.Worksheet, cell: string, text: string) {
  const c = ws.getCell(cell)
  c.value = text
  c.font = LABEL_FONT
  c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CYAN } }
  c.border = BORDERS
  c.alignment = { horizontal: 'center', vertical: 'middle' }
}

function value(ws: ExcelJS.Worksheet, cell: string, text: string | number) {
  const c = ws.getCell(cell)
  c.value = text
  c.font = VALUE_FONT
  c.border = BORDERS
  c.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: '권한 없음' }, { status: 403 })
  }

  const { id } = await params
  const order = await prisma.purchaseOrder.findUnique({
    where: { id: parseInt(id) },
    include: {
      qrCodes: {
        orderBy: { seq: 'asc' },
        include: { inspection: { include: { inspector: true } } },
      },
    },
  })
  if (!order) return NextResponse.json({ error: '없음' }, { status: 404 })

  const wb = new ExcelJS.Workbook()
  wb.creator = '월드와이드메모리(주)'
  const ws = wb.addWorksheet('매입검수', { pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true } })

  // ── 열 너비 설정 ──────────────────────────────────────────
  // A   B     C    D     E     F    G    H    I    J    K     L         M     N     O     P    Q    R    S    T    U
  // 순번 제조사 모델명 CPU  RAM  저장장치 VGA 크기 해상도 액정 키보드터치 배터리 특이사항 입고처 검수자 아답터 바라시 불량양품 등급 매입가
  // 헤더 테이블은 A~U (21컬럼)
  const colWidths = [5, 10, 14, 14, 10, 12, 12, 7, 10, 10, 10, 14, 20, 20, 10, 7, 7, 9, 6, 10]
  colWidths.forEach((w, i) => { ws.getColumn(i + 1).width = w })

  // ── 행 높이 ──────────────────────────────────────────────
  ws.getRow(1).height = 18
  ws.getRow(2).height = 18
  ws.getRow(3).height = 18
  ws.getRow(4).height = 18
  ws.getRow(5).height = 18

  // ── 상단 기본정보 (5행) ────────────────────────────────────
  // Row 1: 작성일 | val | 업체명 | val(merged) | 주민번호/사업자번호 | val(merged) | 진행여부
  label(ws, 'A1', '작성일')
  value(ws, 'B1', order.createdAt.toLocaleDateString('ko-KR'))
  label(ws, 'C1', '업체명')
  ws.mergeCells('D1:G1'); value(ws, 'D1', order.companyName)
  label(ws, 'H1', '주민번호 / 사업자번호')
  ws.mergeCells('I1:M1'); value(ws, 'I1', order.bizNumber)
  ws.mergeCells('N1:S1')
  ws.mergeCells('T1:U1')
  ws.getCell('T1').value = '진행여부'
  ws.getCell('T1').font = LABEL_FONT
  ws.getCell('T1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CYAN } }
  ws.getCell('T1').border = BORDERS
  ws.getCell('T1').alignment = { horizontal: 'center', vertical: 'middle' }

  // Row 2: 매입담당 | val | ERP사업자명 | val(merged) | 예금주 | val(merged) | 진행중(yellow)
  label(ws, 'A2', '매입담당')
  value(ws, 'B2', order.managerName)
  label(ws, 'C2', 'ERP 사업자 명')
  ws.mergeCells('D2:G2'); value(ws, 'D2', order.erpName)
  label(ws, 'H2', '예 금 주')
  ws.mergeCells('I2:S2'); value(ws, 'I2', order.depositor)
  ws.mergeCells('T2:U2')
  const statusValCell = ws.getCell('T2')
  statusValCell.value = order.status === 'DONE' ? '완료' : '진행중'
  statusValCell.font = { bold: true, size: 11, name: '맑은 고딕' }
  statusValCell.fill = {
    type: 'pattern', pattern: 'solid',
    fgColor: { argb: order.status === 'DONE' ? GREEN : YELLOW }
  }
  statusValCell.border = BORDERS
  statusValCell.alignment = { horizontal: 'center', vertical: 'middle' }

  // Row 3: 수량 | val | 연락처 | val(merged) | 은행 | val(merged)
  label(ws, 'A3', '수량')
  value(ws, 'B3', order.quantityDesc || `${order.quantity}대`)
  label(ws, 'C3', '연 락 처')
  ws.mergeCells('D3:G3'); value(ws, 'D3', order.contact)
  label(ws, 'H3', '은 행')
  ws.mergeCells('I3:U3'); value(ws, 'I3', order.bank)

  // Row 4: 입고일 | val(merged)
  label(ws, 'A4', '입고일')
  ws.mergeCells('B4:U4'); value(ws, 'B4', order.arrivalDate)

  // Row 5: 기타MEMO | val(merged) | 청구금액 | val | 계좌번호 | val(merged)
  label(ws, 'A5', '기타 MEMO')
  ws.mergeCells('B5:G5'); value(ws, 'B5', order.memo)
  label(ws, 'H5', '청 구 금 액')
  ws.mergeCells('I5:K5')
  const chargeCell = ws.getCell('I5')
  chargeCell.value = order.chargeAmount || '-'
  chargeCell.font = VALUE_FONT
  chargeCell.border = BORDERS
  chargeCell.alignment = { horizontal: 'right', vertical: 'middle' }
  label(ws, 'L5', '계 좌 번 호')
  ws.mergeCells('M5:U5'); value(ws, 'M5', order.accountNumber)

  // ── 빈 행 구분 ────────────────────────────────────────────
  ws.getRow(6).height = 4

  // ── 테이블 헤더 (Row 7) ────────────────────────────────────
  const tableHeaders = [
    '순번', '제조사', '모델명', 'CPU', 'RAM', '저장장치', 'VGA',
    '크기', '해상도', '액정', '키보드/터치', '배터리손실률\n*45%방전*',
    '특이사항', '입고처', '검수자', '아답터', '바라시', '불량/양품', '등급', '매입가',
  ]
  ws.getRow(7).height = 28
  const cols = 'ABCDEFGHIJKLMNOPQRSTU'.split('')
  tableHeaders.forEach((h, i) => {
    const c = ws.getCell(`${cols[i]}7`)
    c.value = h
    c.font = { bold: true, size: 8, name: '맑은 고딕' }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PINK } }
    c.border = BORDERS
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  })

  // ── 데이터 행 ─────────────────────────────────────────────
  order.qrCodes.forEach((qr, idx) => {
    const rowNum = 8 + idx
    const ins = qr.inspection
    const row = ws.getRow(rowNum)
    row.height = 30

    const dataArr = [
      idx + 1,                                          // 순번
      ins?.manufacturer ?? '',                          // 제조사
      ins?.model ?? '',                                 // 모델명
      ins?.cpu ?? '',                                   // CPU
      ins?.ram ?? '',                                   // RAM
      ins?.storage ?? '',                               // 저장장치
      ins?.vga ?? '',                                   // VGA
      ins?.screenSize ?? '',                            // 크기
      ins?.resolution ?? '',                            // 해상도
      ins?.lcdCondition ?? '',                          // 액정
      ins?.keyboardTouch ?? '',                         // 키보드/터치
      ins ? `${ins.batteryLossPct}%${ins.battery45Checked ? '\n(45%확인)' : ''}` : '',  // 배터리
      ins?.notes ?? '',                                 // 특이사항
      order.companyName,                                // 입고처
      ins?.inspector?.name ?? '',                       // 검수자
      ins ? (ins.adapter ? 'O' : 'X') : '',            // 아답터
      ins ? (ins.disassembled ? 'O' : 'X') : '',       // 바라시
      ins?.isStamped ? ({ MODEL:'모델', DEFECT:'불량', PARTS:'부품', GOOD:'양품' }[ins.defectStatus] ?? ins.defectStatus) : '',  // 판정
      ins?.grade ?? '',                                 // 등급
      ins?.purchasePrice ?? '',                         // 매입가
    ]

    dataArr.forEach((val, ci) => {
      const c = ws.getCell(`${cols[ci]}${rowNum}`)
      c.value = val
      c.font = { size: 9, name: '맑은 고딕' }
      c.border = BORDERS
      c.alignment = {
        horizontal: ci === 0 || ci >= 15 ? 'center' : 'left',
        vertical: 'middle',
        wrapText: true,
      }
      // 미검수 행 회색 배경
      if (!ins) {
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } }
      }
      // 불량 빨간 강조
      if (ci === 17 && ins?.defectStatus === 'DEFECT') {
        c.font = { ...c.font, bold: true, color: { argb: 'FFDC2626' } }
      }
    })
  })

  // ── 파일 생성 및 반환 ──────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer()
  const fileName = `매입검수_${order.companyName}_${new Date().toISOString().slice(0, 10)}.xlsx`

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    },
  })
}
