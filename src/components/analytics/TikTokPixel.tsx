import { useEffect, useRef } from 'react'

// TikTok Pixel ID
const TIKTOK_PIXEL_ID = 'D5VJ013C77U3UMFCQHTG'

// Cookie consent key (same as CookieBanner.tsx)
const COOKIE_CONSENT_KEY = 'mecaia-cookies-accepted'

/**
 * Check if user has given consent for analytics cookies
 */
function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false
  const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
  return consent === 'all'
}

/**
 * Check if we're in development mode
 */
function isDevelopment(): boolean {
  return import.meta.env.DEV
}

/**
 * Log messages only in development
 */
function devLog(message: string, ...args: unknown[]): void {
  if (isDevelopment()) {
    console.log(`[TikTok Pixel] ${message}`, ...args)
  }
}

/**
 * Log errors - always in dev, silently fail in prod
 */
function logError(message: string, error?: unknown): void {
  if (isDevelopment()) {
    console.error(`[TikTok Pixel] ${message}`, error)
  }
}

/**
 * Initialize the TikTok Pixel script
 * This function sets up the ttq object and loads the TikTok analytics script
 */
function initializeTikTokPixel(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    const d = document
    const t = 'ttq'

    // If already initialized, skip
    if (w[t] && typeof w[t].load === 'function') {
      devLog('Already initialized, skipping')
      return
    }

    w.TiktokAnalyticsObject = t
    const ttq = (w[t] = w[t] || [])
    ttq.methods = [
      'page',
      'track',
      'identify',
      'instances',
      'debug',
      'on',
      'off',
      'once',
      'ready',
      'alias',
      'group',
      'enableCookie',
      'disableCookie',
      'holdConsent',
      'revokeConsent',
      'grantConsent',
    ]

    ttq.setAndDefer = function (
      target: Record<string, unknown> & { push?: (args: unknown[]) => void },
      method: string
    ) {
      target[method] = function (...args: unknown[]) {
        if (target.push) {
          target.push([method, ...args])
        }
      }
    }

    for (let i = 0; i < ttq.methods.length; i++) {
      ttq.setAndDefer(ttq, ttq.methods[i])
    }

    ttq.instance = function (pixelId: string) {
      const e = ttq._i?.[pixelId] || []
      for (let n = 0; n < ttq.methods.length; n++) {
        ttq.setAndDefer(e, ttq.methods[n])
      }
      return e
    }

    ttq.load = function (pixelId: string, options?: { partner?: string }) {
      const scriptUrl = 'https://analytics.tiktok.com/i18n/pixel/events.js'
      ttq._i = ttq._i || {}
      ttq._i[pixelId] = []
      ttq._i[pixelId]._u = scriptUrl
      ttq._t = ttq._t || {}
      ttq._t[pixelId] = +new Date()
      ttq._o = ttq._o || {}
      ttq._o[pixelId] = options || {}

      const script = d.createElement('script')
      script.type = 'text/javascript'
      script.async = true
      script.src = `${scriptUrl}?sdkid=${pixelId}&lib=${t}`

      // Handle script loading errors gracefully
      script.onerror = () => {
        logError('Failed to load TikTok Pixel script')
      }

      const firstScript = d.getElementsByTagName('script')[0]
      firstScript?.parentNode?.insertBefore(script, firstScript)
    }

    // Load pixel and track initial page view
    ttq.load(TIKTOK_PIXEL_ID)
    ttq.page()

    devLog('Initialized successfully with ID:', TIKTOK_PIXEL_ID)
  } catch (error) {
    logError('Error initializing TikTok Pixel', error)
  }
}

/**
 * TikTok Pixel Component
 *
 * This component handles the initialization of TikTok Pixel with:
 * - RGPD/GDPR compliance: Only loads if user has given consent
 * - Async loading: Does not block the main thread
 * - Error handling: Fails silently in production
 * - Development logging: Helpful debug messages in dev mode
 */
export default function TikTokPixel() {
  const initialized = useRef(false)

  useEffect(() => {
    // Prevent double initialization
    if (initialized.current) return

    // Check for cookie consent (RGPD compliance)
    if (!hasAnalyticsConsent()) {
      devLog('No analytics consent, skipping initialization')
      return
    }

    // Initialize pixel asynchronously to not block rendering
    let timeoutId: number | ReturnType<typeof setTimeout>

    if (typeof requestIdleCallback !== 'undefined') {
      timeoutId = requestIdleCallback(() => {
        initializeTikTokPixel()
        initialized.current = true
      })
    } else {
      timeoutId = setTimeout(() => {
        initializeTikTokPixel()
        initialized.current = true
      }, 0)
    }

    return () => {
      if (typeof requestIdleCallback !== 'undefined') {
        cancelIdleCallback(timeoutId as number)
      } else {
        clearTimeout(timeoutId)
      }
    }
  }, [])

  // Listen for consent changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === COOKIE_CONSENT_KEY &&
        e.newValue === 'all' &&
        !initialized.current
      ) {
        devLog('Consent granted, initializing')
        initializeTikTokPixel()
        initialized.current = true
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // This component doesn't render anything
  return null
}

// Export utility for checking consent
export { hasAnalyticsConsent, TIKTOK_PIXEL_ID }
