'use client'

import { EMPRESA } from '@/lib/constants/empresa'
import type { PedidoFormData } from '@/types/pedido'

export function PedidoPreview({
  data,
  logoSrc,
  includeSignature,
  mode = 'pedido',
  validade,
}: {
  data: PedidoFormData
  logoSrc: string | null
  includeSignature: boolean
  mode?: 'pedido' | 'orcamento'
  validade?: string
}) {
  return (
    <div id="print-area" className="w-full mx-auto bg-white shadow-2xl p-6 sm:p-12 border border-gray-300 font-sans text-sm text-gray-800">
      <header className="text-center mb-10">
        {/* Logo */}
        {logoSrc ? (
          <img src={logoSrc} alt="Company Logo" className="h-32 w-auto mx-auto mb-2 object-contain" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" className="h-28 w-auto mx-auto mb-2 text-sky-800">
            <path d="M35 2 H 5 V 38 H 35 V 28 H 20 V 12 H 35 V 2 Z" stroke="currentColor" strokeWidth="3" fill="none" strokeLinejoin="round" />
          </svg>
        )}
        <h1 className="text-2xl font-bold text-gray-800">{EMPRESA.fantasia}</h1>
        <p className="text-base text-gray-500">Coberturas em Policarbonato</p>
        <h2 className="text-xl font-bold tracking-widest mt-8">
          {mode === 'orcamento' ? 'ORÇAMENTO' : 'PEDIDO DE COMPRA'}
        </h2>
        {mode === 'orcamento' && validade && (
          <p className="text-sm text-gray-600 mt-2">Orçamento válido até: {validade}</p>
        )}
      </header>

      <main>
        <p className="mb-8">Data: {data.date}</p>

        {/* Contratado */}
        <section className="mb-6">
          <h3 className="font-bold text-base text-sky-700 border-b-2 border-sky-700 pb-1 mb-3">Contratado</h3>
          <div className="space-y-px">
            <p>{EMPRESA.nome}</p>
            <p>Endereço: {EMPRESA.endereco}</p>
            <p>Bairro: {EMPRESA.bairro} – {EMPRESA.cidade} CEP: {EMPRESA.cep}</p>
            <p>Telefone: {EMPRESA.telefone} / Fixo e WhatsApp</p>
            <p>CNPJ: {EMPRESA.cnpj} / Inscrição Estadual: {EMPRESA.ie}</p>
            <p>Site: {EMPRESA.site} / E-mail: {EMPRESA.email}</p>
          </div>
        </section>

        {/* Contratante */}
        <section className="mb-6">
          <h3 className="font-bold text-base text-sky-700 border-b-2 border-sky-700 pb-1 mb-3">Contratante</h3>
          <div className="space-y-px">
            {data.clientName && <p>Nome: {data.clientName}</p>}
            {data.clientAddress && <p>Endereço: {data.clientAddress}</p>}
            {data.clientNeighborhood && <p>Bairro: {data.clientNeighborhood}</p>}
            {data.clientCity && <p>Cidade: {data.clientCity}</p>}
            {data.clientPhone && <p>Telefone: {data.clientPhone}</p>}
            {data.clientCnpj ? (
              <>
                {data.clientCnpj && <p>CNPJ: {data.clientCnpj}{data.clientIe ? ` / Inscrição Estadual: ${data.clientIe}` : ''}</p>}
              </>
            ) : (
              <>
                {data.clientCpf && <p>CPF: {data.clientCpf}{data.clientRg ? ` / RG: ${data.clientRg}` : ''}</p>}
                {!data.clientCpf && data.clientRg && <p>RG: {data.clientRg}</p>}
              </>
            )}
          </div>
        </section>

        {/* Produtos */}
        <section className="mb-6">
          <h3 className="font-bold text-base text-sky-700 border-b-2 border-sky-700 pb-1 mb-3">Produto(s)</h3>
          {data.products.map((product, index) => (
            <div key={index} className={`space-y-px ${index < data.products.length - 1 ? 'mb-3 pb-3 border-b border-gray-200' : ''}`}>
              {product.item && <p><span className="font-semibold">Item {index + 1}:</span> {product.item}</p>}
              {product.structure && <p><span className="font-semibold">Estrutura:</span> {product.structure}</p>}
              {product.material && <p><span className="font-semibold">Material:</span> {product.material}</p>}
              {product.accessories && <p><span className="font-semibold">Acessórios:</span> {product.accessories}</p>}
              {product.measure && <p><span className="font-semibold">Medida:</span> {product.measure}</p>}
            </div>
          ))}
        </section>

        {/* Valor e Pagamento */}
        <section className="space-y-2 text-sm my-8">
          {data.productValue && (
            <div className="border border-black p-2">
              Valor R$ {data.productValue.replace('R$', '').trim()} – {data.productValueText}
            </div>
          )}
          <div className="border border-black p-2">
            Forma de pagamento: {data.paymentMethod || 'A combinar'}
          </div>
          <div className="border border-black p-2">
            Dados Bancários: {EMPRESA.banco} / Pix: {EMPRESA.pix}
          </div>
        </section>

        {/* Prazo */}
        <section className="space-y-px text-sm">
          {data.deliveryTime && <p>Prazo de Entrega: {data.deliveryTime}</p>}
          <p>Garantia: {EMPRESA.garantia}</p>
        </section>
      </main>

      {/* Assinaturas */}
      <section className="mt-20 flex flex-wrap justify-around items-start gap-x-8 gap-y-12">
        <div className="text-center w-72">
          <div className="h-20 flex items-end justify-center pb-1">
            {data.companySignatureDataUrl && (
              <img src={data.companySignatureDataUrl} alt="Assinatura do Contratado" className="max-h-full w-auto object-contain" />
            )}
          </div>
          <div className="border-t-2 border-gray-800 pt-2">
            <p className="text-sm font-semibold h-5">{EMPRESA.responsavel}</p>
            <p className="text-xs text-gray-600">Assinatura do Contratado</p>
            <p className="text-xs text-gray-600">CPF: {EMPRESA.responsavelCpf}</p>
          </div>
        </div>

        {includeSignature && (
          <div className="text-center w-72">
            <div className="h-20 flex items-end justify-center pb-1">
              {data.signatureDataUrl && (
                <img src={data.signatureDataUrl} alt="Assinatura do Contratante" className="max-h-full w-auto object-contain" />
              )}
            </div>
            <div className="border-t-2 border-gray-800 pt-2">
              <p className="text-sm font-semibold h-5">{data.clientName || ''}</p>
              <p className="text-xs text-gray-600">Assinatura do Contratante</p>
              {data.clientCnpj ? (
                <p className="text-xs text-gray-600">CNPJ: {data.clientCnpj}</p>
              ) : (
                data.clientCpf && <p className="text-xs text-gray-600">CPF: {data.clientCpf}</p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="text-left text-xs pt-8 mt-10">
        <div className="space-y-px">
          <p>Razão Social: {EMPRESA.nome} / Nome Fantasia: {EMPRESA.fantasia}</p>
          <p>CNPJ: {EMPRESA.cnpj} / Inscrição Estadual: {EMPRESA.ie}</p>
          <p>Endereço: {EMPRESA.endereco} {EMPRESA.bairro} - {EMPRESA.cidade} – CEP: {EMPRESA.cep}</p>
          <p>Telefone e WhatsApp: {EMPRESA.telefone}</p>
          <p>Redes Sociais: Facebook {EMPRESA.facebook} / Instagram: {EMPRESA.instagram}</p>
          <p>Site: {EMPRESA.site}</p>
        </div>
      </footer>
    </div>
  )
}
