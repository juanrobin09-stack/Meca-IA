export interface User {
  id: string
  email: string
  display_name?: string
  city?: string
  free_diagnostics_used: number
  free_diagnostics_reset_at: string
  free_devis_used: number
  free_chat_messages_today?: number
  free_chat_reset_at?: string
  // Purchased credits
  purchased_diagnostic_credits?: number
  purchased_devis_credits?: number
  purchased_chat_credits?: number
  // Subscription
  subscription_status: 'free' | 'premium'
  stripe_customer_id?: string
  stripe_subscription_id?: string
  created_at: string
  updated_at: string
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  image?: string // Base64 data URL for user messages with images
}

export interface Diagnostic {
  id: string
  user_id: string
  car_brand?: string
  car_model?: string
  car_year?: number
  car_mileage?: number
  problem_description: string
  conversation: Message[]
  diagnosis_summary?: string
  urgency_level?: 'low' | 'medium' | 'high'
  estimated_cost_min?: number
  estimated_cost_max?: number
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  user_id: string
  stripe_payment_id: string
  amount: number
  currency: string
  payment_type: 'subscription' | 'one_time'
  status: 'pending' | 'succeeded' | 'failed'
  created_at: string
}

export interface DiagnosticLimitStatus {
  canDiagnose: boolean
  remaining: number
  isPremium: boolean
}

export interface DevisAnalysis {
  id: string
  user_id: string
  garage_name?: string
  original_amount?: number
  analyzed_amount?: number
  potential_savings?: number
  image_url?: string
  analysis_result: string
  verdict_type?: 'good' | 'warning' | 'bad' | 'neutral'
  recommendation?: string
  is_fair_price?: boolean
  created_at: string
}
