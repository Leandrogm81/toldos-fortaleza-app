import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { EMPRESA } from '@/lib/constants/empresa'
import type { PedidoFormData } from '@/types/pedido'
import { OrcamentoAprovado } from './OrcamentoAprovado'

export default async function OrcamentoPublicoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )

  const { data: doc } = await supabase
    .from('document')
    .select('*')
    .eq('public_token', token)
    .single()

  if (!doc || doc.type !== 'orcamento') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <h1 className="text-xl font-bold text-gray-900">Orçamento não encontrado</h1>
          <p className="text-sm text-gray-500 mt-2">O link que você acessou é inválido ou expirou.</p>
        </div>
      </div>
    )
  }

  const data = doc.doc_data as PedidoFormData & { validade?: string }
  const aprovado = doc.status === 'aprovado'

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-800">{EMPRESA.fantasia}</h1>
          <p className="text-sm text-gray-500">Coberturas em Policarbonato</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div id="print-area-public" className="text-sm text-gray-800 space-y-4">
            <h2 className="text-xl font-bold text-center tracking-widest">ORÇAMENTO</h2>
            <p>Data: {data.date}</p>
            {data.validade && <p>Validade: {data.validade}</p>}

            <div className="border-t pt-4">
              <h3 className="font-bold text-sky-700">Contratante</h3>
              <p>Nome: {data.clientName}</p>
              <p>Endereço: {data.clientAddress}</p>
              <p>Telefone: {data.clientPhone}</p>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-bold text-sky-700">Produto(s)</h3>
              {data.products.map((p, i) => (
                <div key={i} className="mt-2 pb-2 border-b border-gray-200">
                  <p><strong>Item {i + 1}:</strong> {p.item}</p>
                  {p.material && <p>Material: {p.material}</p>}
                  {p.measure && <p>Medida: {p.measure}</p>}
                </div>
              ))}
            </div>

            {data.productValue && (
              <div className="border border-black p-3 text-center font-bold text-lg">
                Valor: {data.productValue}
              </div>
            )}

            <div className="border-t pt-4 text-xs text-gray-500">
              <p>{EMPRESA.nome} | CNPJ: {EMPRESA.cnpj}</p>
              <p>{EMPRESA.endereco} - {EMPRESA.cidade}</p>
              <p>Tel: {EMPRESA.telefone}</p>
            </div>
          </div>
        </div>

        <OrcamentoAprovado aprovado={aprovado} token={token} />
      </div>
    </div>
  )
}
