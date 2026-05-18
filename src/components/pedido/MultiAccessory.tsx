'use client'

import { useState } from 'react'
import { ProductAutocomplete } from './ProductAutocomplete'

interface MultiAccessoryProps {
  value: string  // comma-separated
  onChange: (value: string) => void
}

export function MultiAccessory({ value, onChange }: MultiAccessoryProps) {
  const [inputValue, setInputValue] = useState('')
  const items = value ? value.split(',').map(s => s.trim()).filter(Boolean) : []

  const addItem = (item: string) => {
    const trimmed = item.trim()
    if (!trimmed || items.includes(trimmed)) return
    onChange([...items, trimmed].join(', '))
    setInputValue('')
  }

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx).join(', '))
  }

  return (
    <div className="space-y-2">
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {items.map((acc, ai) => (
            <span key={ai} className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full text-xs">
              {acc}
              <button type="button" onClick={() => removeItem(ai)} className="text-sky-400 hover:text-red-500">✕</button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-1">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem(inputValue) } }}
          placeholder="Buscar ou digitar..."
          className="block flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          list={`acc-list`}
        />
        <button type="button" onClick={() => addItem(inputValue)}
          className="px-3 py-2 text-xs font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 whitespace-nowrap">
          + Add
        </button>
      </div>
    </div>
  )
}
