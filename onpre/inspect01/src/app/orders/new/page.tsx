import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import Navbar from '@/app/components/Navbar'
import Link from 'next/link'
import NewOrderForm from './NewOrderForm'

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
        <NewOrderForm />
      </main>
    </div>
  )
}
