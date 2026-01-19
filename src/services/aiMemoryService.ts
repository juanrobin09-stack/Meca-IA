import { supabase } from '@/lib/supabase'

// Types pour la mémoire utilisateur
export interface UserVehicle {
  id: string
  brand: string
  model: string
  year: number
  license_plate?: string
  kilometrage?: number
  fuel_type?: string
  derniere_revision?: string
  date_achat?: string
}

export interface ProblemeHistorique {
  date: string
  type: 'diagnostic' | 'chat' | 'video' | 'devis'
  probleme: string
  solution?: string
  cout?: number
  resolu: boolean
}

export interface Entretien {
  date: string
  type: string
  garage?: string
  cout?: number
  kilometrage?: number
  pieces_changees: string[]
}

export interface PieceChangee {
  piece: string
  date: string
  kilometrage?: number
  garantie_jusqu_a?: string
}

export interface UserPreferences {
  budget_type: 'serré' | 'moyen' | 'flexible'
  fait_entretien_lui_meme: boolean
  garage_habituel?: string
  niveau_technique: 'débutant' | 'intermédiaire' | 'avancé'
}

export interface UserPatterns {
  problemes_recurrents: string[]
  conduite_type: 'urbaine' | 'mixte' | 'autoroute'
  frequence_entretien: 'bon' | 'moyen' | 'mauvais'
}

export interface LastInteraction {
  date: string
  type: 'diagnostic' | 'chat' | 'video' | 'devis'
  sujet: string
  non_resolu?: boolean
}

export interface UserMemory {
  vehicles: UserVehicle[]
  problemes_historiques: ProblemeHistorique[]
  entretiens: Entretien[]
  pieces_changees: PieceChangee[]
  preferences: UserPreferences
  patterns: UserPatterns
  last_interaction: LastInteraction | null
}

/**
 * Service de mémoire centralisée pour l'IA
 * Charge et gère TOUT l'historique de l'utilisateur
 */
export class AIMemoryService {

