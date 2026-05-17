import { jsPDF } from 'jspdf'

export async function generatePDF(elementId: string, filename: string): Promise<void> {
  // Dynamic import to avoid SSR issues
  const html2canvas = (await import('html2canvas')).default

  const printElement = document.getElementById(elementId)
  if (!printElement) {
    alert('Elemento do documento não encontrado. Recarregue a página.')
    return
  }

  // Clone and render offscreen at A4 width
  const clone = printElement.cloneNode(true) as HTMLElement
  const tempContainer = document.createElement('div')
  tempContainer.style.position = 'absolute'
  tempContainer.style.left = '-9999px'
  tempContainer.style.top = '0'
  tempContainer.style.width = '794px'
  tempContainer.style.backgroundColor = 'white'
  document.body.appendChild(tempContainer)
  tempContainer.appendChild(clone)

  try {
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const imgRatio = canvas.width / canvas.height
    const margin = 8
    let imgW = pdfWidth - margin * 2
    let imgH = imgW / imgRatio

    if (imgH > pdfHeight - margin * 2) {
      imgH = pdfHeight - margin * 2
      imgW = imgH * imgRatio
    }

    pdf.addImage(imgData, 'PNG', margin, margin, imgW, imgH)
    pdf.save(filename)
  } catch (err: any) {
    console.error('PDF error:', err)
    alert('Erro ao gerar PDF: ' + (err?.message || 'Erro desconhecido. Tente novamente.'))
  } finally {
    if (document.body.contains(tempContainer)) {
      document.body.removeChild(tempContainer)
    }
  }
}

export function printPDF() {
  window.print()
}

export function downloadTxtContent(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
