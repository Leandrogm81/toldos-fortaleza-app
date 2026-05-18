'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PedidoForm } from '@/components/pedido/PedidoForm'
import { PedidoPreview } from '@/components/pedido/PedidoPreview'
import { generatePDF, downloadTxtContent } from '@/lib/utils/pdf'
import { EMPRESA } from '@/lib/constants/empresa'
import { initialPedidoData } from '@/types/pedido'
import type { PedidoFormData } from '@/types/pedido'
import { PhotoUpload } from '@/components/pedido/PhotoUpload'
import { PhotoGallery } from '@/components/pedido/PhotoGallery'

export default function NovoPedidoPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<PedidoFormData>(() => ({
    ...initialPedidoData,
    date: new Date().toLocaleDateString('pt-BR'),
  }))
  const [logoSrc, setLogoSrc] = useState<string | null>(null)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null)
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false)
  const actionsMenuRef = useRef<HTMLDivElement>(null)
  const [photoRefresh, setPhotoRefresh] = useState(0)

  // Close actions menu on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target as Node)) {
        setActionsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Load logo and signature from profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase.from('profile').select('logo_data_url, company_signature_data_url').eq('id', user.id).single()
        if (data?.logo_data_url) setLogoSrc(data.logo_data_url)
        if (data?.company_signature_data_url) {
          setFormData((prev) => ({ ...prev, companySignatureDataUrl: data.company_signature_data_url! }))
        }
      } catch {}
    }
    loadProfile()
  }, [])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader()
      reader.onload = (ev) => setLogoSrc(ev.target?.result as string)
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const handleRemoveLogo = () => {
    setLogoSrc(null)
    const input = document.getElementById('logo-upload') as HTMLInputElement
    if (input) input.value = ''
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Auto-save client to database
      const { upsertClientFromForm } = await import('@/lib/utils/cliente-sync')
      const clientId = await upsertClientFromForm({
        clientName: formData.clientName,
        clientPhone: formData.clientPhone,
        clientCep: formData.clientCep,
        clientAddress: formData.clientAddress,
        clientNeighborhood: formData.clientNeighborhood,
        clientCity: formData.clientCity,
        clientCpf: formData.clientCpf,
        clientCnpj: formData.clientCnpj,
        clientRg: formData.clientRg,
        clientIe: formData.clientIe,
      })

      const docData = {
        type: 'pedido' as const,
        status: 'rascunho' as const,
        client_id: clientId,
        date: formData.date,
        doc_data: formData as any,
        signature_data_url: formData.signatureDataUrl || null,
        company_signature_data_url: formData.companySignatureDataUrl || null,
        include_signature: true,
        logo_data_url: logoSrc,
        total_value: parseFloat(formData.productValue.replace(/[^\d,]/g, '').replace(',', '.')) || 0,
        created_by: user.id,
      }

      if (currentOrderId) {
        await supabase.from('document').update(docData).eq('id', currentOrderId)
      } else {
        const { data } = await supabase.from('document').insert(docData).select('id').single()
        if (data) setCurrentOrderId(data.id)
      }
      alert('Pedido salvo com sucesso!')
    } catch (err: any) {
      alert('Erro ao salvar: ' + (err?.message || 'Erro desconhecido'))
    } finally {
      setIsSaving(false)
    }
  }

  const handlePrint = async () => {
    setIsPrinting(true)
    try {
      const clientName = formData.clientName.replace(/\s+/g, '_') || 'novo'
      const pdfDate = formData.date.replace(/\//g, '-')
      await generatePDF('print-area', `pedido-${clientName}-${pdfDate}.pdf`)
    } catch (err) {
      alert('Erro ao gerar PDF')
    } finally {
      setIsPrinting(false)
    }
  }

  const handleDownloadTxt = () => {
    const {
      date, clientName, clientAddress, clientNeighborhood, clientCity,
      clientPhone, clientCpf, clientRg, clientCnpj, clientIe,
      products, productValue, productValueText, paymentMethod, deliveryTime
    } = formData

    let content = `PEDIDO DE COMPRA\n`
    content += `Data: ${date}\n\n`
    content += `--- DADOS DO CONTRATANTE ---\n`
    content += `Nome / Razão Social: ${clientName || ''}\n`
    content += `Endereço: ${clientAddress || ''}\n`
    content += `Bairro: ${clientNeighborhood || ''}\n`
    content += `Cidade: ${clientCity || ''}\n`
    content += `Telefone: ${clientPhone || ''}\n`
    content += `CPF: ${clientCpf || ''} / RG: ${clientRg || ''}\n\n`
    content += `--- PRODUTO(S) ---\n`
    products.forEach((p, i) => {
      content += `Item ${i + 1}:\n`
      content += `  - Descrição: ${p.item || ''}\n`
      content += `  - Estrutura: ${p.structure || ''}\n`
      content += `  - Material: ${p.material || ''}\n`
      content += `  - Acessórios: ${p.accessories || ''}\n`
      content += `  - Medida: ${p.measure || ''}\n\n`
    })
    content += `--- VALOR E PAGAMENTO ---\n`
    content += `Valor: ${productValue || ''} (${productValueText || ''})\n`
    content += `Forma de pagamento: ${paymentMethod || ''}\n\n`
    content += `Prazo de Entrega: ${deliveryTime || ''}\n`

    const filename = `pedido-${(clientName || 'novo').replace(/\s+/g, '_')}-${date.replace(/\//g, '-')}.txt`
    downloadTxtContent(content, filename)
  }

  const handleReset = () => {
    setFormData({ ...initialPedidoData, date: new Date().toLocaleDateString('pt-BR'), products: [{ item: '', structure: '', material: '', accessories: '', measure: '' }] })
    setCurrentOrderId(null)
    handleRemoveLogo()
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Fixed Header */}
      <header className="bg-white shadow-md p-4 sticky top-0 z-20 border-b">
        <div className="max-w-screen-2xl mx-auto flex justify-between items-center px-2 sm:px-6 lg:px-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Gerador de Pedido</h1>

          {/* Desktop buttons */}
          <div className="hidden lg:flex gap-2 flex-wrap justify-end">
            <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors">
              {isSaving ? 'Salvando...' : currentOrderId ? 'Atualizar Pedido' : 'Salvar Pedido'}
            </button>
            <button onClick={handleDownloadTxt} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors">
              Download .txt
            </button>
            <button onClick={handleReset} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors">
              Limpar / Novo
            </button>
            <button onClick={handlePrint} disabled={isPrinting} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:bg-sky-300 transition-colors">
              {isPrinting ? 'Gerando PDF...' : 'Imprimir / Gerar PDF'}
            </button>
          </div>

          {/* Mobile menu */}
          <div className="lg:hidden" ref={actionsMenuRef}>
            <button onClick={() => setActionsMenuOpen(!actionsMenuOpen)} className="p-2 rounded-md text-gray-700 hover:bg-gray-200" aria-label="Abrir menu">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {actionsMenuOpen && (
              <div className="absolute top-16 right-4 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-30">
                <div className="py-1">
                  <button onClick={() => { handleSave(); setActionsMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{currentOrderId ? 'Atualizar Pedido' : 'Salvar Pedido'}</button>
                  <button onClick={() => { handleDownloadTxt(); setActionsMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Download .txt</button>
                  <button onClick={() => { handleReset(); setActionsMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Limpar / Novo</button>
                  <button onClick={() => { handlePrint(); setActionsMenuOpen(false); }} className={`block w-full text-left px-4 py-2 text-sm ${isPrinting ? 'text-gray-400' : 'text-gray-700'} hover:bg-gray-100`}>{isPrinting ? 'Gerando PDF...' : 'Imprimir / Gerar PDF'}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content - 2 columns */}
      <main className="max-w-screen-2xl mx-auto p-2 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form column (2/5) */}
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-lg shadow-lg h-fit">
          <PedidoForm
            data={formData}
            onChange={setFormData}
            logoSrc={logoSrc}
            onLogoChange={handleLogoChange}
            onRemoveLogo={handleRemoveLogo}
          />
        </div>

        {/* Preview column (3/5) */}
        <div className="lg:col-span-3 bg-gray-200 p-4 sm:p-8 rounded-lg shadow-inner overflow-y-auto lg:max-h-[calc(100vh-120px)]">
          <PedidoPreview data={formData} logoSrc={logoSrc} includeSignature={true} />
        </div>
      </main>

      {/* Fotos Section — only after pedido is saved */}
      {currentOrderId && (
        <div className="max-w-screen-2xl mx-auto px-2 sm:px-6 lg:px-8 pb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">📸 Fotos</h2>
            <PhotoUpload
              documentId={currentOrderId}
              onUploaded={() => setPhotoRefresh((prev) => prev + 1)}
            />
            <div className="mt-4">
              <PhotoGallery documentId={currentOrderId} refreshKey={photoRefresh} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
