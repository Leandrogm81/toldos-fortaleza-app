-- Adicionar coluna measure_fields na product_field
ALTER TABLE product_field ADD COLUMN IF NOT EXISTS measure_fields JSONB DEFAULT '["comprimento","largura","altura"]';
