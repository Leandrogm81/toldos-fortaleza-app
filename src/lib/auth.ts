'use client'

import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export interface Profile {
  id: string
  name: string
  role: 'admin' | 'user'
  phone: string | null
  logo_data_url: string | null
  company_signature_data_url: string | null
}

// Simple global state (not Zustand — keeping it minimal for now)
let currentUser: User | null = null
let currentProfile: Profile | null = null
let listeners: Array<() => void> = []

function notify() {
  listeners.forEach((l) => l())
}

export const auth = {
  getUser: () => currentUser,
  getProfile: () => currentProfile,

  subscribe: (listener: () => void) => {
    listeners.push(listener)
    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  },

  signIn: async (email: string, password: string) => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    currentUser = data.user
    await auth.loadProfile()
    notify()
  },

  signOut: async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    currentUser = null
    currentProfile = null
    notify()
  },

  loadSession: async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    currentUser = session?.user ?? null
    if (currentUser) {
      await auth.loadProfile()
    }
    notify()
  },

  loadProfile: async () => {
    if (!currentUser) return
    const supabase = createClient()
    const { data } = await supabase
      .from('profile')
      .select('*')
      .eq('id', currentUser.id)
      .single()
    currentProfile = data as Profile | null
  },
}
