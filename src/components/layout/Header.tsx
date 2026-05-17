'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth, type Profile } from '@/lib/auth'

export function Header() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(auth.getProfile())
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const unsub = auth.subscribe(() => {
      setProfile(auth.getProfile())
    })
    return unsub
  }, [])

  useEffect(() => {
    if (profile) {
      setUserName(profile.name)
    } else if (auth.getUser()?.email) {
      setUserName(auth.getUser()!.email!.split('@')[0])
    }
  }, [profile])

  const handleLogout = async () => {
    await auth.signOut()
    router.push('/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-end gap-4">
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{userName}</p>
          <p className="text-xs text-gray-500">{profile?.role === 'admin' ? 'Administrador' : 'Usuário'}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center">
          <span className="text-sm font-semibold text-sky-700">
            {userName.charAt(0).toUpperCase()}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-gray-500 hover:text-red-600 transition-colors"
          title="Sair"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </header>
  )
}
