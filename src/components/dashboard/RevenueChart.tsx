'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function RevenueChart() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const months: { label: string; index: number; value: number }[] = []
    const now = new Date()

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        label: d.toLocaleDateString('pt-BR', { month: 'short' }),
        index: d.getMonth(),
        value: 0,
      })
    }

    const { data: pedidos } = await supabase
      .from('document')
      .select('total_value, created_at')
      .eq('type', 'pedido')
      .in('status', ['pago', 'instalado'])
      .gte('created_at', new Date(now.getFullYear(), months[0].index, 1).toISOString())

    let sum = 0
    if (pedidos) {
      for (const p of pedidos) {
        const m = new Date(p.created_at).getMonth()
        const entry = months.find((x) => x.index === m)
        if (entry) { entry.value += p.total_value || 0; sum += p.total_value || 0 }
      }
    }

    setData(months)
    setTotal(sum)
    setLoading(false)
  }

  if (loading) return <div className="h-64 flex items-center justify-center"><div className="animate-spin w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700">Faturamento Mensal</h3>
        <span className="text-sm font-bold text-sky-700">
          Total: R$ {total.toLocaleString('pt-BR')}
        </span>
      </div>
      {data.every((d) => d.value === 0) ? (
        <p className="text-sm text-gray-400 text-center py-8">Sem dados de faturamento</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#9ca3af" />
            <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v) => `R$${v}`} />
            <Tooltip formatter={(value) => [`R$ ${Number(value ?? 0).toLocaleString('pt-BR')}`, 'Faturamento']} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
            <Bar dataKey="value" fill="#0284c7" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
