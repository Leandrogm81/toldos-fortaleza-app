-- Checklist compartilhável: adicionar campos de funcionários, veículo e token público
ALTER TABLE checklist ADD COLUMN IF NOT EXISTS employees_fabricacao TEXT DEFAULT '';
ALTER TABLE checklist ADD COLUMN IF NOT EXISTS employees_instalacao TEXT DEFAULT '';
ALTER TABLE checklist ADD COLUMN IF NOT EXISTS veiculo TEXT DEFAULT '';
ALTER TABLE checklist ADD COLUMN IF NOT EXISTS public_token TEXT UNIQUE;
