export interface Product {
  item: string
  structure: string
  material: string
  accessories: string
  measure: string
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
  deliveryTime: string
  signatureDataUrl: string
  companySignatureDataUrl: string
}

export const initialProduct: Product = {
  item: '',
  structure: '',
  material: '',
  accessories: '',
  measure: '',
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
  deliveryTime: '',
  signatureDataUrl: '',
  companySignatureDataUrl: '',
}
