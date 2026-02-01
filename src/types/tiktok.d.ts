/**
 * TikTok Pixel TypeScript Definitions
 * @see https://ads.tiktok.com/marketing_api/docs
 */

export interface TikTokTrackingParams {
  /** Content name for the event */
  content_name?: string
  /** Content ID for tracking products */
  content_id?: string
  /** Type of content (e.g., 'product', 'page') */
  content_type?: string
  /** Monetary value of the event */
  value?: number
  /** Currency code (e.g., 'EUR', 'USD') */
  currency?: string
  /** Number of items */
  quantity?: number
  /** Category of the product/content */
  content_category?: string
  /** Description of the content */
  description?: string
  /** Search query string */
  query?: string
  /** Status field */
  status?: string
}

export type TikTokStandardEvent =
  | 'ViewContent'
  | 'ClickButton'
  | 'Search'
  | 'AddToWishlist'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'AddPaymentInfo'
  | 'CompletePayment'
  | 'PlaceAnOrder'
  | 'Contact'
  | 'Download'
  | 'SubmitForm'
  | 'CompleteRegistration'
  | 'Subscribe'

/**
 * TikTok Pixel interface - represents the loaded pixel
 * Note: During initialization, window.ttq is an array that queues commands
 * After the script loads, it becomes this interface
 */
export interface TikTokPixel {
  /**
   * Track a page view
   */
  page: () => void

  /**
   * Track a standard or custom event
   * @param event - Event name (standard or custom)
   * @param params - Optional event parameters
   */
  track: (event: TikTokStandardEvent | string, params?: TikTokTrackingParams) => void

  /**
   * Identify a user
   * @param params - User identification parameters
   */
  identify: (params: { email?: string; phone_number?: string; external_id?: string }) => void

  /**
   * Get all pixel instances
   */
  instances: () => TikTokPixel[]

  /**
   * Enable debug mode
   */
  debug: (enable: boolean) => void

  /**
   * Register event listener
   */
  on: (event: string, callback: (...args: unknown[]) => void) => void

  /**
   * Remove event listener
   */
  off: (event: string, callback: (...args: unknown[]) => void) => void

  /**
   * Register one-time event listener
   */
  once: (event: string, callback: (...args: unknown[]) => void) => void

  /**
   * Execute callback when pixel is ready
   */
  ready: (callback: () => void) => void

  /**
   * Create alias for user
   */
  alias: (alias: string) => void

  /**
   * Group users
   */
  group: (groupId: string, traits?: Record<string, unknown>) => void

  /**
   * Enable cookie tracking
   */
  enableCookie: () => void

  /**
   * Disable cookie tracking
   */
  disableCookie: () => void

  /**
   * Hold consent (GDPR compliance)
   */
  holdConsent: () => void

  /**
   * Revoke consent (GDPR compliance)
   */
  revokeConsent: () => void

  /**
   * Grant consent (GDPR compliance)
   */
  grantConsent: () => void

  /**
   * Load the pixel with a pixel ID
   */
  load: (pixelId: string, options?: { partner?: string }) => void

  /**
   * Get instance by pixel ID
   */
  instance: (pixelId: string) => TikTokPixel

  /**
   * Internal properties
   */
  _i?: Record<string, unknown[]>
  _t?: Record<string, number>
  _o?: Record<string, unknown>

  /**
   * Array methods for queuing
   */
  methods?: string[]
  setAndDefer?: (target: unknown, method: string) => void
  push?: (args: unknown[]) => void
}

/**
 * TikTok Pixel Queue - the initial array state before script loads
 * Commands are queued here until the real SDK replaces this object
 */
export type TikTokPixelQueue = unknown[] & Partial<TikTokPixel>

declare global {
  interface Window {
    /**
     * TikTok Pixel object
     * Initially an array for queuing, becomes TikTokPixel after SDK loads
     */
    ttq?: TikTokPixel | TikTokPixelQueue
    TiktokAnalyticsObject?: string
  }
}

export {}
