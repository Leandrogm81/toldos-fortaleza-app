'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PedidoForm } from '@/components/pedido/PedidoForm'
import { PedidoPreview } from '@/components/pedido/PedidoPreview'
import { generatePDF, downloadTxtContent } from '@/lib/utils/pdf'
import { initialPedidoData } from '@/types/pedido'
import type { PedidoFormData } from '@/types/pedido'
import { PhotoUpload } from '@/components/pedido/PhotoUpload'
import { PhotoGallery } from '@/components/pedido/PhotoGallery'

export default function NovoOrcamentoPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<PedidoFormData>(() => ({
    ...initialPedidoData,
    date: new Date().toLocaleDateString('pt-BR'),
  }))
  const [validade, setValidade] = useState('15 dias')
  const [logoSrc, setLogoSrc] = useState<string | null>(null)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [currentDocId, setCurrentDocId] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('rascunho')
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false)
  const actionsMenuRef = useRef<HTMLDivElement>(null)
  const [photoRefresh, setPhotoRefresh] = useState(0)

  // Load logo from profile
  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profile').select('logo_data_url').eq('id', user.id).single()
      if (data?.logo_data_url) setLogoSrc(data.logo_data_url)
    }
    loadProfile()
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target as Node)) {
        setActionsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader()
      reader.onload = (ev) => setLogoSrc(ev.target?.result as string)
      reader.readAsDataURL(e.target.files[0])
    }
  }
  const handleRemoveLogo = () => setLogoSrc(null)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const docData = {
        type: 'orcamento' as const,
        status: status,
        date: formData.date,
        doc_data: { ...formData, validade } as any,
        logo_data_url: logoSrc,
        public_token: crypto.randomUUID().slice(0, 8),
        total_value: parseFloat(formData.productValue.replace(/[^\d,]/g, '').replace(',', '.')) || 0,
        created_by: user.id,
      }

      if (currentDocId) {
        await supabase.from('document').update(docData).eq('id', currentDocId)
      } else {
        const { data } = await supabase.from('document').insert(docData).select('id, public_token').single()
        if (data) {
          setCurrentDocId(data.id)
          // Copy link to clipboard
          const link = `${window.location.origin}/orcamento/${data.public_token}`
          navigator.clipboard.writeText(link)
          alert(`Orçamento salvo! Link copiado: ${link}`)
          return
        }
      }
      alert('Orçamento salvo com sucesso!')
    } catch (err: any) {
      alert('Erro ao salvar: ' + (err?.message || ''))
    } finally {
      setIsSaving(false)
    }
  }

  const handlePrint = async () => {
    setIsPrinting(true)
    try {
      const name = formData.clientName.replace(/\s+/g, '_') || 'orcamento'
      await generatePDF('print-area', `orcamento-${name}.pdf`)
    } catch {} finally {
      setIsPrinting(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!currentDocId) {
      // Save first, then update status
      await handleSave()
    }
    if (currentDocId) {
      const supabase = createClient()
      await supabase.from('document').update({ status: newStatus }).eq('id', currentDocId)
      setStatus(newStatus)
    }
  }

  const handleConvertToPedido = async () => {
    if (!currentDocId) {
      alert('Salve o orçamento primeiro.')
      return
    }
    if (!confirm('Criar um pedido a partir deste orçamento?')) return

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Create new pedido from orcamento data
    const { data: pedido } = await supabase.from('document').insert({
      type: 'pedido',
      status: 'rascunho',
      client_id: null,
      date: new Date().toLocaleDateString('pt-BR'),
      doc_data: formData as any,
      logo_data_url: logoSrc,
      total_value: parseFloat(formData.productValue.replace(/[^\d,]/g, '').replace(',', '.')) || 0,
      created_by: user.id,
    }).select('id').single()

    // Mark orcamento as approved
    await supabase.from('document').update({ status: 'aprovado' }).eq('id', currentDocId)
    setStatus('aprovado')

    alert('Pedido criado com sucesso!')
    if (pedido) router.push(`/pedidos/${pedido.id}`)
  }

  const handleReset = () => {
    setFormData({ ...initialPedidoData, date: new Date().toLocaleDateString('pt-BR'), products: [{ item: '', structure: '', material: '', accessories: '', measure: '' }] })
    setValidade('15 dias')
    setCurrentDocId(null)
    setStatus('rascunho')
    handleRemoveLogo()
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md p-4 sticky top-0 z-20 border-b">
        <div className="max-w-screen-2xl mx-auto flex justify-between items-center px-2 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-800">Gerador de Orçamento</h1>
            {currentDocId && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                status === 'rascunho' ? 'bg-yellow-100 text-yellow-700' :
                status === 'enviado' ? 'bg-blue-100 text-blue-700' :
                status === 'aprovado' ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {status === 'rascunho' ? 'Rascunho' :
                 status === 'enviado' ? 'Enviado' :
                 status === 'aprovado' ? 'Aprovado' : status}
              </span>
            )}
          </div>

          <div className="hidden lg:flex gap-2 flex-wrap justify-end">
            <button onClick={handleSave} disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300">
              {isSaving ? 'Salvando...' : currentDocId ? 'Atualizar' : 'Salvar Orçamento'}
            </button>
            {currentDocId && status === 'rascunho' && (
              <button onClick={() => handleStatusChange('enviado')}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700">
                Marcar como Enviado
              </button>
            )}
            {status === 'enviado' && (
              <button onClick={() => handleStatusChange('aprovado')}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                Aprovar
              </button>
            )}
            {status === 'aprovado' && (
              <button onClick={handleConvertToPedido}
                className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700">
                Converter em Pedido
              </button>
            )}
            {currentDocId && (
              <button onClick={async () => {
                let token = currentDocId
                // Check if document already has a public token
                const supabase = createClient()
                const { data: doc } = await supabase.from('document').select('public_token').eq('id', currentDocId).single()
                if (doc?.public_token) token = doc.public_token
                else {
                  // Generate token
                  token = crypto.randomUUID().slice(0, 8)
                  await supabase.from('document').update({ public_token: token }).eq('id', currentDocId)
                }
                const link = `${window.location.origin}/orcamento/${token}`
                await navigator.clipboard.writeText(link)
                alert(`Link copiado! Envie para o cliente:\n${link}`)
              }}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                Compartilhar
              </button>
            )}
            <button onClick={handlePrint} disabled={isPrinting}
              className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:bg-sky-300">
              {isPrinting ? 'Gerando PDF...' : 'PDF'}
            </button>
            <button onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
              Limpar / Novo
            </button>
          </div>

          <div className="lg:hidden" ref={actionsMenuRef}>
            <button onClick={() => setActionsMenuOpen(!actionsMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:bg-gray-200" aria-label="Menu">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {actionsMenuOpen && (
              <div className="absolute top-16 right-4 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-30">
                <div className="py-1">
                  {[{ label: 'Salvar', fn: handleSave }, { label: 'PDF', fn: handlePrint }, { label: 'Limpar / Novo', fn: handleReset }].map(({ label, fn }) => (
                    <button key={label} onClick={() => { fn(); setActionsMenuOpen(false); }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{label}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto p-2 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-lg shadow-lg h-fit">
          <PedidoForm
            data={formData}
            onChange={setFormData}
            logoSrc={logoSrc}
            onLogoChange={handleLogoChange}
            onRemoveLogo={handleRemoveLogo}
            mode="orcamento"
            validade={validade}
            onValidadeChange={setValidade}
          />
        </div>
        <div className="lg:col-span-3 bg-gray-200 p-4 sm:p-8 rounded-lg shadow-inner overflow-y-auto lg:max-h-[calc(100vh-120px)]">
          <PedidoPreview data={formData} logoSrc={logoSrc} includeSignature={true} mode="orcamento" validade={validade} />
        </div>
      </main>

      {/* Fotos Section — only after orçamento is saved */}
      {currentDocId && (
        <div className="max-w-screen-2xl mx-auto px-2 sm:px-6 lg:px-8 pb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">📸 Fotos</h2>
            <PhotoUpload
              documentId={currentDocId}
              onUploaded={() => setPhotoRefresh((prev) => prev + 1)}
            />
            <div className="mt-4">
              <PhotoGallery documentId={currentDocId} refreshKey={photoRefresh} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
