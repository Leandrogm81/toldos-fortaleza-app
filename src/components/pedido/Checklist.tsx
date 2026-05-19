'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ConfirmDialog } from '@/components/layout/ConfirmDialog'

interface ChecklistItem {
  id: string
  text: string
  checked: boolean
  isCustom?: boolean
}

interface ChecklistProps {
  documentId: string
}

const DEFAULT_ITEMS: ChecklistItem[] = [
  { id: '1', text: 'Material separado e conferido', checked: false },
  { id: '2', text: 'Medidas conferidas com o pedido', checked: false },
  { id: '3', text: 'Ferramentas OK (furadeira, parafusadeira, nível, escada)', checked: false },
  { id: '4', text: 'Equipe confirmada', checked: false },
  { id: '5', text: 'Endereço do cliente verificado no mapa', checked: false },
  { id: '6', text: 'Horário combinado com o cliente', checked: false },
]

const CONCLUSION_ITEMS: ChecklistItem[] = [
  { id: 'c1', text: 'Serviço instalado conforme medidas', checked: false },
  { id: 'c2', text: 'Teste de vedação (se aplicável)', checked: false },
  { id: 'c3', text: 'Limpeza do local', checked: false },
  { id: 'c4', text: 'Cliente aprovou', checked: false },
]

export function Checklist({ documentId }: ChecklistProps) {
  const [preChecklist, setPreChecklist] = useState<ChecklistItem[]>(DEFAULT_ITEMS.map(i => ({ ...i, checked: false })))
  const [postChecklist, setPostChecklist] = useState<ChecklistItem[]>(CONCLUSION_ITEMS.map(i => ({ ...i, checked: false })))
  const [showPost, setShowPost] = useState(false)
  const [customText, setCustomText] = useState('')
  const [targetList, setTargetList] = useState<'pre' | 'post'>('pre')
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [completed, setCompleted] = useState(false)

  useEffect(() => { loadSaved() }, [documentId])

  async function loadSaved() {
    const supabase = createClient()
    const { data } = await supabase
      .from('checklist')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (data?.items) {
      if (data.items.pre) setPreChecklist(data.items.pre)
      if (data.items.post) { setPostChecklist(data.items.post); setShowPost(true) }
      if (data.status === 'concluido') setCompleted(true)
    }
  }

  function toggleItem(list: 'pre' | 'post', id: string) {
    const setter = list === 'pre' ? setPreChecklist : setPostChecklist
    setter((prev) => prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)))
  }

  function removeItem(list: 'pre' | 'post', id: string) {
    const setter = list === 'pre' ? setPreChecklist : setPostChecklist
    setter((prev) => prev.filter((i) => i.id !== id))
  }

  function addCustomItem() {
    if (!customText.trim()) return
    const newItem: ChecklistItem = { id: `custom-${Date.now()}`, text: customText.trim(), checked: false, isCustom: true }
    const setter = targetList === 'pre' ? setPreChecklist : setPostChecklist
    setter((prev) => [...prev, newItem])
    setCustomText('')
  }

  async function handleConcluir() {
    setConfirmEnd(false)
    setCompleted(true)
    const supabase = createClient()
    await supabase.from('checklist').upsert({
      document_id: documentId,
      type: 'pre_instalacao',
      items: { pre: preChecklist, post: postChecklist },
      status: 'concluido',
      completed_at: new Date().toISOString(),
    }, { onConflict: 'document_id' })
  }

  const preChecked = preChecklist.filter((i) => i.checked).length
  const postChecked = postChecklist.filter((i) => i.checked).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">✅ Checklist do Instalador</h2>
        {completed && (
          <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">Concluído</span>
        )}
      </div>

      {/* Pre-instalação */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-800 text-sm">Antes de sair</h3>
          <span className="text-xs text-gray-500">{preChecked}/{preChecklist.length}</span>
        </div>
        <div className="space-y-2">
          {preChecklist.map((item) => (
            <label key={item.id} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleItem('pre', item.id)}
                className="h-4 w-4 text-sky-600 border-gray-300 rounded"
              />
              <span className={`text-sm flex-1 ${item.checked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                {item.text}
              </span>
              {item.isCustom && (
                <button
                  type="button"
                  onClick={() => removeItem('pre', item.id)}
                  className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >✕</button>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Conclusão */}
      {showPost && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-800 text-sm">No local — Conclusão</h3>
            <span className="text-xs text-gray-500">{postChecked}/{postChecklist.length}</span>
          </div>
          <div className="space-y-2">
            {postChecklist.map((item) => (
              <label key={item.id} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => toggleItem('post', item.id)}
                  className="h-4 w-4 text-sky-600 border-gray-300 rounded"
                />
                <span className={`text-sm flex-1 ${item.checked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {item.text}
                </span>
                {item.isCustom && (
                  <button
                    type="button"
                    onClick={() => removeItem('post', item.id)}
                    className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >✕</button>
                )}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Adicionar item */}
      <div className="flex gap-2">
        <select
          value={targetList}
          onChange={(e) => setTargetList(e.target.value as 'pre' | 'post')}
          className="px-2 py-2 text-sm border border-gray-300 rounded-md"
        >
          <option value="pre">Antes de sair</option>
          <option value="post">No local</option>
        </select>
        <input
          type="text"
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomItem() } }}
          placeholder="Adicionar item..."
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md"
        />
        <button
          type="button"
          onClick={addCustomItem}
          className="px-3 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700"
        >
          + Add
        </button>
      </div>

      {/* Ações */}
      <div className="flex gap-3 pt-2">
        {!showPost && (
          <button
            type="button"
            onClick={() => setShowPost(true)}
            className="px-4 py-2 text-sm font-medium text-sky-700 bg-sky-100 rounded-lg hover:bg-sky-200"
          >
            Mostrar checklist de conclusão
          </button>
        )}
        {!completed && (
          <button
            type="button"
            onClick={() => setConfirmEnd(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            ✓ Marcar como concluído
          </button>
        )}
      </div>

      <ConfirmDialog
        open={confirmEnd}
        title="Concluir checklist"
        message="Tem certeza que deseja marcar este checklist como concluído? Todos os itens serão salvos."
        onConfirm={handleConcluir}
        onCancel={() => setConfirmEnd(false)}
      />
    </div>
  )
}
