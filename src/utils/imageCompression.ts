export interface CompressedImage {
  base64: string
  dataUrl: string
  mimeType: string
}

/**
 * Compresses an image file to reduce size for API calls
 * Max dimensions: 1024x1024, JPEG quality: 0.8
 */
export async function compressImage(file: File): Promise<CompressedImage> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Max 1024x1024 pour réduire tokens API
      const maxSize = 1024
      let width = img.width
      let height = img.height

      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height / width) * maxSize
          width = maxSize
        } else {
          width = (width / height) * maxSize
          height = maxSize
        }
      }

      canvas.width = width
      canvas.height = height
      ctx?.drawImage(img, 0, 0, width, height)

      // Qualité 0.8 pour compression
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
      const base64 = dataUrl.split(',')[1]

      resolve({
        base64,
        dataUrl,
        mimeType: 'image/jpeg',
      })
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    img.src = URL.createObjectURL(file)
  })
}

/**
 * Validates that a file is an acceptable image
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Format non supporté. Utilise JPG, PNG, GIF ou WebP.' }
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'Image trop lourde. Maximum 10MB.' }
  }

  return { valid: true }
}
