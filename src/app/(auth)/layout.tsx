'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { auth } from '@/lib/auth'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

const publicPages = ['/login', '/orcamento']

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(auth.getUser())

  useEffect(() => {
    const unsub = auth.subscribe(() => {
      setUser(auth.getUser())
    })

    auth.loadSession().finally(() => setLoading(false))

    return unsub
  }, [])

  useEffect(() => {
    if (loading) return
    const isPublic = publicPages.some((p) => pathname.startsWith(p))
    if (!user && !isPublic) {
      router.push('/login')
    }
  }, [user, loading, pathname, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="animate-spin w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  const isPublic = publicPages.some((p) => pathname.startsWith(p))
  if (isPublic) return <>{children}</>

  if (!user) return null

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
