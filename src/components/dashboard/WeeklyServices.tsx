'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function WeeklyServices() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const weeks: { label: string; key: string; value: number }[] = []

    const now = new Date()
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 7)
      weeks.push({
        label: `Sem ${Math.ceil(d.getDate() / 7)}`,
        key: d.toISOString().slice(0, 10),
        value: 0,
      })
    }

    const { data: instalacoes } = await supabase
      .from('appointment')
      .select('scheduled_at')
      .eq('type', 'instalacao')
      .eq('status', 'concluido')
      .gte('scheduled_at', new Date(now.getFullYear(), now.getMonth(), now.getDate() - 56).toISOString())

    if (instalacoes) {
      for (const inst of instalacoes) {
        const d = new Date(inst.scheduled_at)
        for (const w of weeks) {
          const wd = new Date(w.key)
          if (d >= wd && d < new Date(wd.getTime() + 7 * 24 * 60 * 60 * 1000)) {
            w.value++
            break
          }
        }
      }
    }

    setData(weeks)
    setLoading(false)
  }

  if (loading) return <div className="h-48 flex items-center justify-center"><div className="animate-spin w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full" /></div>
  if (data.every((d) => d.value === 0)) return <p className="text-sm text-gray-400 text-center py-4">Sem serviços concluídos</p>

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#9ca3af" />
        <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
        <Tooltip
          formatter={(value) => [`${value ?? 0} serviços`, 'Concluídos']}
          contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 }}
        />
        <Bar dataKey="value" fill="#16a34a" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
