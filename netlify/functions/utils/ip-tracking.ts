/**
 * IP Tracking Utility for Netlify Functions
 * Permet de tracker les IPs pour détecter les abus de compte
 */

import { SupabaseClient } from '@supabase/supabase-js'
import type { HandlerEvent } from '@netlify/functions'

export interface IPTrackingResult {
  allowed: boolean
  reason?: string
  message?: string
  accounts_on_ip?: number
  is_new_account_on_ip?: boolean
  warning?: string
}

export interface IPCheckResult {
  can_register: boolean
  reason?: string
  accounts_count?: number
  accounts_today?: number
  message?: string
}

/**
 * Extrait l'adresse IP réelle de la requête
 * Gère les proxies, load balancers, et Netlify
 */
export function getClientIP(event: HandlerEvent): string {
  // Netlify met l'IP dans ce header
  const clientIP = event.headers['client-ip']
  if (clientIP) return clientIP

  // X-Forwarded-For peut contenir plusieurs IPs (client, proxies)
  const forwardedFor = event.headers['x-forwarded-for']
  if (forwardedFor) {
    // Prendre la première IP (le client original)
    const ips = forwardedFor.split(',').map(ip => ip.trim())
    if (ips[0]) return ips[0]
  }

  // X-Real-IP utilisé par certains proxies
  const realIP = event.headers['x-real-ip']
  if (realIP) return realIP

  // CF-Connecting-IP pour Cloudflare
  const cfIP = event.headers['cf-connecting-ip']
  if (cfIP) return cfIP

  // X-NF-Client-Connection-IP pour Netlify Edge
  const nfIP = event.headers['x-nf-client-connection-ip']
  if (nfIP) return nfIP

  // Fallback - ne devrait pas arriver en production
  return '0.0.0.0'
}

/**
 * Extrait le User-Agent de la requête
 */
export function getUserAgent(event: HandlerEvent): string {
  return event.headers['user-agent'] || 'unknown'
}

/**
 * Enregistre un accès IP pour un utilisateur
 * Retourne si l'accès est autorisé et des infos sur le compte
 */
export async function trackIPAccess(
  supabase: SupabaseClient,
  userId: string,
  event: HandlerEvent
): Promise<IPTrackingResult> {
  const ip = getClientIP(event)
  const userAgent = getUserAgent(event)

  // Ne pas tracker les IPs locales/de développement
  if (ip === '0.0.0.0' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return {
      allowed: true,
      accounts_on_ip: 0,
      is_new_account_on_ip: true
    }
  }

  try {
    const { data, error } = await supabase.rpc('track_ip_access', {
      p_user_id: userId,
      p_ip_address: ip,
      p_user_agent: userAgent
    })

    if (error) {
      console.error('[ip-tracking] RPC error:', error)
      // En cas d'erreur, on laisse passer (fail-open pour ne pas bloquer les vrais utilisateurs)
      return { allowed: true }
    }

    return data as IPTrackingResult
  } catch (err) {
    console.error('[ip-tracking] Exception:', err)
    return { allowed: true }
  }
}

/**
 * Vérifie si une IP peut créer un nouveau compte
 * À appeler AVANT la création du compte
 */
export async function checkIPCanRegister(
  supabase: SupabaseClient,
  event: HandlerEvent
): Promise<IPCheckResult> {
  const ip = getClientIP(event)

  // Ne pas limiter les IPs locales/de développement
  if (ip === '0.0.0.0' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return { can_register: true, accounts_count: 0, accounts_today: 0 }
  }

  try {
    const { data, error } = await supabase.rpc('check_ip_can_register', {
      p_ip_address: ip
    })

    if (error) {
      console.error('[ip-tracking] check_ip_can_register error:', error)
      // En cas d'erreur, on laisse passer
      return { can_register: true }
    }

    return data as IPCheckResult
  } catch (err) {
    console.error('[ip-tracking] Exception:', err)
    return { can_register: true }
  }
}

/**
 * Vérifie si une IP est bloquée
 * Retourne true si l'IP est bloquée
 */
export async function isIPBlocked(
  supabase: SupabaseClient,
  event: HandlerEvent
): Promise<boolean> {
  const ip = getClientIP(event)

  // Ne jamais bloquer les IPs locales
  if (ip === '0.0.0.0' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return false
  }

  try {
    const { data, error } = await supabase
      .from('blocked_ips')
      .select('id')
      .eq('ip_address', ip)
      .or('blocked_until.is.null,blocked_until.gt.now()')
      .maybeSingle()

    if (error) {
      console.error('[ip-tracking] isIPBlocked error:', error)
      return false
    }

    return !!data
  } catch (err) {
    console.error('[ip-tracking] Exception:', err)
    return false
  }
}

/**
 * Obtenir les statistiques d'abus pour un utilisateur
 */
export async function getUserAbuseStatus(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  is_potential_abuser: boolean
  ips_used: number
  suspicious_ips: number
  warning?: string
}> {
  try {
    const { data, error } = await supabase.rpc('check_user_abuse_status', {
      p_user_id: userId
    })

    if (error) {
      console.error('[ip-tracking] getUserAbuseStatus error:', error)
      return { is_potential_abuser: false, ips_used: 0, suspicious_ips: 0 }
    }

    return data
  } catch (err) {
    console.error('[ip-tracking] Exception:', err)
    return { is_potential_abuser: false, ips_used: 0, suspicious_ips: 0 }
  }
}

/**
 * Middleware pour les Netlify Functions
 * Vérifie l'IP et bloque si nécessaire avant de traiter la requête
 */
export async function ipTrackingMiddleware(
  supabase: SupabaseClient,
  userId: string,
  event: HandlerEvent
): Promise<{ allowed: boolean; response?: { statusCode: number; body: string }; data?: IPTrackingResult }> {
  // Vérifier si l'IP est bloquée
  const blocked = await isIPBlocked(supabase, event)
  if (blocked) {
    return {
      allowed: false,
      response: {
        statusCode: 403,
        body: JSON.stringify({
          error: 'Accès refusé',
          message: 'Votre adresse IP a été temporairement bloquée pour activité suspecte.',
          code: 'IP_BLOCKED'
        })
      }
    }
  }

  // Tracker l'accès
  const trackingResult = await trackIPAccess(supabase, userId, event)

  if (!trackingResult.allowed) {
    return {
      allowed: false,
      response: {
        statusCode: 403,
        body: JSON.stringify({
          error: 'Accès refusé',
          message: trackingResult.message || 'Activité suspecte détectée.',
          code: trackingResult.reason || 'SUSPICIOUS_ACTIVITY'
        })
      }
    }
  }

  // Si warning, on log mais on laisse passer
  if (trackingResult.warning) {
    console.warn(`[ip-tracking] Warning for user ${userId}: ${trackingResult.warning}`)
  }

  return {
    allowed: true,
    data: trackingResult
  }
}
