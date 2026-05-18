// Regras de produto — Toldos Fortaleza
// Fonte: conversa com Leandro em 17/05/2026

export interface ItemConfig {
  name: string
  measures: ('comprimento' | 'largura' | 'altura')[]  // quais campos de medida mostrar
  materiais: string[]    // materiais permitidos
  estruturas: string[]   // estruturas permitidas (palavras-chave: aluminio, aco)
  acessorios: string[]   // acessórios sugeridos
}

export const ITENS: ItemConfig[] = [
  {
    name: 'Cobertura retrátil',
    measures: ['comprimento', 'largura'],
    materiais: ['Policarbonato alveolar', 'Policarbonato compacto'],
    estruturas: ['aluminio'],
    acessorios: ['Rufos', 'Calhas'],
  },
  {
    name: 'Cobertura fixa',
    measures: ['comprimento', 'largura'],
    materiais: ['Policarbonato alveolar', 'Policarbonato compacto'],
    estruturas: ['aluminio'],
    acessorios: ['Rufos', 'Calhas'],
  },
  {
    name: 'Toldo fixo',
    measures: ['comprimento', 'largura', 'altura'],
    materiais: ['Policarbonato alveolar', 'Policarbonato compacto', 'Lona'],
    estruturas: ['aluminio'],
    acessorios: [],
  },
  {
    name: 'Toldo de braço',
    measures: ['comprimento', 'largura'],
    materiais: ['Lona'],
    estruturas: ['aco'],
    acessorios: ['Manivela', 'Redutor'],
  },
  {
    name: 'Toldo de braço articulado',
    measures: ['comprimento', 'largura'],
    materiais: ['Lona'],
    estruturas: ['aluminio'],
    acessorios: ['Manivela', 'Redutor'],
  },
  {
    name: 'Fechamento fixo',
    measures: ['comprimento', 'altura'],
    materiais: ['Policarbonato alveolar', 'Policarbonato compacto', 'Lona'],
    estruturas: ['aluminio'],
    acessorios: [],
  },
  {
    name: 'Janela',
    measures: ['comprimento', 'altura'],
    materiais: ['Policarbonato alveolar', 'Policarbonato compacto'],
    estruturas: ['aluminio'],
    acessorios: [],
  },
  {
    name: 'Cortina enrolável',
    measures: ['comprimento', 'altura'],
    materiais: ['Lona'],
    estruturas: ['aco'],
    acessorios: ['Manivela', 'Redutor', 'Mola'],
  },
  {
    name: 'Troca de policarbonato',
    measures: ['comprimento', 'largura'],
    materiais: ['Policarbonato alveolar', 'Policarbonato compacto'],
    estruturas: [],
    acessorios: [],
  },
  {
    name: 'Troca de lona',
    measures: ['comprimento', 'altura'],  // default cortina; user can change
    materiais: ['Lona'],
    estruturas: [],
    acessorios: [],
  },
  {
    name: 'Serviço de reparo',
    measures: [],
    materiais: [],
    estruturas: [],
    acessorios: [],
  },
]

export const ESTRUTURA_ALUMINIO = {
  label: 'Alumínio',
  cores: ['Branco', 'Preto', 'Bronze', 'Natural'],
}

export const ESTRUTURA_ACO = {
  label: 'Aço galvanizado',
  cores: ['Cor alumínio', 'Branca', 'Preta', 'Cor a definir'],
}

export const COR_POLICARBONATO = ['Cristal', 'Branca', 'Cinza refletivo', 'Bronze', 'Fumê']

export const COR_LONA = '__manual__'  // cliente escolhe na hora

export function getConfigForItem(itemName: string): ItemConfig | undefined {
  return ITENS.find((i) => i.name.toLowerCase() === itemName.toLowerCase())
}

export function getCoresMaterial(material: string): string[] {
  if (material.toLowerCase().includes('policarbonato')) return COR_POLICARBONATO
  if (material.toLowerCase().includes('lona')) return []  // manual
  return []
}
