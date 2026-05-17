'use client'

import { useEffect } from 'react'

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/sw.js')
      .then(() => console.log('SW registered'))
      .catch((err) => console.log('SW error:', err))
  }, [])

  return null
}
