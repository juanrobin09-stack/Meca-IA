/**
 * UpgradeCTA - Call-to-action pour la conversion freemium -> Premium
 *
 * Composant affiché après chaque diagnostic gratuit pour encourager
 * l'upgrade vers Premium avec une proposition de valeur claire.
 */

import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, Shield, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UpgradeCTAProps {
  /** Nombre de diagnostics restants (0, 1, 2) */
  diagnosticsRemaining: number
  /** Nombre de crédits achetés */
  purchasedCredits?: number
  /** Callback pour ouvrir le paywall */
  onUpgradeClick: () => void
  /** Variante visuelle */
  variant?: 'default' | 'urgent' | 'success'
  /** Classe CSS additionnelle */
  className?: string
}

export function UpgradeCTA({
  diagnosticsRemaining,
  purchasedCredits = 0,
  onUpgradeClick,
  // variant can be used for future A/B testing
  variant: _variant = 'default',
  className = '',
}: UpgradeCTAProps) {
  void _variant // Suppress unused warning
  // Déterminer le message selon le contexte
  const isUrgent = diagnosticsRemaining === 0 && purchasedCredits === 0
  const isLow = diagnosticsRemaining === 1 && purchasedCredits === 0
  const hasCredits = purchasedCredits > 0

  // Titre dynamique
  const getTitle = () => {
    if (isUrgent) return 'Tu as utilisé tous tes diagnostics gratuits'
    if (isLow) return 'Plus qu\'un diagnostic gratuit !'
    if (hasCredits) return `${purchasedCredits} crédit${purchasedCredits > 1 ? 's' : ''} restant${purchasedCredits > 1 ? 's' : ''}`
    return 'Diagnostic terminé avec succès !'
  }

  // Sous-titre dynamique
  const getSubtitle = () => {
    if (isUrgent) return 'Passe Premium pour des diagnostics illimités et toutes les fonctionnalités Pro'
    if (isLow) return 'Passe Premium avant qu\'il ne soit trop tard !'
    return 'Passe Premium pour des diagnostics illimités'
  }

  // Style selon urgence
  const getGradient = () => {
    if (isUrgent) return 'from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30'
    if (isLow) return 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30'
    return 'from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30'
  }

  const getBorderColor = () => {
    if (isUrgent) return 'border-orange-200 dark:border-orange-800'
    if (isLow) return 'border-amber-200 dark:border-amber-800'
    return 'border-blue-200 dark:border-blue-800'
  }

  const getIconColor = () => {
    if (isUrgent) return 'text-orange-600'
    if (isLow) return 'text-amber-600'
    return 'text-blue-600'
  }

  const getTextColor = () => {
    if (isUrgent) return 'text-orange-900 dark:text-orange-100'
    if (isLow) return 'text-amber-900 dark:text-amber-100'
    return 'text-blue-900 dark:text-blue-100'
  }

  const getSubtitleColor = () => {
    if (isUrgent) return 'text-orange-700 dark:text-orange-300'
    if (isLow) return 'text-amber-700 dark:text-amber-300'
    return 'text-blue-700 dark:text-blue-300'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={`
        p-4 rounded-xl bg-gradient-to-r ${getGradient()}
        border ${getBorderColor()} ${className}
      `}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Icon */}
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center shrink-0
          ${isUrgent ? 'bg-orange-100 dark:bg-orange-900/50' : isLow ? 'bg-amber-100 dark:bg-amber-900/50' : 'bg-blue-100 dark:bg-blue-900/50'}
        `}>
          {isUrgent ? (
            <Zap className={`h-5 w-5 ${getIconColor()}`} />
          ) : (
            <Sparkles className={`h-5 w-5 ${getIconColor()}`} />
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className={`font-semibold ${getTextColor()}`}>
            {getTitle()}
          </p>
          <p className={`text-sm ${getSubtitleColor()}`}>
            {getSubtitle()}
          </p>
        </div>

        {/* CTA Button */}
        <Button
          onClick={onUpgradeClick}
          className={`
            shrink-0 gap-2
            ${isUrgent
              ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
            }
          `}
        >
          <span>Passer Premium</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Benefits reminder */}
      {isUrgent && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-800"
        >
          <div className="flex flex-wrap gap-3 text-xs text-orange-700 dark:text-orange-300">
            <div className="flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" />
              <span>Diagnostics illimités</span>
            </div>
            <div className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Chat 24/7</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-3.5 w-3.5" />
              <span>Analyse devis</span>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default UpgradeCTA
