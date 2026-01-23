export const PLANS = {
  free: {
    id: 'free',
    name: 'Gratuit',
    price: 0,
    priceYearly: 0,
    maxDiagnostics: 2,
    maxDevis: 1,  // par mois
    maxVehicles: 1,
    maxChatMessagesPerDay: 10,  // par jour
    historyDays: 7,
    features: [
      '2 Diagnostics Pro par mois',
      '1 véhicule enregistré',
      '10 messages chat mécanicien/jour',
      '1 analyse de devis par mois',
      'Recherche de garage à proximité',
      'Recherche de pièces détachées',
    ],
    notIncluded: [
      'Diagnostics illimités',
      'Diagnostic vidéo IA',
      'Prévision de pannes',
      'Chat mécanicien 24/7 illimité',
      'Analyses de devis illimitées',
      'Véhicules illimités',
      'Historique complet + export PDF',
      'Support prioritaire',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    emoji: '⭐',
    subtitle: 'Tout illimité',
    price: 9.99,
    priceYearly: 89,
    yearlyDiscount: '2 mois offerts',
    maxDiagnostics: Infinity,
    maxDevis: Infinity,
    maxVehicles: Infinity,
    maxChatMessagesPerDay: Infinity,
    historyDays: Infinity,
    features: [
      'Diagnostics Pro illimités',
      'Diagnostic vidéo IA',
      'Prévision de pannes intelligente',
      'Chat mécanicien 24/7 illimité',
      'Analyses de devis illimitées',
      'Véhicules illimités',
      'Historique complet + export PDF',
      'Recherche de garage à proximité',
      'Recherche de pièces détachées',
      'Support prioritaire',
    ],
    notIncluded: [],
    stripePriceMonthly: 'price_premium_monthly',
    stripePriceYearly: 'price_premium_yearly',
  },
} as const

export type PlanId = keyof typeof PLANS
export type Plan = (typeof PLANS)[PlanId]
