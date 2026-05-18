-- Tabela para autocomplete de campos de produto (Item, Estrutura, Material, Acessório)
-- Executar no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS product_field (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_type TEXT NOT NULL CHECK (field_type IN ('item', 'estrutura', 'material', 'acessorio')),
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(field_type, value)
);

-- RLS: todos usuários autenticados podem ler e inserir
ALTER TABLE product_field ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_field_select" ON product_field FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "product_field_insert" ON product_field FOR INSERT WITH CHECK (auth.role() = 'authenticated');
