import { createOrder } from '@/lib/actions/orders'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import Navbar from '@/app/components/Navbar'
import Link from 'next/link'

export default async function NewOrderPage() {
  const session = await getSession()
  if (session?.role !== 'ADMIN') redirect('/')

  return (
    <div className="min-h-screen" style={{ background: '#F1F5F9' }}>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-slate-400 hover:text-slate-600 text-sm">← 목록</Link>
          <h1 className="text-xl font-black text-slate-900">신규 매입건 등록</h1>
        </div>

        <form action={createOrder} className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="grid grid-cols-2 gap-4">
            <Field label="업체명 *" name="companyName" required placeholder="(주)삼성전자" />
            <Field label="ERP 사업자명" name="erpName" placeholder="ERP 상 업체명" />
            <Field label="사업자번호 / 주민번호" name="bizNumber" placeholder="000-00-00000" />
            <Field label="담당자명" name="managerName" placeholder="홍길동" />
            <Field label="연락처" name="contact" placeholder="010-0000-0000" />
            <Field label="수량 (텍스트)" name="quantityDesc" placeholder="노트북 5대, 올인원 2대" />
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
            <Field label="수량 (QR 생성 수) *" name="quantity" type="number" required placeholder="5" />
          </div>

          <div className="mt-6 flex gap-3">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-lg text-sm">
              등록 + QR 생성
            </button>
            <Link href="/" className="border border-slate-300 text-slate-600 font-medium px-6 py-3 rounded-lg text-sm hover:bg-slate-50">
              취소
            </Link>
          </div>
        </form>
      </main>
    </div>
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
