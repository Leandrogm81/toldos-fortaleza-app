# Sprint 6.1 — Fotos por Pedido

**Projeto:** Toldos Fortaleza App  
**Duração estimada:** 2 dias  
**Dependências:** Sprint 3 (pedidos existem)
**Objetivo:** Upload de fotos da galeria do celular, organizadas por pedido, salvas no Supabase Storage + banco.

---

## Tarefas

### 6.1.1 Configurar Storage no Supabase

- [ ] Criar bucket `attachments` no Dashboard do Supabase
- [ ] Executar políticas SQL no Editor:

```sql
-- Permitir upload para usuários autenticados
CREATE POLICY "attachments_upload" ON storage.objects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Permitir leitura para usuários autenticados
CREATE POLICY "attachments_select" ON storage.objects
  FOR SELECT USING (auth.role() = 'authenticated');

-- Permitir deleção para o dono
CREATE POLICY "attachments_delete" ON storage.objects
  FOR DELETE USING (auth.role() = 'authenticated');
```

**Validação:** Fazer upload de uma imagem via Supabase Dashboard e ver URL pública.

---

### 6.1.2 Criar utilitários de Storage

- [ ] Criar `src/lib/supabase/storage.ts`:

```ts
import { createClient } from '@/lib/supabase/client'

export async function uploadPhoto(file: File, documentId: string, type: 'foto_medicao' | 'foto_instalacao'): Promise<string | null> {
  const supabase = createClient()
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${documentId}/${Date.now()}.${ext}`
  
  const { data, error } = await supabase.storage
    .from('attachments')
    .upload(path, file, { cacheControl: '3600', upsert: false })
  
  if (error) throw error
  
  // Get public URL
  const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(path)
  
  // Save attachment record
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
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: true })
  return data || []
}

export async function deletePhoto(attachmentId: string, storagePath: string) {
  const supabase = createClient()
  await supabase.storage.from('attachments').remove([storagePath])
  await supabase.from('attachment').delete().eq('id', attachmentId)
}
```

---

### 6.1.3 Criar Componente PhotoUpload

- [ ] Criar `src/components/pedido/PhotoUpload.tsx`:

**Funcionalidades:**
- Input file com `accept="image/*"` e `multiple`
- Opção `capture="environment"` para abrir câmera no mobile
- Preview das fotos selecionadas antes do upload (thumbnail grid)
- Barra de progresso durante upload
- Seleção do tipo: "Foto da Medição" ou "Foto da Instalação" (radio buttons)
- Botão "Enviar fotos" que chama `uploadPhoto` para cada arquivo
- Feedback visual: toast simples (alert ou div) de sucesso/erro
- Limitar a 10 fotos por vez

**Validação:** 
- Selecionar 3 fotos → preview aparece → clicar Enviar → fotos aparecem no Supabase Storage

---

### 6.1.4 Criar Componente PhotoGallery

- [ ] Criar `src/components/pedido/PhotoGallery.tsx`:

**Funcionalidades:**
- Grid de 3 colunas com thumbnails (CSS grid)
- Cada foto mostra: miniatura + badge do tipo (medição = azul, instalação = verde) + data
- Clique na foto → abre lightbox (imagem em tela cheia com overlay escuro)
- Botão "X" em cada foto para excluir (confirmação)
- Botão "Remover" dentro do lightbox
- Estado vazio: "Nenhuma foto neste pedido"
- Carrega fotos do Supabase via `listPhotos(documentId)`

**Validação:**
- Grid renderiza fotos salvas
- Clique abre lightbox com overlay escuro
- Excluir remove foto do storage + banco

---

### 6.1.5 Integrar no Detalhe do Pedido

- [ ] Modificar `src/app/(auth)/pedidos/[id]/page.tsx`:

Adicionar seção "Fotos" abaixo do preview do documento:
```tsx
{/* Fotos Section */}
<div className="bg-white rounded-xl border border-gray-200 p-4">
  <h2 className="text-lg font-semibold text-gray-900 mb-3">📸 Fotos</h2>
  <PhotoUpload documentId={id} onUploaded={loadPhotos} />
  <PhotoGallery documentId={id} />
</div>
```

- O `PhotoGallery` carrega as fotos automaticamente no mount
- Após upload no `PhotoUpload`, recarregar a galeria

**Validação:**
- Abrir pedido existente → seção Fotos aparece
- Upload de foto → aparece na galeria
- Excluir foto → some da galeria
- Recarregar página → fotos persistem

---

### 6.1.6 Compressão de Imagens (Opcional, mas recomendado)

- [ ] Comprimir imagens antes do upload para reduzir storage:

```ts
async function compressImage(file: File, maxWidth = 1920): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const scale = Math.min(1, maxWidth / img.width)
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => {
          resolve(new File([blob!], file.name, { type: 'image/jpeg' }))
        }, 'image/jpeg', 0.85)
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}
```

---

## Aceitação do Sprint

- [ ] Bucket `attachments` criado no Supabase com políticas
- [ ] Utilitários de storage funcionais (upload, list, delete)
- [ ] `PhotoUpload` permite selecionar múltiplas fotos e fazer upload
- [ ] `PhotoGallery` mostra grid de fotos com lightbox
- [ ] Fotos aparecem no detalhe do pedido (`/pedidos/[id]`)
- [ ] Excluir foto funciona (remove do storage + banco)
- [ ] Fotos persistem após reload
- [ ] Compressão aplicada antes do upload

---

## Notas Técnicas

### Por que Supabase Storage e não base64 no JSONB?

Base64 no JSONB do `doc_data` tornaria o documento gigante (63KB só o logo). Fotos de medição seriam múltiplos MB. O Supabase Storage foi feito para isso — URLs públicas, cache CDN, sem impacto no banco.

### Bucket público vs privado

Bucket público (`public: true`) significa que qualquer um com a URL pode ver a foto. Como as fotos são de obras/toldos (não dados sensíveis), isso é aceitável e simplifica o carregamento no frontend (basta um `<img src={url}>`).

### Limite de upload no free tier

Supabase free tier: 1GB storage, 2GB transfer/mês. Fotos comprimidas a ~200KB cada = ~5000 fotos. Suficiente para o uso atual.
