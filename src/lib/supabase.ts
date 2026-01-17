import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          city: string | null
          free_diagnostics_used: number
          free_diagnostics_reset_at: string
          free_devis_used: number
          subscription_status: 'free' | 'premium'
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          city?: string | null
          free_diagnostics_used?: number
          free_diagnostics_reset_at?: string
          free_devis_used?: number
          subscription_status?: 'free' | 'premium'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Update: {
          display_name?: string | null
          city?: string | null
          free_diagnostics_used?: number
          free_diagnostics_reset_at?: string
          free_devis_used?: number
          subscription_status?: 'free' | 'premium'
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
      }
      diagnostics: {
        Row: {
          id: string
          user_id: string
          car_brand: string | null
          car_model: string | null
          car_year: number | null
          car_mileage: number | null
          problem_description: string
          conversation: unknown
          diagnosis_summary: string | null
          urgency_level: 'low' | 'medium' | 'high' | null
          estimated_cost_min: number | null
          estimated_cost_max: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          car_brand?: string | null
          car_model?: string | null
          car_year?: number | null
          car_mileage?: number | null
          problem_description: string
          conversation?: unknown
          diagnosis_summary?: string | null
          urgency_level?: 'low' | 'medium' | 'high' | null
          estimated_cost_min?: number | null
          estimated_cost_max?: number | null
        }
        Update: {
          car_brand?: string | null
          car_model?: string | null
          car_year?: number | null
          car_mileage?: number | null
          problem_description?: string
          conversation?: unknown
          diagnosis_summary?: string | null
          urgency_level?: 'low' | 'medium' | 'high' | null
          estimated_cost_min?: number | null
          estimated_cost_max?: number | null
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          stripe_payment_id: string
          amount: number
          currency: string
          payment_type: 'subscription' | 'one_time'
          status: 'pending' | 'succeeded' | 'failed'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_payment_id: string
          amount: number
          currency?: string
          payment_type: 'subscription' | 'one_time'
          status?: 'pending' | 'succeeded' | 'failed'
        }
        Update: {
          status?: 'pending' | 'succeeded' | 'failed'
        }
      }
    }
  }
}
