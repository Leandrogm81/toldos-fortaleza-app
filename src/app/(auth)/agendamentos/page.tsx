'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// --- Types ---
type ApptType = 'visita_medicao' | 'instalacao' | 'reparo' | 'pos_venda' | 'outro'
type ApptStatus = 'agendado' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado'

const TYPE_LABELS: Record<ApptType, string> = {
  visita_medicao: 'Visita de Medição',
  instalacao: 'Instalação',
  reparo: 'Reparo',
  pos_venda: 'Pós-Venda',
  outro: 'Outro',
}
const TYPE_COLORS: Record<ApptType, string> = {
  visita_medicao: '#2563eb',
  instalacao: '#16a34a',
  reparo: '#ea580c',
  pos_venda: '#9333ea',
  outro: '#6b7280',
}

// --- Helpers ---
function parseDeliveryDeadline(deliveryTime: string | undefined): { date: Date | null; days: number | null } {
  if (!deliveryTime) return { date: null, days: null }
  const match = deliveryTime.match(/^(\d+)\s*dias?$/i)
  if (match) return { date: null, days: parseInt(match[1]) }
  const dateMatch = deliveryTime.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (dateMatch) {
    const [_, d, m, y] = dateMatch
    return { date: new Date(`${y}-${m}-${d}`), days: null }
  }
  return { date: null, days: null }
}

function getDeadlineStatus(deadline: Date | null): 'vencido' | 'hoje' | 'amanha' | '3dias' | '7dias' | 'ok' {
  if (!deadline) return 'ok'
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diff = deadline.getTime() - now.getTime()
  const diffDays = diff / (1000 * 60 * 60 * 24)
  if (diffDays < 0) return 'vencido'
  if (diffDays === 0) return 'hoje'
  if (diffDays <= 1) return 'amanha'
  if (diffDays <= 3) return '3dias'
  if (diffDays <= 7) return '7dias'
  return 'ok'
}

const DEADLINE_COLORS: Record<string, string> = {
  vencido: 'bg-red-600',
  hoje: 'bg-red-500',
  amanha: 'bg-orange-500',
  '3dias': 'bg-yellow-500',
  '7dias': 'bg-blue-400',
  ok: 'bg-green-500',
}

