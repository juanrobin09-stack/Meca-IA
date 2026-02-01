import { useCallback, useRef } from 'react'
import type { TikTokStandardEvent, TikTokTrackingParams } from '@/types/tiktok'
import { hasAnalyticsConsent } from '@/components/analytics/TikTokPixel'

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
    console.log(`[TikTok Tracking] ${message}`, ...args)
  }
}

/**
 * Internal TTQ type for runtime access
 */
interface TTQRuntime {
  page?: () => void
  track?: (event: string, params?: TikTokTrackingParams) => void
  grantConsent?: () => void
  revokeConsent?: () => void
}

/**
 * Get the TikTok Pixel instance safely
 */
function getTTQ(): TTQRuntime | null {
  if (typeof window !== 'undefined' && window.ttq) {
    return window.ttq as TTQRuntime
  }
  return null
}

/**
 * MECAI Premium Product configuration
 */
const MECAI_PRODUCT = {
  id: 'mecai_premium_monthly',
  name: 'MECAI Premium',
  currency: 'EUR',
  monthlyPrice: 9.99,
  yearlyPrice: 89,
} as const

/**
 * Custom hook for TikTok Pixel tracking
 *
 * Provides type-safe methods for tracking TikTok events with:
 * - Automatic consent checking
 * - Development logging
 * - Deduplication of events
 * - Error handling
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { trackViewContent, trackCompleteRegistration } = useTikTokTracking()
 *
 *   useEffect(() => {
 *     trackViewContent('Landing Page')
 *   }, [])
 *
 *   const handleSignup = async () => {
 *     await signup()
 *     trackCompleteRegistration()
 *   }
 * }
 * ```
 */
export function useTikTokTracking() {
  // Track which events have been fired to prevent duplicates
  const firedEvents = useRef<Set<string>>(new Set())

  /**
   * Generic track function with deduplication
   */
  const trackEvent = useCallback(
    (event: TikTokStandardEvent | string, params?: TikTokTrackingParams, dedupe = false) => {
      try {
        // Check consent
        if (!hasAnalyticsConsent()) {
          devLog(`Event "${event}" skipped - no consent`)
          return false
        }

        // Optional deduplication
        const eventKey = dedupe ? `${event}-${JSON.stringify(params)}` : null
        if (eventKey && firedEvents.current.has(eventKey)) {
          devLog(`Event "${event}" skipped - already fired`)
          return false
        }

        const ttq = getTTQ()
        if (!ttq || typeof ttq.track !== 'function') {
          devLog(`Event "${event}" skipped - pixel not loaded`)
          return false
        }

        ttq.track(event, params)

        if (eventKey) {
          firedEvents.current.add(eventKey)
        }

        devLog(`Event "${event}" fired`, params)
        return true
      } catch (error) {
        if (isDevelopment()) {
          console.error(`[TikTok Tracking] Error tracking "${event}"`, error)
        }
        return false
      }
    },
    []
  )

  /**
   * Track page view
   */
  const trackPageView = useCallback(() => {
    try {
      if (!hasAnalyticsConsent()) return false

      const ttq = getTTQ()
      if (!ttq || typeof ttq.page !== 'function') return false

      ttq.page()
      devLog('Page view tracked')
      return true
    } catch {
      return false
    }
  }, [])

  /**
   * Track ViewContent event
   * Use on: Landing page, product pages, important content pages
   */
  const trackViewContent = useCallback(
    (contentName: string, contentId?: string) => {
      return trackEvent(
        'ViewContent',
        {
          content_name: contentName,
          content_id: contentId,
          content_type: 'page',
        },
        true
      )
    },
    [trackEvent]
  )

  /**
   * Track CompleteRegistration event
   * Use after: Successful freemium signup
   */
  const trackCompleteRegistration = useCallback(
    (contentName = 'MECAI Free Account') => {
      return trackEvent(
        'CompleteRegistration',
        {
          content_name: contentName,
        },
        true
      )
    },
    [trackEvent]
  )

  /**
   * Track InitiateCheckout event
   * Use when: User clicks on subscribe/upgrade button
   */
  const trackInitiateCheckout = useCallback(
    (isYearly = false) => {
      return trackEvent(
        'InitiateCheckout',
        {
          value: isYearly ? MECAI_PRODUCT.yearlyPrice : MECAI_PRODUCT.monthlyPrice,
          currency: MECAI_PRODUCT.currency,
          content_type: 'product',
          content_id: isYearly ? 'mecai_premium_yearly' : MECAI_PRODUCT.id,
          content_name: `${MECAI_PRODUCT.name} ${isYearly ? 'Annuel' : 'Mensuel'}`,
        },
        false // Don't dedupe - user might retry checkout
      )
    },
    [trackEvent]
  )

  /**
   * Track Subscribe event
   * Use after: Successful Stripe payment for subscription
   */
  const trackSubscribe = useCallback(
    (isYearly = false) => {
      return trackEvent(
        'Subscribe',
        {
          value: isYearly ? MECAI_PRODUCT.yearlyPrice : MECAI_PRODUCT.monthlyPrice,
          currency: MECAI_PRODUCT.currency,
          content_type: 'product',
          content_id: isYearly ? 'mecai_premium_yearly' : MECAI_PRODUCT.id,
          content_name: `${MECAI_PRODUCT.name} ${isYearly ? 'Annuel' : 'Mensuel'}`,
        },
        true
      )
    },
    [trackEvent]
  )

  /**
   * Track CompletePayment event
   * Alternative to Subscribe for one-time purchases
   */
  const trackCompletePayment = useCallback(
    (value: number, contentId: string, contentName: string) => {
      return trackEvent(
        'CompletePayment',
        {
          value,
          currency: MECAI_PRODUCT.currency,
          content_type: 'product',
          content_id: contentId,
          content_name: contentName,
        },
        true
      )
    },
    [trackEvent]
  )

  /**
   * Track ClickButton event
   * Use for: Important CTA clicks
   */
  const trackClickButton = useCallback(
    (buttonName: string) => {
      return trackEvent(
        'ClickButton',
        {
          content_name: buttonName,
        },
        false
      )
    },
    [trackEvent]
  )

  /**
   * Grant consent and initialize tracking
   * Call this when user accepts analytics cookies
   */
  const grantConsent = useCallback(() => {
    try {
      const ttq = getTTQ()
      if (ttq && typeof ttq.grantConsent === 'function') {
        ttq.grantConsent()
        devLog('Consent granted')
        return true
      }
      return false
    } catch {
      return false
    }
  }, [])

  /**
   * Revoke consent
   * Call this when user rejects analytics cookies
   */
  const revokeConsent = useCallback(() => {
    try {
      const ttq = getTTQ()
      if (ttq && typeof ttq.revokeConsent === 'function') {
        ttq.revokeConsent()
        devLog('Consent revoked')
        return true
      }
      return false
    } catch {
      return false
    }
  }, [])

  /**
   * Clear fired events cache
   * Useful for testing or when user logs out
   */
  const clearEventCache = useCallback(() => {
    firedEvents.current.clear()
    devLog('Event cache cleared')
  }, [])

  return {
    // Core tracking methods
    trackEvent,
    trackPageView,

    // Pre-configured MECAI events
    trackViewContent,
    trackCompleteRegistration,
    trackInitiateCheckout,
    trackSubscribe,
    trackCompletePayment,
    trackClickButton,

    // Consent management
    grantConsent,
    revokeConsent,

    // Utility
    clearEventCache,
  }
}

export default useTikTokTracking
