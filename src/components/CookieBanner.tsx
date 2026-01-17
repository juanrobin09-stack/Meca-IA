import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { Cookie, X } from 'lucide-react'

const COOKIE_KEY = 'mecaia-cookies-accepted'

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const accepted = localStorage.getItem(COOKIE_KEY)
    if (!accepted) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  function acceptAll() {
    localStorage.setItem(COOKIE_KEY, 'all')
    setIsVisible(false)
  }

  function acceptEssential() {
    localStorage.setItem(COOKIE_KEY, 'essential')
    setIsVisible(false)
  }

  function dismiss() {
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
        >
          <div className="max-w-4xl mx-auto bg-card border rounded-lg shadow-lg p-4 md:p-6">
            <div className="flex items-start gap-4">
              <div className="hidden sm:flex h-10 w-10 rounded-full bg-primary/10 items-center justify-center flex-shrink-0">
                <Cookie className="h-5 w-5 text-primary" />
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold mb-1">Nous utilisons des cookies</h3>
                    <p className="text-sm text-muted-foreground">
                      MecaIA utilise des cookies pour assurer le bon fonctionnement du site
                      et améliorer votre expérience. En savoir plus dans notre{' '}
                      <Link to="/confidentialite" className="text-primary hover:underline">
                        politique de confidentialité
                      </Link>.
                    </p>
                  </div>
                  <button
                    onClick={dismiss}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Fermer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 mt-4">
                  <Button onClick={acceptAll} size="sm">
                    Tout accepter
                  </Button>
                  <Button onClick={acceptEssential} variant="outline" size="sm">
                    Essentiels uniquement
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
