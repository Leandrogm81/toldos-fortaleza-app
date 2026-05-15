import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()

  const { count: pedidosMes } = await supabase
    .from('document')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'pedido')
    .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Visão geral da Toldos Fortaleza</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Pedidos do Mês</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{pedidosMes ?? 0}</p>
        </div>

        <Link href="/pedidos/novo" className="bg-sky-600 rounded-xl p-5 shadow-sm hover:bg-sky-700 transition-colors">
          <p className="text-sm font-medium text-sky-100">Novo Pedido</p>
          <p className="text-lg font-bold text-white mt-1">+ Criar Pedido</p>
        </Link>

        <Link href="/orcamentos/novo" className="bg-amber-600 rounded-xl p-5 shadow-sm hover:bg-amber-700 transition-colors">
          <p className="text-sm font-medium text-amber-100">Novo Orçamento</p>
          <p className="text-lg font-bold text-white mt-1">+ Criar Orçamento</p>
        </Link>

        <Link href="/agendamentos" className="bg-green-600 rounded-xl p-5 shadow-sm hover:bg-green-700 transition-colors">
          <p className="text-sm font-medium text-green-100">Agenda</p>
          <p className="text-lg font-bold text-white mt-1">Ver Agendamentos</p>
        </Link>
      </div>

      {/* Placeholder for future charts */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm text-center text-gray-400">
        <p className="text-lg font-medium">📊 Gráficos em breve</p>
        <p className="text-sm mt-1">Os dados aparecerão após criar pedidos e orçamentos</p>
      </div>
    </div>
  )
}
