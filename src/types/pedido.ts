export interface ProductMeasure {
  comprimento: string
  largura: string
  altura: string
}

export interface Product {
  item: string
  structure: string
  material: string
  cor_material: string
  accessories: string
  measure: string
  comprimento: string
  largura: string
  altura: string
  measures: ProductMeasure[]
  // Cálculo
  preco_m2: string          // preço por m² (manual)
  com_calha: boolean        // tem calha?
  calha_preco_m: string     // preço por metro linear de calha (default "100")
  calha_medida: string      // medida da calha em metros (default = comprimento)
  calc_m2: string           // m² calculado (auto)
  calc_subtotal: string     // subtotal (auto)
  observacao: string        // campo de observação (reparo etc)
}

export interface PaymentOption {
  id: string
  label: string             // ex: "À vista com 10% de desconto"
}

export interface PedidoFormData {
  date: string
  clientName: string
  clientAddress: string
  clientNeighborhood: string
  clientCity: string
  clientCep: string
  clientPhone: string
  clientCpf: string
  clientRg: string
  clientCnpj: string
  clientIe: string
  products: Product[]
  productValue: string
  productValueText: string
  paymentMethod: string
  paymentOptions: PaymentOption[]  // múltiplas opções (orçamento)
  deliveryTime: string
  signatureDataUrl: string
  companySignatureDataUrl: string
}

export const initialProduct: Product = {
  item: '',
  structure: '',
  material: '',
  cor_material: '',
  accessories: '',
  measure: '',
  comprimento: '',
  largura: '',
  altura: '',
  measures: [{ comprimento: '', largura: '', altura: '' }],
  preco_m2: '',
  com_calha: false,
  calha_preco_m: '100',
  calha_medida: '',
  calc_m2: '',
  calc_subtotal: '',
  observacao: '',
}

export const initialPedidoData: PedidoFormData = {
  date: new Date().toLocaleDateString('pt-BR'),
  clientName: '',
  clientAddress: '',
  clientNeighborhood: '',
  clientCity: '',
  clientCep: '',
  clientPhone: '',
  clientCpf: '',
  clientRg: '',
  clientCnpj: '',
  clientIe: '',
  products: [{ ...initialProduct }],
  productValue: '',
  productValueText: '',
  paymentMethod: '',
  paymentOptions: [],
  deliveryTime: '',
  signatureDataUrl: '',
  companySignatureDataUrl: '',
}
