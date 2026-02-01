# TikTok Pixel - MECAI Integration

## Overview

This integration tracks user interactions with MECAI for TikTok Ads optimization.

**Pixel ID:** `D5VJ013C77U3UMFCQHTG`

## Files Structure

```
src/
├── components/
│   └── analytics/
│       ├── TikTokPixel.tsx    # Main pixel component
│       └── README.md          # This file
├── hooks/
│   └── useTikTokTracking.ts   # Hook for easy event tracking
└── types/
    └── tiktok.d.ts            # TypeScript definitions
```

## Events Tracked

| Event | Location | Trigger |
|-------|----------|---------|
| `ViewContent` | Landing page (`/`) | Page load |
| `CompleteRegistration` | Signup page (`/signup`) | After successful signup |
| `InitiateCheckout` | Pricing page (`/pricing`) | Click on "Passer Premium" |
| `Subscribe` | Payment success (`/payment-success`) | After Stripe payment confirmed |

## RGPD/GDPR Compliance

The pixel **only loads** if the user has accepted analytics cookies:
- Cookie key: `mecaia-cookies-accepted`
- Required value: `'all'`

The pixel will **not** fire if:
- User has not interacted with the cookie banner
- User selected "Essentiels uniquement"

## Testing Instructions

### 1. Enable Debug Mode (Development)

In development mode (`npm run dev`), all pixel events are logged to the console:
```
[TikTok Pixel] Initialized successfully with ID: D5VJ013C77U3UMFCQHTG
[TikTok Tracking] Event "ViewContent" fired { content_name: "MECAI Landing Page", ... }
```

### 2. Test Cookie Consent

1. Clear localStorage: `localStorage.clear()`
2. Refresh the page
3. Check console - should see: `[TikTok Pixel] No analytics consent, skipping initialization`
4. Click "Tout accepter" on cookie banner
5. Refresh the page
6. Check console - should see: `[TikTok Pixel] Initialized successfully`

### 3. Test Each Event

#### ViewContent (Landing Page)
1. Go to `http://localhost:5173/`
2. Check console for: `[TikTok Tracking] Event "ViewContent" fired`

#### CompleteRegistration
1. Go to `http://localhost:5173/signup`
2. Create a new account
3. Check console for: `[TikTok Tracking] Event "CompleteRegistration" fired`

#### InitiateCheckout
1. Log in as a free user
2. Go to `http://localhost:5173/pricing`
3. Click "Passer Premium"
4. Check console for: `[TikTok Tracking] Event "InitiateCheckout" fired`

#### Subscribe
1. Complete a Stripe payment (use test mode)
2. On `/payment-success` page, wait for premium confirmation
3. Check console for: `[TikTok Tracking] Event "Subscribe" fired`

### 4. Verify in TikTok Ads Manager

1. Go to TikTok Ads Manager > Events Manager
2. Select your pixel (D5VJ013C77U3UMFCQHTG)
3. Click "Test Events"
4. Enter your website URL
5. Perform the actions and verify events appear

### 5. Using TikTok Pixel Helper (Chrome Extension)

1. Install [TikTok Pixel Helper](https://chrome.google.com/webstore/detail/tiktok-pixel-helper/) extension
2. Navigate to MECAI pages
3. Click the extension icon to see fired events

## Usage in Code

```tsx
import { useTikTokTracking } from '@/hooks/useTikTokTracking'

function MyComponent() {
  const {
    trackViewContent,
    trackCompleteRegistration,
    trackInitiateCheckout,
    trackSubscribe,
    trackClickButton
  } = useTikTokTracking()

  // Track page view
  useEffect(() => {
    trackViewContent('My Page', 'my_page_id')
  }, [])

  // Track button click
  const handleClick = () => {
    trackClickButton('CTA Button')
    // ... rest of logic
  }
}
```

## Event Parameters

### ViewContent
```typescript
trackViewContent('MECAI Landing Page', 'landing_page')
// Sends: { content_name, content_id, content_type: 'page' }
```

### CompleteRegistration
```typescript
trackCompleteRegistration('MECAI Free Account')
// Sends: { content_name }
```

### InitiateCheckout
```typescript
trackInitiateCheckout(isYearly)
// Sends: { value, currency: 'EUR', content_type: 'product', content_id, content_name }
```

### Subscribe
```typescript
trackSubscribe(isYearly)
// Sends: { value, currency: 'EUR', content_type: 'product', content_id, content_name }
```

## Troubleshooting

### Pixel not loading
1. Check cookie consent: `localStorage.getItem('mecaia-cookies-accepted')` should be `'all'`
2. Check for script blockers (uBlock, etc.)
3. Check console for errors

### Events not firing
1. Ensure consent is granted
2. Check if `window.ttq` exists: `console.log(window.ttq)`
3. Check for deduplication (some events fire only once per session)

### Events not appearing in TikTok
1. Events may take up to 24 hours to appear in TikTok Ads Manager
2. Use "Test Events" feature for real-time verification
3. Verify correct pixel ID is being used

## Production Notes

- In production, console logs are suppressed (silent fail)
- The pixel loads asynchronously using `requestIdleCallback` to not block FCP
- Events are deduplicated to prevent double-firing on React re-renders
