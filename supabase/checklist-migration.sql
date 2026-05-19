CREATE TABLE IF NOT EXISTS checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES document(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'pre_instalacao',
  items JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checklist_select" ON checklist FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "checklist_insert" ON checklist FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "checklist_update" ON checklist FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "checklist_delete" ON checklist FOR DELETE USING (auth.role() = 'authenticated');
