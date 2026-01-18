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
      '2 diagnostics IA/mois',
      '1 véhicule enregistré',
      '10 messages chat mécanicien/jour',
      '1 analyse de devis/mois',
      'Recherche pièces basique',
      'Comparaison prix multi-retailers',
      'Historique limité (3 derniers)',
    ],
    notIncluded: [
      'Diagnostic vidéo IA',
      'Prévision de pannes',
      'Chat mécanicien illimité',
      'Analyses de devis illimitées',
      'Véhicules illimités',
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
      'Diagnostics IA illimités',
      'Véhicules illimités',
      'Analyseur de devis IA illimité',
      'Diagnostic vidéo IA',
      'Prévision de pannes intelligente',
      'Chat mécanicien 24/7 illimité',
      'Historique complet + export PDF',
      'Analyse multi-photos',
      'Notifications intelligentes',
      'Support prioritaire',
      'Sans publicité',
    ],
    notIncluded: [],
    stripePriceMonthly: 'price_premium_monthly',
    stripePriceYearly: 'price_premium_yearly',
  },
} as const

export type PlanId = keyof typeof PLANS
export type Plan = (typeof PLANS)[PlanId]
