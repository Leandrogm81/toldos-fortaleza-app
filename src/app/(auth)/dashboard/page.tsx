'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { ConversionRate } from '@/components/dashboard/ConversionRate'
import { WeeklyServices } from '@/components/dashboard/WeeklyServices'

export default function DashboardPage() {
  const [stats, setStats] = useState({ pedidos: 0, orcamentos: 0, agendamentos: 0, clientes: 0, faturamento: 0, vencidos: 0 })
  const [recentDocs, setRecentDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString()

    const [pedidos, orcamentos, appts, clientes, docs, allPedidos] = await Promise.all([
      supabase.from('document').select('*', { count: 'exact', head: true }).eq('type', 'pedido').gte('created_at', startOfMonth),
      supabase.from('document').select('*', { count: 'exact', head: true }).eq('type', 'orcamento').in('status', ['rascunho', 'enviado']),
      supabase.from('appointment').select('*', { count: 'exact', head: true }).gte('scheduled_at', startOfWeek),
      supabase.from('client').select('*', { count: 'exact', head: true }),
      supabase.from('document').select('id, type, status, date, doc_data').order('created_at', { ascending: false }).limit(8),
      supabase.from('document').select('doc_data, status, date').eq('type', 'pedido'),
    ])

    let fat = 0
    let venc = 0
    if (allPedidos.data) {
      for (const p of allPedidos.data) {
        if (['pago', 'instalado'].includes(p.status)) {
          fat += parseFloat((p.doc_data?.productValue || '').replace(/[^\d,]/g, '').replace(',', '.')) || 0
        }
        const delivery = p.doc_data?.deliveryTime || ''
        const date = p.date || ''
        const match = delivery.match(/^(\d+)\s*dias?$/i)
        if (match && date) {
          const parts = date.split('/')
          if (parts.length === 3) {
            const start = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
            const deadline = new Date(start.getTime() + parseInt(match[1]) * 24 * 60 * 60 * 1000)
            if (deadline.getTime() < now.getTime() && !['pago', 'instalado', 'cancelado'].includes(p.status)) venc++
          }
        }
      }
    }

    setStats({
      pedidos: pedidos.count || 0,
      orcamentos: orcamentos.count || 0,
      agendamentos: appts.count || 0,
      clientes: clientes.count || 0,
      faturamento: fat,
      vencidos: venc,
    })
    setRecentDocs(docs.data || [])
    setLoading(false)
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full" /></div>
  }

  const fatDisplay = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.faturamento)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Pedidos" value={stats.pedidos} sub="este mês" color="sky" href="/pedidos" />
        <KpiCard label="Orçamentos" value={stats.orcamentos} sub="pendentes" color="amber" href="/orcamentos" />
        <KpiCard label="Agenda" value={stats.agendamentos} sub="esta semana" color="green" href="/agendamentos" />
        <KpiCard label="Clientes" value={stats.clientes} sub="total" color="purple" href="/clientes" />
        <KpiCard label="Faturamento" value={fatDisplay} sub="pagos/instalados" color="emerald" href="/pedidos" valueClass="text-sm" />
        {stats.vencidos > 0 && (
          <Link href="/agendamentos?tab=prazos" className="bg-red-50 border border-red-200 rounded-xl p-3 flex flex-col justify-between hover:bg-red-100 transition-colors">
            <span className="text-xs font-medium text-red-600 uppercase">⚠️ Prazos</span>
            <p className="text-lg font-bold text-red-700 mt-1">{stats.vencidos} vencido{stats.vencidos > 1 ? 's' : ''}</p>
          </Link>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-4">
          <RevenueChart />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Taxa de Conversão</h3>
          <ConversionRate />
        </div>
      </div>

      {/* Weekly Services */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Instalações Concluídas (8 semanas)</h3>
        <WeeklyServices />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/pedidos/novo" className="flex items-center gap-2 p-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700">
          <span className="text-lg">+</span><span className="text-sm font-medium">Novo Pedido</span>
        </Link>
        <Link href="/orcamentos/novo" className="flex items-center gap-2 p-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700">
          <span className="text-lg">+</span><span className="text-sm font-medium">Novo Orçamento</span>
        </Link>
        <Link href="/clientes/novo" className="flex items-center gap-2 p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
          <span className="text-lg">+</span><span className="text-sm font-medium">Novo Cliente</span>
        </Link>
        <Link href="/agendamentos" className="flex items-center gap-2 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
          <span className="text-lg">📅</span><span className="text-sm font-medium">Agenda</span>
        </Link>
      </div>

      {/* Recent documents */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Documentos Recentes</h2>
        {recentDocs.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">Nenhum documento ainda.</p>
        ) : (
          <div className="space-y-1">
            {recentDocs.map((doc: any) => (
              <Link key={doc.id} href={`/${doc.type === 'pedido' ? 'pedidos' : 'orcamentos'}/${doc.id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 gap-1">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${doc.type === 'pedido' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                    {doc.type === 'pedido' ? 'Pedido' : 'Orçamento'}
                  </span>
                  <span className="text-sm text-gray-900 truncate">{doc.doc_data?.clientName || 'Sem nome'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 flex-shrink-0">
                  <span className="hidden sm:inline">{doc.date}</span>
                  <span>{doc.doc_data?.productValue || ''}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function KpiCard({ label, value, sub, color, href, valueClass }: { label: string; value: string | number; sub: string; color: string; href: string; valueClass?: string }) {
  const colors: Record<string, string> = {
    sky: 'border-sky-200 bg-sky-50 text-sky-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    green: 'border-green-200 bg-green-50 text-green-700',
    purple: 'border-purple-200 bg-purple-50 text-purple-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  }
  return (
    <Link href={href} className={`border rounded-xl p-3 flex flex-col justify-between hover:opacity-80 ${colors[color] || colors.sky}`}>
      <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      <div>
        <p className={`text-xl font-bold mt-1 ${valueClass || ''}`}>{value}</p>
        <p className="text-xs opacity-70">{sub}</p>
      </div>
    </Link>
  )
}
