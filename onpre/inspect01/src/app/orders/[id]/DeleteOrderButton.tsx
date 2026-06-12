'use client'
import { deleteOrder } from '@/lib/actions/orders'

export default function DeleteOrderButton({ orderId }: { orderId: number }) {
  const action = deleteOrder.bind(null, orderId)
  return (
    <form
      action={action}
      onSubmit={e => {
        if (!confirm('이 매입건과 모든 검수 데이터를 완전히 삭제합니다.\n되돌릴 수 없습니다. 계속하시겠습니까?')) {
          e.preventDefault()
        }
      }}
    >
      <button
        type="submit"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm bg-red-600 hover:bg-red-700 text-white"
      >
        🗑 매입건 삭제
      </button>
    </form>
  )
}
