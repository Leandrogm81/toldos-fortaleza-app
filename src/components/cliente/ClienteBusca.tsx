'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Client } from '@/types/client'

interface ClienteBuscaProps {
  onSelect: (client: Client) => void
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
}

export function ClienteBusca({ onSelect, placeholder = 'Buscar cliente...', value, onChange }: ClienteBuscaProps) {
  const [query, setQuery] = useState(value || '')
  const [results, setResults] = useState<Client[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Sync external value
  useEffect(() => {
    if (value !== undefined) setQuery(value)
  }, [value])

  const search = async (term: string) => {
    if (term.length < 2) {
      setResults([])
      setOpen(false)
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('client')
      .select('id, name, phone, city, doc_type, cpf, cnpj, address, neighborhood, cep, rg, ie')
      .or(`name.ilike.%${term}%,phone.ilike.%${term}%`)
      .limit(5)

    setResults(data || [])
    setOpen(true)
    setSelectedIndex(-1)
    setLoading(false)
  }

  const handleChange = (val: string) => {
    setQuery(val)
    onChange?.(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 300)
  }

  const handleSelect = (client: Client) => {
    setQuery(client.name)
    setOpen(false)
    onSelect(client)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      handleSelect(results[selectedIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  // Click outside to close
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative">
      <div className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
        />
        {loading && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {results.map((client, index) => (
            <button
              key={client.id}
              onClick={() => handleSelect(client)}
              className={`w-full text-left px-4 py-3 hover:bg-sky-50 transition-colors ${
                index === selectedIndex ? 'bg-sky-50' : ''
              } ${index > 0 ? 'border-t border-gray-100' : ''}`}
            >
              <p className="text-sm font-medium text-gray-900">{client.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {client.phone}
                {client.city ? ` • ${client.city}` : ''}
                <span className={`ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  client.doc_type === 'pj' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {client.doc_type === 'pj' ? 'PJ' : 'PF'}
                </span>
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
