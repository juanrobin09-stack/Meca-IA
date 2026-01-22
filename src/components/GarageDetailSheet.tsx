import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { PanInfo } from 'framer-motion'
import type { Garage } from '@/services/garages'
import { getGarageDetails } from '@/services/garages'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Star,
  Phone,
  Navigation,
  Clock,
  MapPin,
  Globe,
  X,
  Loader2,
  ExternalLink,
} from 'lucide-react'

interface GarageDetailSheetProps {
  garage: Garage | null
  onClose: () => void
  onCall: (garage: Garage) => void
  onDirections: (garage: Garage) => void
}

export default function GarageDetailSheet({
  garage,
  onClose,
  onCall,
  onDirections,
}: GarageDetailSheetProps) {
  const [details, setDetails] = useState<Garage | null>(null)
  const [loading, setLoading] = useState(false)
  const [dragY, setDragY] = useState(0)

  // Fetch full details when garage changes
  useEffect(() => {
    if (!garage) {
      setDetails(null) // eslint-disable-line react-hooks/set-state-in-effect
      return
    }

    // Start with basic info
    setDetails(garage)  

    // Fetch full details if we don't have phone/website
    if (!garage.phone && !garage.website) {
      setLoading(true)
      getGarageDetails(garage.id)
        .then((fullDetails) => {
          setDetails((prev) => prev ? { ...prev, ...fullDetails } : fullDetails)
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [garage])

  const formatDistance = (distance?: number) => {
    if (!distance) return null
    if (distance < 1) return `${Math.round(distance * 1000)} m`
    return `${distance.toFixed(1)} km`
  }

  const handleDrag = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 0) {
      setDragY(info.offset.y)
    }
  }

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setDragY(0)
    // Close if dragged down more than 100px or with velocity
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose()
    }
  }

  const currentGarage = details || garage

  return (
    <AnimatePresence>
      {garage && currentGarage && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-50 md:hidden"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: dragY }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden md:hidden"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Content */}
            <div className="px-5 pb-8 overflow-y-auto max-h-[calc(85vh-40px)]">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold leading-tight mb-1">
                    {currentGarage.name}
                  </h2>
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Rating */}
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-semibold">{currentGarage.rating.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">
                        ({currentGarage.reviewCount} avis)
                      </span>
                    </div>

                    {/* Open/Closed badge */}
                    {currentGarage.openNow !== undefined && (
                      <Badge
                        variant={currentGarage.openNow ? 'default' : 'secondary'}
                        className={cn(
                          'text-xs',
                          currentGarage.openNow && 'bg-green-500 hover:bg-green-500'
                        )}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {currentGarage.openNow ? 'Ouvert' : 'Fermé'}
                      </Badge>
                    )}
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 -mr-2 -mt-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Distance */}
              {currentGarage.distance !== undefined && (
                <div className="flex items-center gap-2 text-primary font-medium mb-4">
                  <MapPin className="h-4 w-4" />
                  <span>{formatDistance(currentGarage.distance)}</span>
                </div>
              )}

              {/* Address */}
              <div className="flex items-start gap-3 mb-4 p-3 bg-muted/50 rounded-xl">
                <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-sm">{currentGarage.address}</p>
              </div>

              {/* Contact info */}
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-2 mb-6">
                  {/* Phone */}
                  {currentGarage.phone && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                      <Phone className="h-5 w-5 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium">{currentGarage.phone}</span>
                    </div>
                  )}

                  {/* Website */}
                  {currentGarage.website && (
                    <a
                      href={currentGarage.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl hover:bg-muted transition-colors group"
                    >
                      <Globe className="h-5 w-5 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium text-primary truncate flex-1">
                        {currentGarage.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </span>
                      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </a>
                  )}

                  {/* Price level */}
                  {currentGarage.priceLevel && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                      <span className="text-muted-foreground text-sm">Niveau de prix</span>
                      <Badge variant="outline" className="ml-auto">
                        {'€'.repeat(currentGarage.priceLevel)}
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={() => onCall(currentGarage)}
                  variant="outline"
                  className="flex-1 h-14 rounded-xl text-base"
                >
                  <Phone className="h-5 w-5 mr-2" />
                  Appeler
                </Button>
                <Button
                  onClick={() => onDirections(currentGarage)}
                  className="flex-1 h-14 rounded-xl text-base"
                >
                  <Navigation className="h-5 w-5 mr-2" />
                  Y aller
                </Button>
              </div>

              {/* See on Google Maps link */}
              <a
                href={`https://www.google.com/maps/place/?q=place_id:${currentGarage.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 mt-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Voir sur Google Maps
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </motion.div>

          {/* Desktop modal version */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="hidden md:block fixed inset-0 z-50 items-center justify-center p-4"
            style={{ display: 'none' }}
          >
            {/* Desktop version uses the same popup from the map */}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
