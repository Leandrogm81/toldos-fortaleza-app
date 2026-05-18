'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { listPhotos, deletePhoto } from '@/lib/supabase/storage'

interface PhotoGalleryProps {
  documentId: string
  refreshKey?: number
}

export function PhotoGallery({ documentId, refreshKey }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState<string | null>(null)

  useEffect(() => {
    loadPhotos()
  }, [documentId, refreshKey])

  async function loadPhotos() {
    setLoading(true)
    const data = await listPhotos(documentId)
    setPhotos(data)
    setLoading(false)
  }

  async function handleDelete(id: string, path: string) {
    if (!confirm('Excluir esta foto?')) return
    await deletePhoto(id, path)
    setPhotos((prev) => prev.filter((p) => p.id !== id))
  }

  function getPublicUrl(storagePath: string): string {
    const supabase = createClient()
    const { data } = supabase.storage.from('attachments').getPublicUrl(storagePath)
    return data.publicUrl
  }

  const typeLabels: Record<string, string> = {
    foto_medicao: 'Medição',
    foto_instalacao: 'Instalação',
  }
  const typeColors: Record<string, string> = {
    foto_medicao: 'bg-blue-100 text-blue-700',
    foto_instalacao: 'bg-green-100 text-green-700',
  }

  if (loading) {
    return <p className="text-sm text-gray-400 py-3">Carregando fotos...</p>
  }

  if (photos.length === 0) {
    return <p className="text-sm text-gray-400 py-3">Nenhuma foto neste pedido.</p>
  }

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {photos.map((photo) => {
          const url = getPublicUrl(photo.storage_path)
          return (
            <div key={photo.id} className="relative group">
              <div
                className="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100 cursor-pointer"
                onClick={() => setLightbox(url)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={typeLabels[photo.type] || 'Foto'}
                  className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                  loading="lazy"
                />
              </div>
              <span
                className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${typeColors[photo.type] || 'bg-gray-100 text-gray-600'}`}
              >
                {typeLabels[photo.type] || photo.type}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(photo.id, photo.storage_path) }}
                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                title="Excluir"
              >
                ✕
              </button>
              <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                {new Date(photo.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          )
        })}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-50"
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="Foto ampliada"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
