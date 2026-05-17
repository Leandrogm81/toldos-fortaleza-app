'use client'

import { useEffect, useState } from 'react'

export function InstallPrompt() {
  const [prompt, setPrompt] = useState<any>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setShow(false)
    setPrompt(null)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-white border border-gray-300 rounded-xl shadow-lg p-4 z-50">
      <p className="text-sm font-semibold text-gray-900">📱 Instalar app</p>
      <p className="text-xs text-gray-500 mt-1 mb-3">Use como um app nativo no seu celular, com acesso offline.</p>
      <div className="flex gap-2">
        <button onClick={install} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700">
          Instalar
        </button>
        <button onClick={() => setShow(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">
          Depois
        </button>
      </div>
    </div>
  )
}
