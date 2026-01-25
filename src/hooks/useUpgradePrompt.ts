/**
 * useUpgradePrompt - Gestion intelligente des prompts Premium
 *
 * Ce hook gère un système de "cooldown" pour éviter de spammer les utilisateurs
 * avec des messages "Passer Premium" à répétition.
 *
 * Règles:
 * - Maximum 1 modal par session (30 min)
 * - Maximum 3 modals par jour
 * - Si l'utilisateur ferme 3x le modal, ne plus l'afficher pendant 24h
 * - Affichage subtil avec banner au lieu de modal après le premier refus
 */

import { useState, useCallback, useEffect } from 'react'

interface UpgradePromptState {
  // Compteur de modals affichés aujourd'hui
  modalCountToday: number
  // Timestamp du dernier modal affiché
  lastModalTimestamp: number
  // Nombre de fois que l'utilisateur a fermé le modal
  dismissCount: number
  // Timestamp du dernier dismiss
  lastDismissTimestamp: number
  // Date du jour (pour reset quotidien)
  date: string
}

const STORAGE_KEY = 'mecaia_upgrade_prompt_state'
const SESSION_COOLDOWN_MS = 30 * 60 * 1000 // 30 minutes entre chaque modal
const DAILY_LIMIT = 3 // Maximum 3 modals par jour
const DISMISS_COOLDOWN_MS = 24 * 60 * 60 * 1000 // 24h si l'utilisateur ferme 3 fois
const DISMISS_THRESHOLD = 3 // Nombre de dismiss avant cooldown long

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

function getDefaultState(): UpgradePromptState {
  return {
    modalCountToday: 0,
    lastModalTimestamp: 0,
    dismissCount: 0,
    lastDismissTimestamp: 0,
    date: getTodayDate()
  }
}

function loadState(): UpgradePromptState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const state = JSON.parse(stored) as UpgradePromptState

      // Reset si nouveau jour
      if (state.date !== getTodayDate()) {
        return {
          ...getDefaultState(),
          // Garder le dismiss count si moins de 24h
          dismissCount: state.dismissCount,
          lastDismissTimestamp: state.lastDismissTimestamp
        }
      }

      return state
    }
  } catch {
    // Ignore errors
  }
  return getDefaultState()
}

function saveState(state: UpgradePromptState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore errors
  }
}

export type PromptType = 'modal' | 'banner' | 'none'

export interface UpgradePromptResult {
  // Type de prompt à afficher
  promptType: PromptType
  // Peut-on afficher un modal?
  canShowModal: boolean
  // Raison si ne peut pas afficher
  reason?: string
  // Callback quand l'utilisateur ferme le prompt
  onDismiss: () => void
  // Callback quand le prompt est affiché
  onShow: () => void
  // Temps restant avant de pouvoir afficher (ms)
  cooldownRemaining: number
  // Compteur de modals aujourd'hui
  modalCountToday: number
  // Force l'affichage du modal (ignorer cooldown)
  forceModal: boolean
  setForceModal: (force: boolean) => void
}

export function useUpgradePrompt(): UpgradePromptResult {
  const [state, setState] = useState<UpgradePromptState>(loadState)
  const [forceModal, setForceModal] = useState(false)

  // Recalculer l'état à chaque changement
  useEffect(() => {
    const currentState = loadState()
    setState(currentState)
  }, [])

  // Calculer si on peut afficher un modal
  const now = Date.now()

  // Vérifier le cooldown de dismiss (24h après 3 fermetures)
  const dismissCooldownActive =
    state.dismissCount >= DISMISS_THRESHOLD &&
    now - state.lastDismissTimestamp < DISMISS_COOLDOWN_MS

  // Vérifier le cooldown de session (30 min)
  const sessionCooldownActive =
    state.lastModalTimestamp > 0 &&
    now - state.lastModalTimestamp < SESSION_COOLDOWN_MS

  // Vérifier la limite quotidienne
  const dailyLimitReached = state.modalCountToday >= DAILY_LIMIT

  // Calculer le temps restant
  let cooldownRemaining = 0
  if (dismissCooldownActive) {
    cooldownRemaining = DISMISS_COOLDOWN_MS - (now - state.lastDismissTimestamp)
  } else if (sessionCooldownActive) {
    cooldownRemaining = SESSION_COOLDOWN_MS - (now - state.lastModalTimestamp)
  }

  // Déterminer si on peut afficher un modal
  const canShowModal = !dismissCooldownActive && !sessionCooldownActive && !dailyLimitReached

  // Déterminer le type de prompt à afficher
  let promptType: PromptType = 'none'
  let reason: string | undefined

  if (forceModal) {
    promptType = 'modal'
  } else if (canShowModal) {
    // Premier affichage ou cooldown passé -> modal
    promptType = 'modal'
  } else if (dismissCooldownActive) {
    // L'utilisateur a fermé 3x -> rien pendant 24h
    promptType = 'none'
    reason = `Vous avez fermé ${DISMISS_THRESHOLD} fois. Prochain rappel dans ${Math.ceil(cooldownRemaining / 3600000)}h`
  } else if (sessionCooldownActive) {
    // Cooldown de session -> banner subtil
    promptType = 'banner'
    reason = `Cooldown de session actif (${Math.ceil(cooldownRemaining / 60000)} min restantes)`
  } else if (dailyLimitReached) {
    // Limite quotidienne -> banner subtil
    promptType = 'banner'
    reason = 'Limite quotidienne atteinte'
  }

  // Callback quand le prompt est affiché
  const onShow = useCallback(() => {
    const newState: UpgradePromptState = {
      ...state,
      modalCountToday: state.modalCountToday + 1,
      lastModalTimestamp: Date.now(),
      date: getTodayDate()
    }
    setState(newState)
    saveState(newState)
  }, [state])

  // Callback quand l'utilisateur ferme le prompt
  const onDismiss = useCallback(() => {
    const newState: UpgradePromptState = {
      ...state,
      dismissCount: state.dismissCount + 1,
      lastDismissTimestamp: Date.now(),
      date: getTodayDate()
    }
    setState(newState)
    saveState(newState)
    setForceModal(false)
  }, [state])

  return {
    promptType,
    canShowModal,
    reason,
    onDismiss,
    onShow,
    cooldownRemaining,
    modalCountToday: state.modalCountToday,
    forceModal,
    setForceModal
  }
}

/**
 * Hook simplifié pour vérifier rapidement si on peut afficher une promo
 */
export function useCanShowPromo(): boolean {
  const { canShowModal, promptType } = useUpgradePrompt()
  return canShowModal || promptType === 'banner'
}

/**
 * Réinitialiser l'état (utile après un achat premium)
 */
export function clearUpgradePromptState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore
  }
}
