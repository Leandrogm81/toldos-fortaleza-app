export function formatCpf(value: string): string {
  const v = value.replace(/\D/g, '').slice(0, 11)
  if (v.length <= 3) return v
  if (v.length <= 6) return `${v.slice(0, 3)}.${v.slice(3)}`
  if (v.length <= 9) return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6)}`
  return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`
}

export function formatCnpj(value: string): string {
  const v = value.replace(/\D/g, '').slice(0, 14)
  if (v.length <= 2) return v
  if (v.length <= 5) return `${v.slice(0, 2)}.${v.slice(2)}`
  if (v.length <= 8) return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5)}`
  if (v.length <= 12) return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8)}`
  return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8, 12)}-${v.slice(12)}`
}

export function formatPhone(value: string): string {
  const v = value.replace(/\D/g, '').slice(0, 11)
  if (v.length <= 10) {
    return v.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2').slice(0, 14)
  }
  return v.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15)
}

export function formatCep(value: string): string {
  return value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9)
}

export function formatDate(value: string): string {
  const v = value.replace(/\D/g, '').slice(0, 8)
  if (v.length <= 2) return v
  if (v.length <= 4) return `${v.slice(0, 2)}/${v.slice(2)}`
  return `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`
}

export function formatCurrency(value: string): { display: string; text: string } {
  const numbersOnly = value.replace(/\D/g, '')
  if (!numbersOnly) return { display: '', text: '' }
  const numberValue = parseInt(numbersOnly, 10) / 100
  const display = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numberValue)
  const text = numberToWordsPtBr(numberValue)
  return { display, text }
}

export function parseCurrencyToNumber(value: string): number {
  return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0
}

// --- Valor por extenso (portado do app antigo) ---

function getExtensive(n: number): string {
  const units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove']
  const teens = ['dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove']
  const tens = ['', 'dez', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa']
  const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos']

  if (n === 0) return ''
  if (n === 100) return 'cem'

  let str = ''
  const c = Math.floor(n / 100)
  const d = Math.floor((n % 100) / 10)
  const u = n % 10

  if (c > 0) {
    str += hundreds[c]
    if (d > 0 || u > 0) str += ' e '
  }
  if (d === 1 && u > 0) {
    str += teens[u]
  } else {
    if (d > 0) {
      str += tens[d]
      if (u > 0) str += ' e '
    }
    if (u > 0) str += units[u]
  }
  return str
}

export function numberToWordsPtBr(num: number): string {
  if (!isFinite(num)) return ''

  const integerPart = Math.floor(num)
  const decimalPart = Math.round((num - integerPart) * 100)

  let result = ''

  if (integerPart > 0) {
    const thousands = Math.floor(integerPart / 1000)
    const rest = integerPart % 1000

    if (thousands > 0) {
      if (thousands === 1) {
        result += 'mil'
      } else {
        result += getExtensive(thousands) + ' mil'
      }
      if (rest > 0) result += rest < 100 || rest % 100 === 0 ? ' e ' : ' '
    }

    result += getExtensive(rest)
    result += integerPart === 1 ? ' real' : ' reais'
  }

  if (decimalPart > 0) {
    if (integerPart > 0) result += ' e '
    result += getExtensive(decimalPart)
    result += decimalPart === 1 ? ' centavo' : ' centavos'
  }

  if (result === '') return 'zero'
  return result.charAt(0).toUpperCase() + result.slice(1)
}
