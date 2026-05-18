'use client'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, title, message, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6 text-lg">{message}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            className="px-6 py-3 text-base font-medium text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-3 text-base font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
          >
            Sim, excluir
          </button>
        </div>
      </div>
    </div>
  )
}
