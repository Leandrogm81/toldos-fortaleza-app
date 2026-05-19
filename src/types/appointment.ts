export interface Appointment {
  id: string
  title: string
  type: 'visita_medicao' | 'instalacao' | 'reparo' | 'pos_venda' | 'outro'
  client_id: string | null
  document_id: string | null
  scheduled_at: string
  duration_min: number
  status: 'agendado' | 'confirmado' | 'em_andamento' | 'concluido' | 'cancelado'
  address_json: Record<string, string> | null
  notes: string | null
  created_at: string
}

export interface DocumentSummary {
  id: string
  type: 'pedido' | 'orcamento'
  status: string
  date: string
  doc_data: Record<string, unknown>
  total_value: number | null
  created_at: string
}

export interface Profile {
  id: string
  name: string
  role: 'admin' | 'user'
  phone: string | null
  logo_data_url: string | null
  company_signature_data_url: string | null
}
