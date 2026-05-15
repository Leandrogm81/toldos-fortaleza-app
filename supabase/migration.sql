-- ============================================================
-- Toldos Fortaleza App — Migration Inicial
-- ============================================================
-- Execute no SQL Editor do Supabase

-- 1. Profile table
CREATE TABLE IF NOT EXISTS profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  phone TEXT,
  logo_data_url TEXT,
  company_signature_data_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profile (id, name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 3. Profile RLS
ALTER TABLE profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profile_view_own" ON profile FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profile_view_all_admin" ON profile FOR SELECT USING (
  EXISTS (SELECT 1 FROM profile WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "profile_update_own" ON profile FOR UPDATE USING (auth.uid() = id);

-- 4. Client table
CREATE TABLE IF NOT EXISTS client (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  doc_type TEXT NOT NULL DEFAULT 'pf' CHECK (doc_type IN ('pf', 'pj')),
  cpf TEXT,
  rg TEXT,
  cnpj TEXT,
  ie TEXT,
  phone TEXT NOT NULL,
  cep TEXT,
  address TEXT,
  neighborhood TEXT,
  city TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_name ON client(name);
CREATE INDEX IF NOT EXISTS idx_client_phone ON client(phone);

ALTER TABLE client ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_select" ON client FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "client_insert" ON client FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "client_update" ON client FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "client_delete" ON client FOR DELETE USING (auth.role() = 'authenticated');

-- 5. Document table (pedidos + orcamentos)
CREATE TABLE IF NOT EXISTS document (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('pedido', 'orcamento')),
  status TEXT NOT NULL DEFAULT 'rascunho'
    CHECK (status IN ('rascunho','enviado','aprovado','em_fabricacao','pronto','instalado','pago','cancelado')),
  client_id UUID REFERENCES client(id) ON DELETE SET NULL,
  date TEXT NOT NULL,
  doc_data JSONB NOT NULL,
  signature_data_url TEXT,
  company_signature_data_url TEXT,
  include_signature BOOLEAN DEFAULT false,
  logo_data_url TEXT,
  client_type TEXT,
  public_token TEXT UNIQUE,
  total_value NUMERIC,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_client ON document(client_id);
CREATE INDEX IF NOT EXISTS idx_document_type ON document(type);
CREATE INDEX IF NOT EXISTS idx_document_status ON document(status);
CREATE INDEX IF NOT EXISTS idx_document_created_at ON document(created_at DESC);

ALTER TABLE document ENABLE ROW LEVEL SECURITY;
CREATE POLICY "document_select" ON document FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "document_insert" ON document FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "document_update" ON document FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "document_delete" ON document FOR DELETE USING (auth.role() = 'authenticated');

-- 6. Appointment table
CREATE TABLE IF NOT EXISTS appointment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('visita_medicao', 'instalacao', 'pos_venda', 'outro')),
  client_id UUID REFERENCES client(id) ON DELETE SET NULL,
  document_id UUID REFERENCES document(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_min INTEGER DEFAULT 60,
  status TEXT DEFAULT 'agendado' CHECK (status IN ('agendado', 'confirmado', 'em_andamento', 'concluido', 'cancelado')),
  address_json JSONB,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointment_date ON appointment(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointment_client ON appointment(client_id);

ALTER TABLE appointment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "appointment_select" ON appointment FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "appointment_insert" ON appointment FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "appointment_update" ON appointment FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "appointment_delete" ON appointment FOR DELETE USING (auth.role() = 'authenticated');

-- 7. Attachment table
CREATE TABLE IF NOT EXISTS attachment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES document(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('foto_medicao', 'foto_instalacao', 'documento')),
  storage_path TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE attachment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attachment_select" ON attachment FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "attachment_insert" ON attachment FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 8. Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER client_updated_at BEFORE UPDATE ON client
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER document_updated_at BEFORE UPDATE ON document
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER appointment_updated_at BEFORE UPDATE ON appointment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
