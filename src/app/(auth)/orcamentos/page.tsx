import Link from 'next/link'

export default function OrcamentosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie os orçamentos</p>
        </div>
        <Link
          href="/orcamentos/novo"
          className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
        >
          + Novo Orçamento
        </Link>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
        <p className="text-lg font-medium">Nenhum orçamento ainda</p>
        <p className="text-sm mt-1">Crie seu primeiro orçamento</p>
      </div>
    </div>
  )
}
