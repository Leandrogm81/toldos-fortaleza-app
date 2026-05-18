'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function ConversionRate() {
  const [rate, setRate] = useState<{ total: number; converted: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()

    // Orçamentos que tiveram visita de medição
    const { data: orcVisitas } = await supabase
      .from('appointment')
      .select('client_id')
      .eq('type', 'visita_medicao')
      .not('client_id', 'is', null)

    const clientesComVisita = [...new Set((orcVisitas || []).map((a) => a.client_id))]

    // Desses clientes, quantos têm pedido
    const { count: converted } = await supabase
      .from('document')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'pedido')
      .in('client_id', clientesComVisita.length > 0 ? clientesComVisita : ['none'])

    setRate({ total: clientesComVisita.length, converted: converted || 0 })
    setLoading(false)
  }

  if (loading) return <div className="h-32 flex items-center justify-center"><div className="animate-spin w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full" /></div>
  if (!rate || rate.total === 0) return <p className="text-sm text-gray-400 text-center py-4">Sem dados de conversão</p>

  const pct = Math.round((rate.converted / rate.total) * 100)

  return (
    <div className="text-center">
      <p className="text-3xl font-bold text-amber-600">{pct}%</p>
      <p className="text-sm text-gray-500 mt-1">{rate.converted} de {rate.total} clientes</p>
      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
        <div className="bg-amber-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-gray-400 mt-1">orçamentos com visita → pedidos</p>
    </div>
  )
}
