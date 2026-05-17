'use client'

import { forwardRef, useImperativeHandle, useRef, useEffect, useCallback, useState } from 'react'

export interface SignaturePadHandle {
  clear: () => void
  getSignature: () => string | undefined
  isEmpty: () => boolean
}

export const SignaturePad = forwardRef<SignaturePadHandle, { width?: number; height?: number }>(
  ({ width = 450, height = 200 }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const isDrawing = useRef(false)
    const lastPos = useRef<{ x: number; y: number } | null>(null)

    const getCoords = useCallback((e: MouseEvent | TouchEvent): { x: number; y: number } | null => {
      if (!canvasRef.current) return null
      const rect = canvasRef.current.getBoundingClientRect()
      if (e instanceof MouseEvent) {
        return { x: e.clientX - rect.left, y: e.clientY - rect.top }
      }
      if (e.touches && e.touches[0]) {
        return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
      }
      return null
    }, [])

    const startDrawing = useCallback((e: MouseEvent | TouchEvent) => {
      e.preventDefault()
      const coords = getCoords(e)
      if (!coords) return
      isDrawing.current = true
      lastPos.current = coords
    }, [getCoords])

    const draw = useCallback((e: MouseEvent | TouchEvent) => {
      if (!isDrawing.current) return
      e.preventDefault()
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      const coords = getCoords(e)
      if (!ctx || !coords || !lastPos.current) return

      ctx.beginPath()
      ctx.moveTo(lastPos.current.x, lastPos.current.y)
      ctx.lineTo(coords.x, coords.y)
      ctx.stroke()
      lastPos.current = coords
    }, [getCoords])

    const stopDrawing = useCallback(() => {
      isDrawing.current = false
      lastPos.current = null
    }, [])

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const dpr = window.devicePixelRatio || 1
      canvas.width = width * dpr
      canvas.height = height * dpr
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.scale(dpr, dpr)

      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      canvas.addEventListener('mousedown', startDrawing)
      canvas.addEventListener('mousemove', draw)
      canvas.addEventListener('mouseup', stopDrawing)
      canvas.addEventListener('mouseleave', stopDrawing)
      canvas.addEventListener('touchstart', startDrawing)
      canvas.addEventListener('touchmove', draw)
      canvas.addEventListener('touchend', stopDrawing)

      return () => {
        canvas.removeEventListener('mousedown', startDrawing)
        canvas.removeEventListener('mousemove', draw)
        canvas.removeEventListener('mouseup', stopDrawing)
        canvas.removeEventListener('mouseleave', stopDrawing)
        canvas.removeEventListener('touchstart', startDrawing)
        canvas.removeEventListener('touchmove', draw)
        canvas.removeEventListener('touchend', stopDrawing)
      }
    }, [width, height, startDrawing, draw, stopDrawing])

    useImperativeHandle(ref, () => ({
      clear: () => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (ctx && canvas) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
      },
      getSignature: () => {
        const canvas = canvasRef.current
        if (!canvas) return undefined
        const ctx = canvas.getContext('2d')
        if (!ctx) return undefined

        const pixelBuffer = new Uint32Array(
          ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer
        )
        const empty = !pixelBuffer.some((color) => color !== 0)
        if (empty) return undefined

        return canvas.toDataURL('image/png')
      },
      isEmpty: () => {
        const canvas = canvasRef.current
        if (!canvas) return true
        const ctx = canvas.getContext('2d')
        if (!ctx) return true
        const pixelBuffer = new Uint32Array(
          ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer
        )
        return !pixelBuffer.some((color) => color !== 0)
      },
    }))

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-400 rounded-lg bg-white touch-none"
        style={{ width, height }}
      />
    )
  }
)
SignaturePad.displayName = 'SignaturePad'

// --- Signature Modal ---

export function SignatureModal({
  isOpen,
  onClose,
  onSave,
  onSaveProfile,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (dataUrl: string, saveToProfile?: boolean) => void
  onSaveProfile?: (dataUrl: string) => Promise<void>
}) {
  const signaturePadRef = useRef<SignaturePadHandle>(null)
  const [saveProfile, setSaveProfile] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  const handleSave = async () => {
    if (signaturePadRef.current) {
      const signature = signaturePadRef.current.getSignature()
      if (signature) {
        if (saveProfile && onSaveProfile) {
          setSavingProfile(true)
          await onSaveProfile(signature)
          setSavingProfile(false)
        }
        onSave(signature, saveProfile)
      } else {
        alert('Por favor, forneça uma assinatura.')
      }
    }
  }

  const handleClear = () => {
    signaturePadRef.current?.clear()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-lg">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Assine aqui</h3>
        <div className="flex justify-center mb-4">
          <SignaturePad ref={signaturePadRef} width={450} height={200} />
        </div>
        {onSaveProfile && (
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input type="checkbox" checked={saveProfile} onChange={(e) => setSaveProfile(e.target.checked)}
              className="h-4 w-4 text-sky-600 border-gray-300 rounded" />
            <span className="text-sm text-gray-700">Salvar esta assinatura no meu perfil</span>
          </label>
        )}
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <button onClick={handleClear} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
            Limpar
          </button>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={savingProfile} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:bg-sky-300">
            {savingProfile ? 'Salvando...' : 'Salvar Assinatura'}
          </button>
        </div>
      </div>
    </div>
  )
}
