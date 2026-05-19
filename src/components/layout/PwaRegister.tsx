'use client'

import { useEffect } from 'react'

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/sw.js')
      .catch(() => {
        // Service worker registration failed silently
      })
  }, [])

  return null
}
