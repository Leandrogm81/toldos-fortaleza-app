import Link from 'next/link'

export default function ClientesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500 mt-1">Cadastro de clientes</p>
        </div>
        <Link
          href="/clientes/novo"
          className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 transition-colors"
        >
          + Novo Cliente
        </Link>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
        <p className="text-lg font-medium">Nenhum cliente cadastrado</p>
        <p className="text-sm mt-1">Cadastre seu primeiro cliente</p>
      </div>
    </div>
  )
}
