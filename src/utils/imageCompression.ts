export interface CompressedImage {
  base64: string
  dataUrl: string
  mimeType: string
}

/**
 * Compresses an image file to reduce size for API calls
 * Max dimensions: 1024x1024, JPEG quality: 0.8
 * Optimized for mobile camera captures
 */
export async function compressImage(file: File): Promise<CompressedImage> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    // Timeout for mobile browsers that might hang
    const timeout = setTimeout(() => {
      reject(new Error('Timeout lors du chargement de l\'image. Réessaie.'))
    }, 30000)

    // Create object URL
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      clearTimeout(timeout)
      URL.revokeObjectURL(objectUrl)

      try {
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

        if (!base64 || base64.length < 100) {
          reject(new Error('Erreur lors de la compression de l\'image'))
          return
        }

        resolve({
          base64,
          dataUrl,
          mimeType: 'image/jpeg',
        })
      } catch (err) {
        reject(new Error('Erreur lors du traitement de l\'image'))
      }
    }

    img.onerror = () => {
      clearTimeout(timeout)
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Impossible de charger l\'image. Vérifie le format.'))
    }

    img.src = objectUrl
  })
}

/**
 * Validates that a file is an acceptable image
 * More lenient for mobile camera captures
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 15 * 1024 * 1024 // 15MB (increased for mobile photos)

  // Allowed MIME types - include HEIC for iOS
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
    ''  // Some mobile browsers don't report MIME type
  ]

  // Check file extension as fallback
  const extension = file.name.toLowerCase().split('.').pop() || ''
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif']

  // If file.type is empty (common on mobile), check extension
  const hasValidType = allowedTypes.includes(file.type) || file.type.startsWith('image/')
  const hasValidExtension = allowedExtensions.includes(extension)

  if (!hasValidType && !hasValidExtension) {
    return { valid: false, error: 'Format non supporté. Utilise JPG, PNG ou une photo de ta galerie.' }
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'Image trop lourde. Maximum 15MB.' }
  }

  if (file.size < 1000) {
    return { valid: false, error: 'Image trop petite ou corrompue.' }
  }

  return { valid: true }
}
