'use client'

interface ConversionRateProps {
  totalOrcamentosComVisita: number
  totalConvertidos: number
}

export function ConversionRate({ totalOrcamentosComVisita, totalConvertidos }: ConversionRateProps) {
  const rate = totalOrcamentosComVisita > 0 ? Math.round((totalConvertidos / totalOrcamentosComVisita) * 100) : 0

  return (
    <div className="text-center py-4">
      <p className="text-sm text-gray-500 mb-2">Orçamentos com visita → Pedidos</p>
      <div className="relative w-28 h-28 mx-auto">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e5e7eb" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.5"
            fill="none"
            stroke="#16a34a"
            strokeWidth="3"
            strokeDasharray={`${rate} 100`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{rate}%</span>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        {totalConvertidos} de {totalOrcamentosComVisita} orçamentos
      </p>
    </div>
  )
}
