'use client'
import { useRef, useState } from 'react'
import { createOrder } from '@/lib/actions/orders'
import Link from 'next/link'

export default function NewOrderForm() {
  const [rows, setRows] = useState<number[]>([1])
  const nextId = useRef(2)

  const addRow = () => {
    setRows(prev => [...prev, nextId.current++])
  }

  const removeRow = (id: number) => {
    if (rows.length <= 1) return
    setRows(prev => prev.filter(r => r !== id))
  }

  return (
    <form action={createOrder} className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="grid grid-cols-2 gap-4">
        <Field label="업체명 *" name="companyName" required placeholder="(주)삼성전자" />
        <Field label="ERP 사업자명" name="erpName" placeholder="ERP 상 업체명" />
        <Field label="사업자번호 / 주민번호" name="bizNumber" placeholder="000-00-00000" />
        <Field label="담당자명" name="managerName" placeholder="홍길동" />
        <Field label="연락처" name="contact" placeholder="010-0000-0000" />
        <Field label="수량 (텍스트 설명)" name="quantityDesc" placeholder="노트북 5대, 올인원 2대" />
        <Field label="입고일" name="arrivalDate" type="date" />
        <Field label="예금주" name="depositor" placeholder="예금주명" />
        <Field label="은행" name="bank" placeholder="국민은행" />
        <Field label="계좌번호" name="accountNumber" placeholder="000-000-000000" />
        <Field label="청구금액" name="chargeAmount" type="number" placeholder="0" />
        <div className="col-span-2">
          <label className="block text-xs font-bold text-slate-600 mb-1.5">기타 MEMO</label>
          <textarea name="memo" rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="기타 메모" />
        </div>

        <hr className="col-span-2 border-slate-200 my-2" />
        <div className="col-span-2 text-xs font-bold text-slate-500 uppercase tracking-wide">QR 생성 정보</div>

        <Field label="업체명 (영문 8자, QR용) *" name="vendorNameEn" required placeholder="samsung" />
        <Field label="담당자 성 (영문 2자, QR용) *" name="managerLastEn" required placeholder="ko (홍=ho, 김=ki...)" />

        {/* 수량은 행 개수로 자동 결정 */}
        <input type="hidden" name="quantity" value={rows.length} />

        <div className="col-span-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">
              QR 행 목록 <span className="text-blue-600 ml-1">총 {rows.length}개</span>
            </span>
            <button
              type="button"
              onClick={addRow}
              className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 font-bold border border-blue-200"
            >
              + 행 추가
            </button>
          </div>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2 text-left text-slate-500 font-bold w-14">No.</th>
                  <th className="px-3 py-2 text-left text-slate-400 font-normal">QR 코드 (저장 시 자동 생성)</th>
                  <th className="px-3 py-2 w-14"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((id, idx) => (
                  <tr key={id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-500 font-mono font-bold">{idx + 1}</td>
                    <td className="px-3 py-2 text-slate-300 italic">자동 생성</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeRow(id)}
                        disabled={rows.length <= 1}
                        className="text-red-400 hover:text-red-600 font-bold disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-lg text-sm">
          등록 + QR 생성 ({rows.length}개)
        </button>
        <Link href="/" className="border border-slate-300 text-slate-600 font-medium px-6 py-3 rounded-lg text-sm hover:bg-slate-50">
          취소
        </Link>
      </div>
    </form>
  )
}

function Field({ label, name, type = 'text', required = false, placeholder = '' }: {
  label: string; name: string; type?: string; required?: boolean; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-600 mb-1.5">{label}</label>
      <input
        type={type} name={name} required={required} placeholder={placeholder}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
      />
    </div>
  )
}
