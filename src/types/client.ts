export interface Client {
  id: string
  name: string
  doc_type: 'pf' | 'pj'
  cpf?: string | null
  rg?: string | null
  cnpj?: string | null
  ie?: string | null
  phone: string
  cep?: string | null
  address?: string | null
  neighborhood?: string | null
  city?: string | null
  notes?: string | null
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface ClientFormData {
  name: string
  doc_type: 'pf' | 'pj'
  cpf: string
  rg: string
  cnpj: string
  ie: string
  phone: string
  cep: string
  address: string
  neighborhood: string
  city: string
  notes: string
}

export const emptyClientForm: ClientFormData = {
  name: '',
  doc_type: 'pf',
  cpf: '',
  rg: '',
  cnpj: '',
  ie: '',
  phone: '',
  cep: '',
  address: '',
  neighborhood: '',
  city: '',
  notes: '',
}
