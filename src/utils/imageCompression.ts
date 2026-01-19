export interface CompressedImage {
  base64: string
  dataUrl: string
  mimeType: string
}

/**
 * Compresses an image file to reduce size for API calls
 * Uses FileReader for better mobile compatibility
 * Target: < 1MB base64 for Netlify function limits
 */
export async function compressImage(file: File): Promise<CompressedImage> {
  console.log('📸 Compression image:', file.name, file.type, file.size)

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    // Timeout pour éviter les blocages sur mobile
    const timeout = setTimeout(() => {
      console.error('⏱️ Timeout lecture fichier')
      reject(new Error('Timeout lors du chargement. Réessaie avec une autre photo.'))
    }, 30000)

    reader.onload = () => {
      clearTimeout(timeout)
      console.log('✅ FileReader terminé')

      try {
        const dataUrl = reader.result as string

        if (!dataUrl || !dataUrl.startsWith('data:')) {
          reject(new Error('Erreur de lecture du fichier'))
          return
        }

        // Créer une image pour la compression
        const img = new Image()

        img.onload = () => {
          console.log('✅ Image chargée:', img.width, 'x', img.height)

          try {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')

            if (!ctx) {
              reject(new Error('Canvas non supporté'))
              return
            }

            // Max 800x800 pour réduire la taille (Netlify limite à 6MB)
            const maxSize = 800
            let width = img.width
            let height = img.height

            if (width > maxSize || height > maxSize) {
              if (width > height) {
                height = Math.round((height / width) * maxSize)
                width = maxSize
              } else {
                width = Math.round((width / height) * maxSize)
                height = maxSize
              }
            }

            canvas.width = width
            canvas.height = height
            ctx.drawImage(img, 0, 0, width, height)

            // Qualité réduite à 0.7 pour mobile
            let quality = 0.7
            let compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
            let base64 = compressedDataUrl.split(',')[1]

            // Si encore trop gros (>800KB), réduire la qualité
            while (base64.length > 800000 && quality > 0.3) {
              quality -= 0.1
              compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
              base64 = compressedDataUrl.split(',')[1]
              console.log(`🔄 Réduction qualité à ${quality.toFixed(1)}, taille: ${Math.round(base64.length / 1024)}KB`)
            }

            if (!base64 || base64.length < 100) {
              console.error('❌ Base64 trop court:', base64?.length)
              reject(new Error('Erreur lors de la compression'))
              return
            }

            console.log('✅ Compression réussie:', Math.round(base64.length / 1024), 'KB')

            resolve({
              base64,
              dataUrl: compressedDataUrl,
              mimeType: 'image/jpeg',
            })
          } catch (err) {
            console.error('❌ Erreur canvas:', err)
            reject(new Error('Erreur lors du traitement'))
          }
        }

        img.onerror = (e) => {
          console.error('❌ Erreur chargement image:', e)

          // Fallback: si l'image ne charge pas, essayer de compresser via canvas quand même
          // Créer une image vide et utiliser le dataUrl original mais compressé
          console.log('🔄 Fallback: tentative de compression du fichier original')

          const base64Original = dataUrl.split(',')[1]

          // Vérifier si le fichier original n'est pas trop gros
          if (base64Original && base64Original.length > 100) {
            if (base64Original.length > 3000000) { // > 3MB
              reject(new Error('Image trop volumineuse et format non supporté. Utilise une photo JPG ou PNG.'))
            } else {
              resolve({
                base64: base64Original,
                dataUrl,
                mimeType: file.type || 'image/jpeg',
              })
            }
          } else {
            reject(new Error('Format d\'image non supporté. Essaie avec une photo JPG ou PNG.'))
          }
        }

        // Charger l'image depuis le dataUrl
        img.src = dataUrl
      } catch (err) {
        console.error('❌ Erreur traitement:', err)
        reject(new Error('Erreur lors du traitement de l\'image'))
      }
    }

    reader.onerror = () => {
      clearTimeout(timeout)
      console.error('❌ Erreur FileReader')
      reject(new Error('Impossible de lire le fichier. Vérifie les permissions.'))
    }

    // Lire le fichier comme DataURL
    reader.readAsDataURL(file)
  })
}

/**
 * Validates that a file is an acceptable image
 * Very lenient for mobile camera captures
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  console.log('🔍 Validation fichier:', file.name, file.type, file.size)

  const maxSize = 20 * 1024 * 1024 // 20MB pour mobile

  // Si pas de type MIME (courant sur mobile), vérifier l'extension
  const extension = file.name.toLowerCase().split('.').pop() || ''
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'bmp']

  // Vérifier si c'est une image
  const isImage = file.type.startsWith('image/') ||
                  file.type === '' ||
                  imageExtensions.includes(extension)

  if (!isImage) {
    return { valid: false, error: 'Format non supporté. Utilise une photo JPG, PNG ou HEIC.' }
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'Image trop lourde (max 20MB). Prends une nouvelle photo.' }
  }

  if (file.size < 500) {
    return { valid: false, error: 'Fichier trop petit ou corrompu.' }
  }

  console.log('✅ Fichier validé')
  return { valid: true }
}