  /**
   * Charge TOUTE la mémoire de l'utilisateur
   */
  static async loadUserMemory(userId: string): Promise<UserMemory> {
    try {
      // 1. Charger véhicules
      const { data: vehiclesData } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      // 2. Charger diagnostics
      const { data: diagnosticsData } = await supabase
        .from('diagnostics')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      // 3. Charger conversations chat mécanicien
      const { data: chatHistoryData } = await supabase
        .from('mechanic_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(20)

      // 4. Charger vidéos analysées
      const { data: videoAnalysesData } = await supabase
        .from('video_diagnostic')
        .select('*')
        .eq('utilisateur_id', userId)
        .order('cree_at', { ascending: false })
        .limit(20)

      // 5. Charger devis analysés
      const { data: devisAnalysesData } = await supabase
        .from('devis_analyses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      // 6. Charger entretiens
      const { data: entretiensData } = await supabase
        .from('entretiens')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(30)

      // 7. Charger historique interactions
      const { data: interactionsData } = await supabase
        .from('interactions_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      // 8. Consolider en mémoire structurée
      return this.consolidateMemory({
        vehicles: vehiclesData || [],
        diagnostics: diagnosticsData || [],
        chatHistory: chatHistoryData || [],
        videoAnalyses: videoAnalysesData || [],
        devisAnalyses: devisAnalysesData || [],
        entretiens: entretiensData || [],
        interactions: interactionsData || []
      })
    } catch (error) {
      console.error('Error loading user memory:', error)
      return this.getEmptyMemory()
    }
  }

  /**
   * Retourne une mémoire vide par défaut
   */
  private static getEmptyMemory(): UserMemory {
    return {
      vehicles: [],
      problemes_historiques: [],
      entretiens: [],
      pieces_changees: [],
      preferences: {
        budget_type: 'moyen',
        fait_entretien_lui_meme: false,
        niveau_technique: 'débutant'
      },
      patterns: {
        problemes_recurrents: [],
        conduite_type: 'mixte',
        frequence_entretien: 'moyen'
      },
      last_interaction: null
    }
  }

  /**
   * Consolide toutes les données en mémoire structurée
   */
  private static consolidateMemory(data: {
    vehicles: any[]
    diagnostics: any[]
    chatHistory: any[]
    videoAnalyses: any[]
    devisAnalyses: any[]
    entretiens: any[]
    interactions: any[]
  }): UserMemory {
    const memory: UserMemory = this.getEmptyMemory()

    // Mapper les véhicules
    memory.vehicles = (data.vehicles || []).map(v => ({
      id: v.id,
      brand: v.brand || v.marque,
      model: v.model || v.modele,
      year: v.year || v.annee,
      license_plate: v.license_plate || v.plaque,
      kilometrage: v.kilometrage || v.mileage,
      fuel_type: v.fuel_type || v.carburant,
      derniere_revision: v.derniere_revision,
      date_achat: v.date_achat
    }))

    // Consolider diagnostics
    data.diagnostics?.forEach((diag: any) => {
      const conversation = diag.conversation || []
      const userMessages = conversation.filter((m: any) => m.role === 'user')
      const firstUserMessage = userMessages[0]?.content || diag.description || 'Diagnostic'

      memory.problemes_historiques.push({
        date: diag.created_at,
        type: 'diagnostic',
        probleme: firstUserMessage,
        solution: this.extractSolution(conversation),
        cout: this.extractCost(conversation),
        resolu: diag.resolu || false
      })
    })

    // Consolider chats mécanicien
    data.chatHistory?.forEach((chat: any) => {
      const messages = chat.messages || []
      const userMessages = messages.filter((m: any) => m.role === 'user')
      const lastUserMessage = userMessages[userMessages.length - 1]?.content

      if (lastUserMessage) {
        memory.problemes_historiques.push({
          date: chat.updated_at || chat.created_at,
          type: 'chat',
          probleme: lastUserMessage,
          resolu: chat.resolu || false
        })
      }
    })

    // Consolider vidéos
    data.videoAnalyses?.forEach((video: any) => {
      const result = video.analyse_resultat || video.analysis_result
      memory.problemes_historiques.push({
        date: video.cree_at || video.created_at,
        type: 'video',
        probleme: result?.verdict?.diagnostic || result?.synthesis?.diagnostic_global || 'Analyse vidéo',
        cout: result?.verdict?.cout_estime?.total || result?.prix_pieces?.reduce((sum: number, p: any) => sum + (p.prix || 0), 0),
        resolu: false
      })
    })

    // Consolider devis
    data.devisAnalyses?.forEach((devis: any) => {
      const result = devis.analysis_result
      const verdictText = typeof result === 'string'
        ? result
        : result?.verdict?.statut || 'Analyse devis'

      memory.problemes_historiques.push({
        date: devis.created_at,
        type: 'devis',
        probleme: `Devis: ${verdictText}`,
        cout: devis.total_amount,
        resolu: true
      })
    })

    // Consolider entretiens
    memory.entretiens = (data.entretiens || []).map(ent => ({
      date: ent.date,
      type: ent.type,
      garage: ent.garage,
      cout: ent.cout,
      kilometrage: ent.kilometrage,
      pieces_changees: ent.pieces_changees || []
    }))

    // Extraire pièces changées des entretiens
    data.entretiens?.forEach((ent: any) => {
      (ent.pieces_changees || []).forEach((piece: string) => {
        memory.pieces_changees.push({
          piece,
          date: ent.date,
          kilometrage: ent.kilometrage,
          garantie_jusqu_a: ent.garantie_jusqu_a
        })
      })
    })

    // Consolider interactions récentes
    data.interactions?.forEach((interaction: any) => {
      if (!memory.problemes_historiques.find(p =>
        p.probleme === interaction.probleme && p.date === interaction.created_at
      )) {
        memory.problemes_historiques.push({
          date: interaction.created_at,
          type: interaction.type,
          probleme: interaction.probleme,
          solution: interaction.solution,
          cout: interaction.cout,
          resolu: interaction.resolu || false
        })
      }
    })

    // Trier par date décroissante
    memory.problemes_historiques.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    // Détecter patterns
    const problemes = memory.problemes_historiques.map(p => p.probleme.toLowerCase())
    memory.patterns.problemes_recurrents = this.detectRecurringProblems(problemes)

    // Analyser fréquence entretien
    memory.patterns.frequence_entretien = this.analyzeMaintenanceFrequency(memory.entretiens)

    // Dernière interaction
    if (memory.problemes_historiques.length > 0) {
      const last = memory.problemes_historiques[0]
      memory.last_interaction = {
        date: last.date,
        type: last.type,
        sujet: last.probleme,
        non_resolu: !last.resolu
      }
    }

    return memory
  }

  /**
   * Extrait la solution d'une conversation de diagnostic
   */
  private static extractSolution(conversation: any[]): string | undefined {
    const assistantMessages = conversation.filter((m: any) => m.role === 'assistant')
    const lastAssistant = assistantMessages[assistantMessages.length - 1]?.content

    if (lastAssistant) {
      // Chercher une section "solution" ou "recommandation"
      const solutionMatch = lastAssistant.match(/(?:solution|recommandation|conseil)[:\s]*([^\n]+)/i)
      if (solutionMatch) return solutionMatch[1].trim()

      // Sinon retourner les 100 premiers caractères
      return lastAssistant.substring(0, 100) + '...'
    }
    return undefined
  }

  /**
   * Extrait le coût estimé d'une conversation
   */
  private static extractCost(conversation: any[]): number | undefined {
    const assistantMessages = conversation.filter((m: any) => m.role === 'assistant')

    for (const msg of assistantMessages) {
      const content = msg.content || ''
      // Chercher des patterns de prix
      const priceMatch = content.match(/(\d+(?:\s*à\s*\d+)?)\s*€/g)
      if (priceMatch && priceMatch.length > 0) {
        // Prendre le premier prix trouvé
        const price = priceMatch[0].replace(/[^\d]/g, '')
        return parseInt(price, 10)
      }
    }
    return undefined
  }

  /**
   * Détecte les problèmes récurrents
   */
  private static detectRecurringProblems(problemes: string[]): string[] {
    const keywords = [
      'freinage', 'frein', 'plaquette',
      'bruit', 'grincement', 'claquement',
      'fuite', 'huile', 'liquide',
      'voyant', 'témoin', 'alerte',
      'démarrage', 'batterie', 'alternateur',
      'embrayage', 'boîte', 'vitesse',
      'suspension', 'amortisseur',
      'climatisation', 'chauffage',
      'moteur', 'turbo', 'injection'
    ]

    const recurring: string[] = []

    keywords.forEach(keyword => {
      const count = problemes.filter(p => p.includes(keyword)).length
      if (count >= 2) {
        recurring.push(keyword)
      }
    })

    return [...new Set(recurring)] // Dédupliquer
  }

  /**
   * Analyse la fréquence d'entretien
   */
  private static analyzeMaintenanceFrequency(entretiens: Entretien[]): 'bon' | 'moyen' | 'mauvais' {
    if (entretiens.length === 0) return 'moyen'

    const now = new Date()
    const sixMonthsAgo = new Date(now.setMonth(now.getMonth() - 6))
    const recentEntretiens = entretiens.filter(e => new Date(e.date) > sixMonthsAgo)

    if (recentEntretiens.length >= 2) return 'bon'
    if (recentEntretiens.length === 1) return 'moyen'
    return 'mauvais'
  }

  /**
   * Génère un contexte texte formaté pour l'IA
   */
  static generateContextForAI(memory: UserMemory): string {
    const vehicleSection = memory.vehicles.length > 0
      ? memory.vehicles.map(v => `
- ${v.brand} ${v.model} ${v.year}
  Immatriculation: ${v.license_plate || 'Non renseigné'}
  Kilométrage: ${v.kilometrage ? `${v.kilometrage.toLocaleString('fr-FR')} km` : 'Non renseigné'}
  Carburant: ${v.fuel_type || 'Non renseigné'}
  Dernière révision: ${v.derniere_revision || 'Non renseigné'}
`).join('')
      : 'Aucun véhicule enregistré'

    const problemsSection = memory.problemes_historiques.length > 0
      ? memory.problemes_historiques.slice(0, 10).map(p => `
[${new Date(p.date).toLocaleDateString('fr-FR')}] ${p.type.toUpperCase()}
Problème: ${p.probleme}
${p.solution ? `Solution: ${p.solution}` : ''}
${p.cout ? `Coût: ${p.cout}€` : ''}
Statut: ${p.resolu ? '✅ Résolu' : '⚠️ Non résolu'}
`).join('\n')
      : 'Aucun problème enregistré'

    const piecesSection = memory.pieces_changees.length > 0
      ? memory.pieces_changees.slice(0, 10).map(p => `
- ${p.piece} (${new Date(p.date).toLocaleDateString('fr-FR')})
  ${p.kilometrage ? `À ${p.kilometrage.toLocaleString('fr-FR')} km` : ''}
  ${p.garantie_jusqu_a ? `Garantie jusqu'au ${p.garantie_jusqu_a}` : ''}
`).join('')
      : 'Aucune pièce changée enregistrée'

    const entretiensSection = memory.entretiens.length > 0
      ? memory.entretiens.slice(0, 5).map(e => `
[${new Date(e.date).toLocaleDateString('fr-FR')}] ${e.type}
${e.garage ? `Garage: ${e.garage}` : ''}
${e.cout ? `Coût: ${e.cout}€` : ''}
${e.pieces_changees.length > 0 ? `Pièces: ${e.pieces_changees.join(', ')}` : ''}
`).join('\n')
      : 'Aucun entretien enregistré'

    const lastInteractionSection = memory.last_interaction
      ? `
Date: ${new Date(memory.last_interaction.date).toLocaleDateString('fr-FR')}
Type: ${memory.last_interaction.type}
Sujet: ${memory.last_interaction.sujet}
${memory.last_interaction.non_resolu ? '⚠️ PROBLÈME NON RÉSOLU - À suivre' : '✅ Résolu'}
`
      : 'Aucune interaction précédente'

    return `
═══════════════════════════════════════════════════════════════
                    MÉMOIRE UTILISATEUR MECAI
═══════════════════════════════════════════════════════════════

VÉHICULE(S):
${vehicleSection}

═══════════════════════════════════════════════════════════════

HISTORIQUE PROBLÈMES (${memory.problemes_historiques.length} au total):
${problemsSection}

═══════════════════════════════════════════════════════════════

PIÈCES DÉJÀ CHANGÉES (${memory.pieces_changees.length}):
${piecesSection}

═══════════════════════════════════════════════════════════════

ENTRETIENS EFFECTUÉS (${memory.entretiens.length}):
${entretiensSection}

═══════════════════════════════════════════════════════════════

PATTERNS DÉTECTÉS:
- Problèmes récurrents: ${memory.patterns.problemes_recurrents.length > 0 ? memory.patterns.problemes_recurrents.join(', ') : 'Aucun détecté'}
- Type de conduite estimé: ${memory.patterns.conduite_type}
- Fréquence entretien: ${memory.patterns.frequence_entretien}

═══════════════════════════════════════════════════════════════

PRÉFÉRENCES:
- Budget: ${memory.preferences.budget_type}
- Fait l'entretien lui-même: ${memory.preferences.fait_entretien_lui_meme ? 'Oui' : 'Non'}
- Niveau technique: ${memory.preferences.niveau_technique}
${memory.preferences.garage_habituel ? `- Garage habituel: ${memory.preferences.garage_habituel}` : ''}

═══════════════════════════════════════════════════════════════

DERNIÈRE INTERACTION:
${lastInteractionSection}

═══════════════════════════════════════════════════════════════
`
  }

  /**
   * Sauvegarde une nouvelle interaction
   */
  static async saveInteraction(
    userId: string,
    type: 'diagnostic' | 'chat' | 'video' | 'devis',
    data: {
      probleme: string
      solution?: string
      cout?: number
      resolu?: boolean
    }
  ): Promise<void> {
    try {
      await supabase.from('interactions_history').insert({
        user_id: userId,
        type,
        probleme: data.probleme,
        solution: data.solution,
        cout: data.cout,
        resolu: data.resolu || false,
        created_at: new Date().toISOString()
      })
    } catch (error) {
      console.warn('Error saving interaction:', error)
    }
  }

  /**
   * Génère un résumé court pour l'affichage
   */
  static generateShortSummary(memory: UserMemory): string {
    const vehicle = memory.vehicles[0]
    const vehicleText = vehicle
      ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}`
      : 'Véhicule non renseigné'

    const problemsCount = memory.problemes_historiques.length
    const unresolvedCount = memory.problemes_historiques.filter(p => !p.resolu).length

    return `${vehicleText} | ${problemsCount} interaction(s) | ${unresolvedCount} non résolu(s)`
  }
}
