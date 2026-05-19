'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ChecklistItem {
  id: string
  text: string
  checked: boolean
}

export default function ChecklistPublicPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState('')
  const [preChecklist, setPreChecklist] = useState<ChecklistItem[]>([])
  const [postChecklist, setPostChecklist] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [concluded, setConcluded] = useState(false)
  const [showPost, setShowPost] = useState(false)
  const [checklistId, setChecklistId] = useState('')

  useEffect(() => {
    params.then(({ token }) => {
      setToken(token)
      loadChecklist(token)
    })
  }, [params])

  async function loadChecklist(token: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('checklist')
      .select('id, items, status')
      .eq('public_token', token)
      .single()

    if (error || !data) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setChecklistId(data.id)
    if (data.items?.pre) setPreChecklist(data.items.pre)
    if (data.items?.post) { setPostChecklist(data.items.post); setShowPost(true) }
    if (data.status === 'concluido') setConcluded(true)
    setLoading(false)
  }

  function toggleItem(list: 'pre' | 'post', id: string) {
    if (concluded) return
    const setter = list === 'pre' ? setPreChecklist : setPostChecklist
    setter((prev) => prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)))
  }

  async function handleConclude() {
    const supabase = createClient()
    await supabase.from('checklist').update({
      items: { pre: preChecklist, post: postChecklist },
      status: 'concluido',
      completed_at: new Date().toISOString(),
    }).eq('id', checklistId)

    setConcluded(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-sm">
          <p className="text-2xl mb-4">❌</p>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Checklist não encontrado</h1>
          <p className="text-gray-500">Este link pode estar inválido ou expirado.</p>
        </div>
      </div>
    )
  }

  const preChecked = preChecklist.filter((i) => i.checked).length
  const postChecked = postChecklist.filter((i) => i.checked).length

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold text-gray-900">📋 Checklist</h1>
          {concluded && (
            <span className="inline-block mt-2 px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
              ✓ Concluído
            </span>
          )}
        </div>

        {/* Pre-instalação */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-gray-800">Antes de sair</h2>
            <span className="text-xs text-gray-500">{preChecked}/{preChecklist.length}</span>
          </div>
          <div className="space-y-3">
            {preChecklist.map((item) => (
              <label key={item.id} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => toggleItem('pre', item.id)}
                  disabled={concluded}
                  className="h-5 w-5 text-sky-600 border-gray-300 rounded"
                />
                <span className={`text-base ${item.checked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {item.text}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Conclusão */}
        {showPost && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium text-gray-800">No local — Conclusão</h2>
              <span className="text-xs text-gray-500">{postChecked}/{postChecklist.length}</span>
            </div>
            <div className="space-y-3">
              {postChecklist.map((item) => (
                <label key={item.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleItem('post', item.id)}
                    disabled={concluded}
                    className="h-5 w-5 text-sky-600 border-gray-300 rounded"
                  />
                  <span className={`text-base ${item.checked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {item.text}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {!showPost && !concluded && (
            <button
              type="button"
              onClick={() => setShowPost(true)}
              className="w-full py-3 text-base font-medium text-sky-700 bg-sky-100 rounded-xl hover:bg-sky-200"
            >
              Mostrar checklist de conclusão
            </button>
          )}
          {!concluded && (
            <button
              type="button"
              onClick={handleConclude}
              className="w-full py-3 text-base font-medium text-white bg-green-600 rounded-xl hover:bg-green-700"
            >
              ✓ Concluir checklist
            </button>
          )}
          {concluded && (
            <p className="text-center text-sm text-gray-500">
              Checklist concluído. Obrigado!
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
