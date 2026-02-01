/**
 * useEventTracking - Hook pour le tracking des événements conversion
 *
 * Permet de suivre le funnel utilisateur pour optimiser la conversion:
 * - Acquisition (landing, signup)
 * - Activation (onboarding, premier diagnostic)
 * - Engagement (diagnostics, chat, devis)
 * - Conversion (paywall, checkout, subscription)
 * - Retention (retour utilisateur, annulation)
 */

import { useCallback, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

// Session ID persistant pour cette session de navigation
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('mecaia_session_id')
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    sessionStorage.setItem('mecaia_session_id', sessionId)
  }
  return sessionId
}

// Événements standardisés pour le funnel
export const CONVERSION_EVENTS = {
  // Acquisition
  LANDING_PAGE_VIEWED: 'landing_page_viewed',
  PRICING_PAGE_VIEWED: 'pricing_page_viewed',
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_COMPLETED: 'signup_completed',
  LOGIN_COMPLETED: 'login_completed',

  // Activation
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_SKIPPED: 'onboarding_skipped',
  FIRST_DIAGNOSTIC_STARTED: 'first_diagnostic_started',
  FIRST_DIAGNOSTIC_COMPLETED: 'first_diagnostic_completed',

  // Engagement
  DIAGNOSTIC_STARTED: 'diagnostic_started',
  DIAGNOSTIC_COMPLETED: 'diagnostic_completed',
  DEVIS_UPLOAD_STARTED: 'devis_upload_started',
  DEVIS_ANALYZED: 'devis_analyzed',
  CHAT_MESSAGE_SENT: 'chat_message_sent',
  GARAGE_SEARCH: 'garage_search',
  PARTS_SEARCH: 'parts_search',

  // Conversion triggers
  FREEMIUM_LIMIT_REACHED: 'freemium_limit_reached',
  PAYWALL_VIEWED: 'paywall_viewed',
  PAYWALL_DISMISSED: 'paywall_dismissed',
  UPGRADE_BANNER_VIEWED: 'upgrade_banner_viewed',
  UPGRADE_BANNER_CLICKED: 'upgrade_banner_clicked',

  // Checkout
  STRIPE_CHECKOUT_OPENED: 'stripe_checkout_opened',
  STRIPE_CHECKOUT_ABANDONED: 'stripe_checkout_abandoned',
  SUBSCRIPTION_CREATED: 'subscription_created',
  ONE_TIME_PURCHASE: 'one_time_purchase',

  // Retention
  USER_RETURNED: 'user_returned',
  SUBSCRIPTION_RENEWED: 'subscription_renewed',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',

  // Errors
  ERROR_OCCURRED: 'error_occurred',
} as const

export type ConversionEvent = typeof CONVERSION_EVENTS[keyof typeof CONVERSION_EVENTS]

interface EventData {
  [key: string]: string | number | boolean | null | undefined
}

interface UseEventTrackingReturn {
  trackEvent: (eventType: ConversionEvent | string, eventData?: EventData) => Promise<void>
  trackPageView: (pageName: string) => Promise<void>
  trackConversion: (value: number, plan: 'monthly' | 'yearly') => Promise<void>
  EVENTS: typeof CONVERSION_EVENTS
}

export function useEventTracking(): UseEventTrackingReturn {
  const { user } = useAuth()
  const lastEventRef = useRef<string | null>(null)
  const lastEventTimeRef = useRef<number>(0)

  // Track user return
  useEffect(() => {
    if (user?.id) {
      const lastVisit = localStorage.getItem('mecaia_last_visit')
      const now = Date.now()

      if (lastVisit) {
        const hoursSinceLastVisit = (now - parseInt(lastVisit)) / (1000 * 60 * 60)
        if (hoursSinceLastVisit > 24) {
          // User returned after 24h+
          trackEventInternal(user.id, CONVERSION_EVENTS.USER_RETURNED, {
            hours_since_last_visit: Math.round(hoursSinceLastVisit)
          })
        }
      }

      localStorage.setItem('mecaia_last_visit', now.toString())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // Internal tracking function
  const trackEventInternal = async (
    userId: string,
    eventType: string,
    eventData: EventData = {}
  ): Promise<boolean> => {
    try {
      // Dedupe: avoid duplicate events within 2 seconds
      const eventKey = `${eventType}-${JSON.stringify(eventData)}`
      const now = Date.now()
      if (lastEventRef.current === eventKey && now - lastEventTimeRef.current < 2000) {
        return false
      }
      lastEventRef.current = eventKey
      lastEventTimeRef.current = now

      const { error } = await supabase.from('user_events').insert({
        user_id: userId,
        event_type: eventType,
        event_data: eventData,
        page_url: window.location.pathname,
        session_id: getSessionId(),
      })

      if (error) {
        // Table might not exist yet - fail silently in production
        if (error.code !== '42P01') { // Table doesn't exist
          console.error('[EventTracking] Insert error:', error)
        }
        return false
      }

      // Log in development
      if (import.meta.env.DEV) {
        console.log(`[EventTracking] ${eventType}`, eventData)
      }

      return true
    } catch (error) {
      console.error('[EventTracking] Error:', error)
      return false
    }
  }

  // Public track function
  const trackEvent = useCallback(
    async (eventType: ConversionEvent | string, eventData: EventData = {}): Promise<void> => {
      if (!user?.id) {
        // For anonymous tracking (landing page), use localStorage ID
        let anonId = localStorage.getItem('mecaia_anon_id')
        if (!anonId) {
          anonId = `anon_${crypto.randomUUID()}`
          localStorage.setItem('mecaia_anon_id', anonId)
        }
        // Can't insert without user_id due to FK constraint
        // Just log for now
        if (import.meta.env.DEV) {
          console.log(`[EventTracking:Anon] ${eventType}`, eventData)
        }
        return
      }

      await trackEventInternal(user.id, eventType, eventData)
    },
    [user?.id]
  )

  // Track page view
  const trackPageView = useCallback(
    async (pageName: string): Promise<void> => {
      await trackEvent(`${pageName}_viewed`, { page: pageName })
    },
    [trackEvent]
  )

  // Track successful conversion
  const trackConversion = useCallback(
    async (value: number, plan: 'monthly' | 'yearly'): Promise<void> => {
      await trackEvent(CONVERSION_EVENTS.SUBSCRIPTION_CREATED, {
        value,
        plan,
        currency: 'EUR',
      })
    },
    [trackEvent]
  )

  return {
    trackEvent,
    trackPageView,
    trackConversion,
    EVENTS: CONVERSION_EVENTS,
  }
}

export default useEventTracking
