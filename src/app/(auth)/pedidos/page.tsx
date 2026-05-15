import Link from 'next/link'

export default function PedidosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie os pedidos de compra</p>
        </div>
        <Link
          href="/pedidos/novo"
          className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 transition-colors"
        >
          + Novo Pedido
        </Link>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
        <p className="text-lg font-medium">Nenhum pedido ainda</p>
        <p className="text-sm mt-1">Crie seu primeiro pedido</p>
      </div>
    </div>
  )
}
