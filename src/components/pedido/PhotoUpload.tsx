'use client'

import { useState, useRef } from 'react'
import { uploadPhoto } from '@/lib/supabase/storage'

interface PhotoUploadProps {
  documentId: string
  onUploaded: () => void
}

export function PhotoUpload({ documentId, onUploaded }: PhotoUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [type, setType] = useState<'foto_medicao' | 'foto_instalacao'>('foto_medicao')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []).slice(0, 10)
    setFiles(selected)
  }

  const handleUpload = async () => {
    if (files.length === 0) return
    setUploading(true)
    setProgress(0)

    let done = 0
    for (const file of files) {
      try {
        await uploadPhoto(file, documentId, type)
      } catch (err) {
        console.error('Upload error:', err)
      }
      done++
      setProgress(Math.round((done / files.length) * 100))
    }

    setFiles([])
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
    onUploaded()
  }

  return (
    <div className="space-y-3">
      {/* Type selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Tipo:</label>
        {(['foto_medicao', 'foto_instalacao'] as const).map((t) => (
          <label key={t} className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="photoType"
              value={t}
              checked={type === t}
              onChange={() => setType(t)}
              className="h-3.5 w-3.5 text-sky-600"
            />
            <span className="text-sm text-gray-600">
              {t === 'foto_medicao' ? 'Medição' : 'Instalação'}
            </span>
          </label>
        ))}
      </div>

      {/* File input */}
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleSelect}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"
        />
        {files.length > 0 && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 disabled:bg-sky-300 whitespace-nowrap"
          >
            {uploading ? `Enviando ${progress}%` : `Enviar (${files.length})`}
          </button>
        )}
      </div>

      {/* Preview */}
      {files.length > 0 && !uploading && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {files.map((file, i) => (
            <div key={i} className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
              <img
                src={URL.createObjectURL(file)}
                alt={`Preview ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Progress bar */}
      {uploading && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-sky-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}