// --- Main Page ---
export default function AgendamentosPage() {
  const [appts, setAppts] = useState<any[]>([])
  const [deadlineOrders, setDeadlineOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '', type: 'visita_medicao' as ApptType, client_id: '', document_id: '',
    scheduled_at: '', duration_min: 60, status: 'agendado' as ApptStatus, notes: '',
  })
  const [clients, setClients] = useState<any[]>([])
  const [tab, setTab] = useState<'calendario' | 'prazos'>('calendario')
  const supabase = createClient()

  // --- Load Data ---
  const loadAll = useCallback(async () => {
    const [apptsRes, docsRes, clientsRes] = await Promise.all([
      supabase.from('appointment').select('*, client:client_id(name, phone), document:document_id(type)').order('scheduled_at', { ascending: true }).limit(100),
      supabase.from('document').select('*').eq('type', 'pedido').not('doc_data->>deliveryTime', 'is', null).order('created_at', { ascending: false }).limit(50),
      supabase.from('client').select('id, name, phone').order('name'),
    ])
    setAppts(apptsRes.data || [])
    setClients(clientsRes.data || [])

    // Process deadlines
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const orders = (docsRes.data || []).map((doc: any) => {
      const delivery = doc.doc_data?.deliveryTime || ''
      const date = doc.doc_data?.date || ''
      const { date: specDate, days } = parseDeliveryDeadline(delivery)
      let deadline: Date | null = null
      if (specDate) {
        deadline = specDate
      } else if (days !== null && date) {
        const parts = date.split('/')
        if (parts.length === 3) {
          const start = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
          deadline = new Date(start.getTime() + days * 24 * 60 * 60 * 1000)
        }
      }
      const status = getDeadlineStatus(deadline)
      return { ...doc, deadline, status, clientName: doc.doc_data?.clientName || 'Sem nome' }
    }).filter((o: any) => o.status !== 'ok' || o.deadline)

    // Sort: vencidos first, then by proximity
    const order: Record<string, number> = { vencido: 0, hoje: 1, amanha: 2, '3dias': 3, '7dias': 4, ok: 5 }
    orders.sort((a: any, b: any) => (order[a.status] || 5) - (order[b.status] || 5))
    setDeadlineOrders(orders)

    setLoading(false)
  }, [supabase])

  useEffect(() => { loadAll() }, [loadAll])

  // --- Notifications ---
  useEffect(() => {
    if (!('Notification' in window)) return
    if (Notification.permission === 'granted') return
    if (Notification.permission === 'denied') return
    // Request permission on first visit
    const timer = setTimeout(() => Notification.requestPermission(), 3000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (deadlineOrders.length === 0) return
    if (!('Notification' in window) || Notification.permission !== 'granted') return

    const vencidos = deadlineOrders.filter((o: any) => o.status === 'vencido')
    const criticos = deadlineOrders.filter((o: any) => ['hoje', 'amanha'].includes(o.status))

    if (vencidos.length > 0) {
      new Notification('⚠️ Pedidos Vencidos!', {
        body: `${vencidos.length} pedido(s) passaram do prazo de entrega.`,
        icon: '/logo_fortaleza.png',
        tag: 'prazo-vencido',
      })
    }
    if (criticos.length > 0) {
      new Notification('⏰ Prazos Críticos', {
        body: `${criticos.length} pedido(s) vencem hoje ou amanhã.`,
        icon: '/logo_fortaleza.png',
        tag: 'prazo-critico',
      })
    }
  }, [deadlineOrders])

  // --- Appt CRUD ---
  async function handleSaveAppt(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.scheduled_at) { alert('Preencha título e data.'); return }
    const data = {
      ...form,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      client_id: form.client_id || null,
      document_id: form.document_id || null,
    }
    if (editingId) {
      await supabase.from('appointment').update(data).eq('id', editingId)
    } else {
      await supabase.from('appointment').insert(data)
    }
    setShowModal(false)
    setEditingId(null)
    setForm({ title: '', type: 'visita_medicao', client_id: '', document_id: '', scheduled_at: '', duration_min: 60, status: 'agendado', notes: '' })
    loadAll()
  }

  function openEdit(appt: any) {
    setEditingId(appt.id)
    setForm({
      title: appt.title, type: appt.type, client_id: appt.client_id || '',
      document_id: appt.document_id || '',
      scheduled_at: appt.scheduled_at ? new Date(appt.scheduled_at).toISOString().slice(0, 16) : '',
      duration_min: appt.duration_min || 60, status: appt.status, notes: appt.notes || '',
    })
    setShowModal(true)
  }

  function openNew() {
    setEditingId(null)
    setForm({ title: '', type: 'visita_medicao', client_id: '', document_id: '', scheduled_at: '', duration_min: 60, status: 'agendado', notes: '' })
    setShowModal(true)
  }

  async function changeStatus(id: string, newStatus: ApptStatus) {
    await supabase.from('appointment').update({ status: newStatus }).eq('id', id)
    loadAll()
  }

  async function deleteAppt(id: string) {
    if (!confirm('Excluir este agendamento?')) return
    await supabase.from('appointment').delete().eq('id', id)
    loadAll()
  }

  // --- Render ---
  const formatDate = (d: string) => {
    if (!d) return ''
    try { return new Date(d).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) } catch { return d }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full" /></div>
  }

  const todayAppts = appts.filter((a: any) => {
    try {
      const d = new Date(a.scheduled_at)
      const today = new Date()
      return d.toDateString() === today.toDateString()
    } catch { return false }
  })

  const futureAppts = appts.filter((a: any) => {
    try { return new Date(a.scheduled_at) > new Date() && new Date(a.scheduled_at).toDateString() !== new Date().toDateString() } catch { return false }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>
          <p className="text-sm text-gray-500 mt-1">
            {appts.length} agendamento(s) 
            {deadlineOrders.length > 0 && (
              <span className="ml-2 text-red-600 font-medium">
                ⚠️ {deadlineOrders.filter((o: any) => o.status === 'vencido').length} vencido(s)
              </span>
            )}
          </p>
        </div>
        <button onClick={openNew} className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700">
          + Novo Agendamento
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(['calendario', 'prazos'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'calendario' ? '📅 Calendário' : '⏰ Prazos'}
          </button>
        ))}
      </div>

      {/* Tab: Calendário */}
      {tab === 'calendario' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hoje */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h2 className="font-semibold text-gray-900 mb-3">📌 Hoje — {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</h2>
              {todayAppts.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">Nenhum agendamento para hoje</p>
              ) : (
                <div className="space-y-2">
                  {todayAppts.map((a: any) => (
                    <ApptCard key={a.id} appt={a} onStatus={changeStatus} onEdit={openEdit} onDelete={deleteAppt} formatDate={formatDate} />
                  ))}
                </div>
              )}
            </div>

            {/* Futuros */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h2 className="font-semibold text-gray-900 mb-3">📅 Próximos Agendamentos</h2>
              {futureAppts.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">Nenhum agendamento futuro</p>
              ) : (
                <div className="space-y-2">
                  {futureAppts.slice(0, 10).map((a: any) => (
                    <ApptCard key={a.id} appt={a} onStatus={changeStatus} onEdit={openEdit} onDelete={deleteAppt} formatDate={formatDate} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Passados */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h2 className="font-semibold text-gray-900 mb-3">✅ Concluídos Recentes</h2>
              {appts.filter((a: any) => a.status === 'concluido').slice(0, 8).map((a: any) => (
                <div key={a.id} className="text-xs text-gray-600 py-1 border-b border-gray-100 last:border-0 flex justify-between">
                  <span>{a.title}</span>
                  <span className="text-gray-400">{formatDate(a.scheduled_at)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Prazos */}
      {tab === 'prazos' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">⏰ Prazos de Entrega</h2>
              <p className="text-xs text-gray-500 mt-0.5">Pedidos com prazo próximo ou vencido</p>
            </div>
            {deadlineOrders.length === 0 ? (
              <p className="text-sm text-gray-400 py-12 text-center">✅ Nenhum pedido com prazo crítico!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100 text-left text-xs text-gray-500 uppercase">
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Cliente</th>
                    <th className="px-4 py-2 hidden sm:table-cell">Data Pedido</th>
                    <th className="px-4 py-2 hidden sm:table-cell">Prazo</th>
                    <th className="px-4 py-2">Vencimento</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {deadlineOrders.map((o: any) => (
                      <tr key={o.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${o.status === 'vencido' ? 'bg-red-100 text-red-800' : o.status === 'hoje' ? 'bg-red-50 text-red-700' : o.status === 'amanha' ? 'bg-orange-50 text-orange-700' : o.status === '3dias' ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${DEADLINE_COLORS[o.status]}`} />
                            {o.status === 'vencido' ? 'VENCIDO' : o.status === 'hoje' ? 'HOJE' : o.status === 'amanha' ? 'AMANHÃ' : o.status === '3dias' ? '3 DIAS' : '7 DIAS'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">{o.clientName}</td>
                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{o.date}</td>
                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{o.doc_data?.deliveryTime || '-'}</td>
                        <td className="px-4 py-3 text-gray-500">{o.deadline ? o.deadline.toLocaleDateString('pt-BR') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">{editingId ? 'Editar Agendamento' : 'Novo Agendamento'}</h2>
            <form onSubmit={handleSaveAppt} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Ex: Medição - João Silva" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ApptType })} className="w-full px-3 py-2 border rounded-lg text-sm">
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ApptStatus })} className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="agendado">Agendado</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="concluido">Concluído</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data e Hora *</label>
                <input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} required className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duração (minutos)</label>
                <select value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg text-sm">
                  {[30, 60, 90, 120, 180, 240].map((m) => (<option key={m} value={m}>{m} min{m >= 60 ? ` (${m/60}h${m%60 > 0 ? m%60+'min' : ''})` : ''}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">Nenhum</option>
                  {clients.map((c: any) => (<option key={c.id} value={c.id}>{c.name} — {c.phone}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
                <button type="submit" className="px-6 py-2 text-sm text-white bg-sky-600 rounded-lg hover:bg-sky-700">{editingId ? 'Atualizar' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// --- Sub-component ---
function ApptCard({ appt, onStatus, onEdit, onDelete, formatDate }: { appt: any; onStatus: (id: string, s: ApptStatus) => void; onEdit: (a: any) => void; onDelete: (id: string) => void; formatDate: (d: string) => string }) {
  return (
    <div className="flex items-start justify-between p-3 rounded-lg border border-gray-200 hover:border-gray-300 bg-gray-50/50" style={{ borderLeft: `4px solid ${TYPE_COLORS[appt.type as ApptType] || '#6b7280'}` }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm text-gray-900">{appt.title}</p>
          <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: TYPE_COLORS[appt.type as ApptType] + '20', color: TYPE_COLORS[appt.type as ApptType] }}>
            {TYPE_LABELS[appt.type as ApptType] || appt.type}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          {formatDate(appt.scheduled_at)} · {appt.duration_min}min
          {appt.client?.name && ` · ${appt.client.name}`}
        </p>
        {appt.notes && <p className="text-xs text-gray-400 mt-1 italic">{appt.notes}</p>}
      </div>
      <div className="flex items-center gap-1 ml-3 flex-shrink-0">
        {appt.status !== 'concluido' && appt.status !== 'cancelado' && (
          <button onClick={() => onStatus(appt.id, 'concluido')} title="Concluir" className="p-1.5 text-green-600 hover:bg-green-50 rounded">✓</button>
        )}
        <button onClick={() => onEdit(appt)} title="Editar" className="p-1.5 text-gray-500 hover:bg-gray-100 rounded">✎</button>
        <button onClick={() => onDelete(appt.id)} title="Excluir" className="p-1.5 text-red-500 hover:bg-red-50 rounded">✕</button>
      </div>
    </div>
  )
}
