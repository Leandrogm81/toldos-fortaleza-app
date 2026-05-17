-- Adicionar tipo "reparo" ao agendamento
ALTER TABLE appointment DROP CONSTRAINT IF EXISTS appointment_type_check;
ALTER TABLE appointment ADD CONSTRAINT appointment_type_check 
  CHECK (type IN ('visita_medicao', 'instalacao', 'reparo', 'pos_venda', 'outro'));
