-- Criar bucket de fotos (executar no SQL Editor do Supabase)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso ao bucket
CREATE POLICY "attachments_select_auth" ON storage.objects
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "attachments_insert_auth" ON storage.objects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "attachments_delete_auth" ON storage.objects
  FOR DELETE USING (auth.role() = 'authenticated');
