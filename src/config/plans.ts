export const PLANS = {
  free: {
    id: 'free',
    name: 'Gratuit',
    price: 0,
    priceYearly: 0,
    maxDiagnostics: 2,
    maxDevis: 1,
    maxVehicles: 1,
    historyDays: 7,
    features: [
      '2 diagnostics/mois',
      '1 analyse devis/mois',
      '1 vehicule',
      'Historique 7 jours',
      'Recherche garages',
      'Recherche pieces',
    ],
    notIncluded: [
      'Export PDF',
      'Rappels entretien',
      "Carnet d'entretien",
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    emoji: '⭐',
    subtitle: 'Diagnostics illimites',
    price: 9.99,
    priceYearly: 89,
    yearlyDiscount: '2 mois offerts',
    maxDiagnostics: Infinity,
    maxDevis: Infinity,
    maxVehicles: 5,
    historyDays: Infinity,
    features: [
      'Diagnostics illimites',
      'Analyses devis illimitees',
      "Jusqu'a 5 vehicules",
      'Export PDF',
      'Rappels entretien',
      "Carnet d'entretien",
      'Historique permanent',
      'Support email',
    ],
    notIncluded: [],
    stripePriceMonthly: 'price_premium_monthly',
    stripePriceYearly: 'price_premium_yearly',
  },
} as const

export type PlanId = keyof typeof PLANS
export type Plan = (typeof PLANS)[PlanId]
