-- Popular a tabela product_field com dados padrão da Toldos Fortaleza
-- Rodar no SQL Editor do Supabase

-- Itens
INSERT INTO product_field (field_type, value) VALUES
('item', 'Cobertura retrátil'),
('item', 'Cobertura fixa'),
('item', 'Toldo fixo'),
('item', 'Toldo de braço'),
('item', 'Toldo de braço articulado'),
('item', 'Fechamento fixo'),
('item', 'Janela'),
('item', 'Cortina enrolável'),
('item', 'Troca de policarbonato'),
('item', 'Troca de lona'),
('item', 'Serviço de reparo')
ON CONFLICT (field_type, value) DO NOTHING;

-- Estruturas
INSERT INTO product_field (field_type, value) VALUES
('estrutura', 'Alumínio Branco'),
('estrutura', 'Alumínio Preto'),
('estrutura', 'Alumínio Bronze'),
('estrutura', 'Alumínio Natural'),
('estrutura', 'Aço galvanizado cor alumínio'),
('estrutura', 'Aço galvanizado branco'),
('estrutura', 'Aço galvanizado preto'),
('estrutura', 'Aço galvanizado cor a definir')
ON CONFLICT (field_type, value) DO NOTHING;

-- Materiais
INSERT INTO product_field (field_type, value) VALUES
('material', 'Policarbonato alveolar'),
('material', 'Policarbonato compacto'),
('material', 'Lona')
ON CONFLICT (field_type, value) DO NOTHING;

-- Acessórios
INSERT INTO product_field (field_type, value) VALUES
('acessorio', 'Manivela'),
('acessorio', 'Redutor'),
('acessorio', 'Mola'),
('acessorio', 'Rufos'),
('acessorio', 'Calhas')
ON CONFLICT (field_type, value) DO NOTHING;
