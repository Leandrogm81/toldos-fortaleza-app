'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function OrcamentoAprovado({ aprovado, token }: { aprovado: boolean; token: string }) {
  const [done, setDone] = useState(aprovado)
  const [loading, setLoading] = useState(false)

  const handleApprove = async () => {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('document')
      .update({ status: 'aprovado' })
      .eq('public_token', token)

    if (error) {
      alert('Erro ao aprovar. Tente novamente.')
    } else {
      setDone(true)
    }
    setLoading(false)
  }

  const handleWhatsApp = () => {
    const msg = encodeURIComponent('Olá! Gostaria de mais informações sobre o orçamento.')
    window.open(`https://wa.me/55${'1120360010'}?text=${msg}`, '_blank')
  }

  if (done) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <h2 className="text-xl font-bold text-green-800">Orçamento Aprovado!</h2>
        <p className="text-sm text-green-600 mt-2">Obrigado! Em breve entraremos em contato.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleApprove}
        disabled={loading}
        className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold rounded-lg transition-colors text-lg"
      >
        {loading ? 'Aprovando...' : '✅ Aprovar Orçamento'}
      </button>

      <button
        onClick={handleWhatsApp}
        className="w-full py-2 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors text-sm"
      >
        💬 Tirar dúvidas pelo WhatsApp
      </button>
    </div>
  )
}
