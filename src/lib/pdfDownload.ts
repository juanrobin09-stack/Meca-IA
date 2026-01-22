import type { jsPDF } from 'jspdf'

/**
 * Downloads a PDF with proper mobile support
 * Uses Web Share API on mobile for reliable downloads, with fallbacks
 */
export async function downloadPDF(doc: jsPDF, filename: string): Promise<boolean> {
  try {
    // Generate PDF blob
    const pdfBlob = doc.output('blob')

    // Detect mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)

    if (isMobile) {
      // Try Web Share API first (best experience on mobile)
      if (navigator.share && navigator.canShare) {
        const file = new File([pdfBlob], filename, { type: 'application/pdf' })

        // Check if sharing files is supported
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: filename.replace('.pdf', ''),
            })
            console.log('[PDF] Shared successfully via Web Share API')
            return true
          } catch (shareError) {
            // User cancelled or share failed, try fallback
            if ((shareError as Error).name === 'AbortError') {
              console.log('[PDF] Share cancelled by user')
              return false
            }
            console.log('[PDF] Web Share failed, trying fallback:', shareError)
          }
        }
      }

      // Fallback: Open PDF in new tab (user can save from there)
      const blobUrl = URL.createObjectURL(pdfBlob)

      if (isIOS) {
        // iOS: Open in same tab works better for PDF viewing
        // Create a temporary iframe to trigger download
        const iframe = document.createElement('iframe')
        iframe.style.display = 'none'
        iframe.src = blobUrl
        document.body.appendChild(iframe)

        // Also try opening in new tab
        setTimeout(() => {
          window.open(blobUrl, '_blank')
          // Cleanup
          setTimeout(() => {
            document.body.removeChild(iframe)
            URL.revokeObjectURL(blobUrl)
          }, 10000)
        }, 100)

        console.log('[PDF] Opened PDF for iOS')
        return true
      } else {
        // Android: Try download link first, then open
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = filename
        link.target = '_blank'
        link.rel = 'noopener noreferrer'

        // Try triggering download
        document.body.appendChild(link)
        link.click()

        // Give it a moment, then try opening as backup
        setTimeout(() => {
          window.open(blobUrl, '_blank')
        }, 500)

        // Cleanup
        setTimeout(() => {
          document.body.removeChild(link)
          URL.revokeObjectURL(blobUrl)
        }, 5000)

        console.log('[PDF] Triggered download for Android')
        return true
      }
    } else {
      // Desktop: Standard download
      const blobUrl = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link)
        URL.revokeObjectURL(blobUrl)
      }, 100)

      console.log('[PDF] Desktop download triggered')
      return true
    }
  } catch (err) {
    console.error('[PDF] Download error:', err)

    // Last resort: try jsPDF's native save
    try {
      doc.save(filename)
      return true
    } catch (saveErr) {
      console.error('[PDF] Native save also failed:', saveErr)
      throw err
    }
  }
}

/**
 * Check if the device is mobile
 */
export function isMobileDevice(): boolean {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

/**
 * Check if Web Share API with file sharing is available
 */
export function canShareFiles(): boolean {
  if (!navigator.share || !navigator.canShare) return false

  try {
    // Test with a dummy file
    const testFile = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    return navigator.canShare({ files: [testFile] })
  } catch {
    return false
  }
}
