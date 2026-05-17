export async function generatePDF(elementId: string, filename: string): Promise<void> {
  const html2canvas = (await import('html2canvas')).default
  const { jsPDF } = await import('jspdf')

  const printElement = document.getElementById(elementId)
  if (!printElement) throw new Error('Element not found')

  const clone = printElement.cloneNode(true) as HTMLElement
  const tempContainer = document.createElement('div')
  const a4WidthPx = 794

  tempContainer.style.position = 'absolute'
  tempContainer.style.left = '-9999px'
  tempContainer.style.top = '0px'
  tempContainer.style.width = `${a4WidthPx}px`
  document.body.appendChild(tempContainer)
  tempContainer.appendChild(clone)

  try {
    const canvas = await html2canvas(clone, { scale: 2, useCORS: true })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const ratio = canvas.width / canvas.height
    const margin = 10
    let imgWidth = pdfWidth - margin * 2
    let imgHeight = imgWidth / ratio

    if (imgHeight > pdfHeight - margin * 2) {
      imgHeight = pdfHeight - margin * 2
      imgWidth = imgHeight * ratio
    }

    const x = (pdfWidth - imgWidth) / 2
    const y = margin

    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight)
    pdf.save(filename)
  } finally {
    if (document.body.contains(tempContainer)) {
      document.body.removeChild(tempContainer)
    }
  }
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
