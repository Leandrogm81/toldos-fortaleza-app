'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type FieldType = 'item' | 'estrutura' | 'material' | 'acessorio'

interface ProductAutocompleteProps {
  type: FieldType
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function ProductAutocomplete({ type, value, onChange, placeholder }: ProductAutocompleteProps) {
  const [options, setOptions] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Load options
  useEffect(() => {
    loadOptions()
  }, [type])

  async function loadOptions() {
    const supabase = createClient()
    const { data } = await supabase
      .from('product_field')
      .select('value')
      .eq('field_type', type)
      .order('created_at', { ascending: false })
      .limit(30)
    setOptions((data || []).map((d) => d.value))
  }

  // Sync external value
  useEffect(() => {
    setQuery(value)
  }, [value])

  // Click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (listRef.current && !listRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = query
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options

  const handleSelect = async (val: string) => {
    onChange(val)
    setQuery(val)
    setOpen(false)
    // Save new value to database if it doesn't exist
    if (!options.includes(val) && val.trim()) {
      const supabase = createClient()
      await supabase.from('product_field').upsert(
        { field_type: type, value: val.trim() },
        { onConflict: 'field_type,value' }
      )
      loadOptions()
    }
  }

  const handleBlur = () => {
    // Save current value on blur if it's new
    if (query.trim() && !options.includes(query.trim())) {
      handleSelect(query.trim())
    }
    setTimeout(() => setOpen(false), 200)
  }

  const placeholders: Record<FieldType, string> = {
    item: 'Ex: Cobertura Retrátil',
    estrutura: 'Ex: Alumínio branco',
    material: 'Ex: Policarbonato 6mm',
    acessorio: 'Ex: Calha, Rufo',
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        placeholder={placeholder || placeholders[type]}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
      />
      {open && filtered.length > 0 && query.length >= 1 && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto"
        >
          {filtered.slice(0, 8).map((opt) => (
            <button
              key={opt}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(opt) }}
              className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-sky-50 transition-colors"
            >
              {opt}
            </button>
          ))}
          {query.trim() && !filtered.includes(query.trim()) && (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(query.trim()) }}
              className="block w-full text-left px-3 py-2 text-sm text-sky-600 hover:bg-sky-50 border-t border-gray-100 transition-colors"
            >
              + Adicionar "{query.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  )
}
