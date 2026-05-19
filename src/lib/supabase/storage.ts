import { createClient } from '@/lib/supabase/client'

export async function uploadPhoto(
  file: File,
  documentId: string,
  type: 'foto_medicao' | 'foto_instalacao'
): Promise<string> {
  const supabase = createClient()
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${documentId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('attachments')
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (error) throw error

  const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(path)

  await supabase.from('attachment').insert({
    document_id: documentId,
    type,
    storage_path: path,
  })

  return urlData.publicUrl
}

export async function listPhotos(documentId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('attachment')
    .select('id, document_id, type, storage_path, description, created_at')
    .eq('document_id', documentId)
    .order('created_at', { ascending: true })
  return data || []
}

export async function deletePhoto(attachmentId: string, storagePath: string) {
  const supabase = createClient()
  await supabase.storage.from('attachments').remove([storagePath])
  await supabase.from('attachment').delete().eq('id', attachmentId)
}
