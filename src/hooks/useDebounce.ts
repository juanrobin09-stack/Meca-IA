import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Hook pour debouncer une valeur
 * @param value - Valeur à debouncer
 * @param delay - Délai en ms (default: 300ms)
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook pour créer une fonction debouncée
 * @param callback - Fonction à debouncer
 * @param delay - Délai en ms (default: 300ms)
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay = 300
): T {
  const callbackRef = useRef(callback)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Update callback ref on each render
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    },
    [delay]
  ) as T

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback
}

/**
 * Hook pour throttler une valeur (limiter la fréquence des updates)
 * @param value - Valeur à throttler
 * @param limit - Intervalle minimum entre updates en ms
 */
export function useThrottle<T>(value: T, limit = 300): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastRan = useRef(0)

  // Initialize lastRan on first effect run
  useEffect(() => {
    if (lastRan.current === 0) {
      lastRan.current = Date.now()
    }
  }, [])

  useEffect(() => {
    const now = Date.now()
    const timeSinceLastRan = now - lastRan.current
    const delay = timeSinceLastRan >= limit ? 0 : limit - timeSinceLastRan

    const handler = setTimeout(() => {
      setThrottledValue(value)
      lastRan.current = Date.now()
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, limit])

  return throttledValue
}
