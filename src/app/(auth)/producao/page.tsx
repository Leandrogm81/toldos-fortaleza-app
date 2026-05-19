'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ConfirmDialog } from '@/components/layout/ConfirmDialog'

interface KanbanCard {
  id: string
  clientName: string
  date: string
  value: string
  item: string
  status: 'material' | 'fabricando' | 'pronto' | 'instalando' | 'concluido'
}

const COLUMNS: { id: KanbanCard['status']; label: string; color: string }[] = [
  { id: 'material', label: '📦 Material', color: 'bg-blue-100 text-blue-800' },
  { id: 'fabricando', label: '🔧 Fabricando', color: 'bg-amber-100 text-amber-800' },
  { id: 'pronto', label: '✅ Pronto', color: 'bg-green-100 text-green-800' },
  { id: 'instalando', label: '🚚 Instalando', color: 'bg-purple-100 text-purple-800' },
  { id: 'concluido', label: '✔️ Concluído', color: 'bg-gray-100 text-gray-800' },
]

export default function ProducaoPage() {
  const [cards, setCards] = useState<KanbanCard[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [confirmMove, setConfirmMove] = useState<{ card: KanbanCard; newStatus: KanbanCard['status'] } | null>(null)

  useEffect(() => { loadPedidos() }, [])

  async function loadPedidos() {
    const supabase = createClient()
    const { data } = await supabase
      .from('document')
      .select('id, date, doc_data, kanban_status')
      .eq('type', 'pedido')
      .order('created_at', { ascending: false })

    const loaded: KanbanCard[] = (data || []).map((doc: any) => ({
      id: doc.id,
      clientName: doc.doc_data?.clientName || 'Sem nome',
      date: doc.date || '',
      value: doc.doc_data?.productValue || '',
      item: doc.doc_data?.products?.[0]?.item || '',
      status: doc.kanban_status || 'material',
    }))
    setCards(loaded)
    setLoading(false)
  }

  function handleDragStart(id: string) {
    setDraggedId(id)
  }

  function handleDrop(status: KanbanCard['status']) {
    if (!draggedId) return
    const card = cards.find((c) => c.id === draggedId)
    if (!card || card.status === status) { setDraggedId(null); return }

    if (status === 'concluido') {
      setConfirmMove({ card, newStatus: status })
    } else {
      moveCard(card.id, status)
    }
    setDraggedId(null)
  }

  async function moveCard(id: string, status: KanbanCard['status']) {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)))
    const supabase = createClient()
    await supabase.from('document').update({ kanban_status: status }).eq('id', id)
  }

  function handleConfirmConcluido() {
    if (!confirmMove) return
    moveCard(confirmMove.card.id, confirmMove.newStatus)
    setConfirmMove(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Produção</h1>
        <p className="text-sm text-gray-500 mt-1">Arraste os cards entre colunas para atualizar o status</p>
      </div>

      {/* Kanban columns */}
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[70vh]">
        {COLUMNS.map((col) => {
          const colCards = cards.filter((c) => c.status === col.id)
          return (
            <div
              key={col.id}
              className="flex-shrink-0 w-72 bg-gray-100 rounded-xl p-3"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(col.id)}
            >
              {/* Column header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="font-semibold text-sm text-gray-700">{col.label}</h2>
                <span className="text-xs bg-gray-300 text-gray-700 px-2 py-0.5 rounded-full font-medium">
                  {colCards.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2">
                {colCards.map((card) => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={() => handleDragStart(card.id)}
                    className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Link href={`/pedidos/${card.id}`} className="font-medium text-sm text-gray-900 hover:text-sky-600 truncate">
                        {card.clientName}
                      </Link>
                    </div>
                    {card.item && (
                      <p className="text-xs text-gray-500 mb-1">{card.item}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">{card.date}</span>
                      {card.value && (
                        <span className="text-xs font-medium text-sky-700">{card.value}</span>
                      )}
                    </div>
                  </div>
                ))}

                {colCards.length === 0 && (
                  <div className="text-center py-8 text-sm text-gray-400">
                    Nenhum pedido
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <ConfirmDialog
        open={!!confirmMove}
        title="Marcar como concluído"
        message={`Deseja marcar "${confirmMove?.card.clientName}" como concluído? O status do pedido será atualizado.`}
        onConfirm={handleConfirmConcluido}
        onCancel={() => setConfirmMove(null)}
      />
    </div>
  )
}
