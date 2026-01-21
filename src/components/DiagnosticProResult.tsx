import { useState } from 'react'
import type { FinalDiagnosisPro } from '@/types'

interface DiagnosticProResultProps {
  diagnosis: FinalDiagnosisPro
}

const urgencyConfig = {
  faible: { label: 'Faible', color: 'bg-green-500', textColor: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-950/30', icon: '🟢' },
  moyen: { label: 'Moyen', color: 'bg-yellow-500', textColor: 'text-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-950/30', icon: '🟡' },
  urgent: { label: 'Urgent', color: 'bg-red-500', textColor: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-950/30', icon: '🔴' }
}

const difficultyConfig = {
  facile: { label: 'Facile', stars: 1, color: 'text-green-500' },
  moyen: { label: 'Moyen', stars: 3, color: 'text-yellow-500' },
  difficile: { label: 'Difficile', stars: 4, color: 'text-orange-500' },
  impossible: { label: 'Pro requis', stars: 5, color: 'text-red-500' }
}

const probabilityConfig = {
  'élevée': { label: 'Haute', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  'moyenne': { label: 'Moyenne', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  'faible': { label: 'Faible', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' }
}

export default function DiagnosticProResult({ diagnosis }: DiagnosticProResultProps) {
  const [showAllSources, setShowAllSources] = useState(false)
  const urgency = urgencyConfig[diagnosis.urgency_level]
  const difficulty = diagnosis.difficulty_diy ? difficultyConfig[diagnosis.difficulty_diy] : null

  const visibleSources = showAllSources ? diagnosis.sources : diagnosis.sources?.slice(0, 3)

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl md:rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-3 md:p-5 text-white">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl md:text-3xl">
            🔬
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
              <h2 className="text-sm md:text-lg font-bold truncate">Diagnostic PRO</h2>
              <span className="text-[9px] md:text-xs font-semibold px-1.5 md:px-2 py-0.5 rounded bg-white/20 flex-shrink-0">
                RAPPORT
              </span>
            </div>
            {diagnosis.confidence_percent && (
              <p className="text-violet-100 text-[10px] md:text-sm">Confiance: {diagnosis.confidence_percent}%</p>
            )}
          </div>
          {diagnosis.sources && diagnosis.sources.length > 0 && (
            <div className="text-right flex-shrink-0">
              <div className="text-lg md:text-2xl font-bold">{diagnosis.sources.length}</div>
              <div className="text-[9px] md:text-xs text-violet-200">sources</div>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 md:p-5 space-y-3 md:space-y-5">
        {/* Summary */}
        <div className={`p-3 md:p-4 rounded-lg md:rounded-xl ${urgency.bgColor}`}>
          <div className="flex items-start gap-2 md:gap-3">
            <span className="text-lg md:text-2xl">{urgency.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
                <span className={`text-[10px] md:text-xs font-semibold px-1.5 md:px-2 py-0.5 rounded-full ${urgency.color} text-white`}>
                  Urgence: {urgency.label}
                </span>
              </div>
              <p className={`font-medium text-xs md:text-base ${urgency.textColor}`}>{diagnosis.diagnosis_summary}</p>
            </div>
          </div>
        </div>

        {/* Problem Identified */}
        {diagnosis.problem_identified && (
          <div>
            <h3 className="text-xs md:text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5 md:mb-2 flex items-center gap-1.5 md:gap-2">
              <span>🎯</span> Problème identifié
            </h3>
            <p className="text-xs md:text-base text-neutral-800 dark:text-neutral-200">{diagnosis.problem_identified}</p>
          </div>
        )}

        {/* Causes with probabilities */}
        {diagnosis.causes_possibles && diagnosis.causes_possibles.length > 0 && (
          <div>
            <h3 className="text-xs md:text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-2 md:mb-3 flex items-center gap-1.5 md:gap-2">
              <span>🔍</span> Causes possibles
            </h3>
            <div className="space-y-2 md:space-y-3">
              {diagnosis.causes_possibles.map((cause, i) => {
                const prob = probabilityConfig[cause.probabilite]
                return (
                  <div key={i} className="bg-neutral-50 dark:bg-neutral-800 rounded-lg md:rounded-xl p-2.5 md:p-4">
                    <div className="flex items-start justify-between gap-2 md:gap-3 mb-1 md:mb-2">
                      <span className="font-medium text-xs md:text-base text-neutral-800 dark:text-neutral-200">{cause.cause}</span>
                      <span className={`text-[9px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${prob.color}`}>
                        {prob.label}
                      </span>
                    </div>
                    <p className="text-[10px] md:text-sm text-neutral-600 dark:text-neutral-400">{cause.explication}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Cost Estimate */}
        <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg md:rounded-xl p-2.5 md:p-4">
          <h3 className="text-xs md:text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-2 md:mb-3 flex items-center gap-1.5 md:gap-2">
            <span>💰</span> Estimation financière
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-base text-neutral-600 dark:text-neutral-400">Coût estimé</span>
            <span className="text-lg md:text-2xl font-bold text-neutral-900 dark:text-white">
              {diagnosis.estimated_cost_min} - {diagnosis.estimated_cost_max} €
            </span>
          </div>
          {diagnosis.time_estimate && (
            <div className="flex items-center justify-between mt-1.5 md:mt-2 pt-1.5 md:pt-2 border-t border-neutral-200 dark:border-neutral-700">
              <span className="text-[10px] md:text-sm text-neutral-500">Temps estimé</span>
              <span className="text-[10px] md:text-sm font-medium text-neutral-700 dark:text-neutral-300">{diagnosis.time_estimate}</span>
            </div>
          )}
        </div>

        {/* Parts Needed */}
        {diagnosis.parts_needed && diagnosis.parts_needed.length > 0 && (
          <div>
            <h3 className="text-xs md:text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-2 md:mb-3 flex items-center gap-1.5 md:gap-2">
              <span>🔧</span> Pièces nécessaires
            </h3>
            <div className="space-y-1.5 md:space-y-2">
              {diagnosis.parts_needed.map((part, i) => (
                <div key={i} className="flex items-center justify-between p-2 md:p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs md:text-base text-neutral-800 dark:text-neutral-200 block truncate">{part.name}</span>
                    {part.reference && (
                      <span className="text-[9px] md:text-xs text-neutral-500">Réf: {part.reference}</span>
                    )}
                  </div>
                  <span className="font-medium text-xs md:text-base text-violet-600 dark:text-violet-400 ml-2 flex-shrink-0">{part.price_estimate}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TSB Found */}
        {diagnosis.tsb_found && diagnosis.tsb_found.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg md:rounded-xl p-2.5 md:p-4 border border-amber-200 dark:border-amber-800">
            <h3 className="text-xs md:text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2 md:mb-3 flex items-center gap-1.5 md:gap-2">
              <span>📋</span> <span className="hidden xs:inline">TSB</span> Bulletins Techniques
            </h3>
            <div className="space-y-1.5 md:space-y-2">
              {diagnosis.tsb_found.map((tsb, i) => (
                <div key={i} className="text-[10px] md:text-sm">
                  <div className="font-medium text-amber-800 dark:text-amber-300">{tsb.reference}</div>
                  <p className="text-amber-700 dark:text-amber-400">{tsb.description}</p>
                  {tsb.url && (
                    <a href={tsb.url} target="_blank" rel="noopener noreferrer" className="text-[9px] md:text-xs text-amber-600 underline">
                      Voir le TSB
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {diagnosis.recommandations && diagnosis.recommandations.length > 0 && (
          <div>
            <h3 className="text-xs md:text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-2 md:mb-3 flex items-center gap-1.5 md:gap-2">
              <span>✅</span> Recommandations
            </h3>
            <ol className="space-y-1.5 md:space-y-2">
              {diagnosis.recommandations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 md:gap-3 text-neutral-700 dark:text-neutral-300">
                  <span className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center text-[10px] md:text-xs font-semibold flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-xs md:text-base">{rec}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Risks if ignored */}
        {diagnosis.risks_if_ignored && diagnosis.risks_if_ignored.length > 0 && (
          <div className="bg-red-50 dark:bg-red-950/30 rounded-lg md:rounded-xl p-2.5 md:p-4 border border-red-200 dark:border-red-800">
            <h3 className="text-xs md:text-sm font-semibold text-red-700 dark:text-red-400 mb-1.5 md:mb-2 flex items-center gap-1.5 md:gap-2">
              <span>⚠️</span> Risques si non traité
            </h3>
            <ul className="space-y-0.5 md:space-y-1">
              {diagnosis.risks_if_ignored.map((risk, i) => (
                <li key={i} className="flex items-start gap-1.5 md:gap-2 text-[10px] md:text-sm text-red-700 dark:text-red-400">
                  <span>•</span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* DIY Difficulty */}
        {difficulty && (
          <div className="flex items-center justify-between p-2.5 md:p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg md:rounded-xl">
            <span className="text-[10px] md:text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-1.5 md:gap-2">
              <span>🛠️</span> Difficulté DIY
            </span>
            <div className="flex items-center gap-1.5 md:gap-2">
              <span className={`text-[10px] md:text-sm font-medium ${difficulty.color}`}>{difficulty.label}</span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((level) => (
                  <span
                    key={level}
                    className={`text-[10px] md:text-sm ${level <= difficulty.stars ? 'opacity-100' : 'opacity-20'}`}
                  >
                    ⭐
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sources */}
        {diagnosis.sources && diagnosis.sources.length > 0 && (
          <div>
            <h3 className="text-xs md:text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-2 md:mb-3 flex items-center gap-1.5 md:gap-2">
              <span>📚</span> Sources ({diagnosis.sources.length})
            </h3>
            <div className="space-y-1 md:space-y-2">
              {visibleSources?.map((source, i) => (
                <div key={i} className="text-[9px] md:text-xs text-neutral-500 dark:text-neutral-400 truncate p-1.5 md:p-2 bg-neutral-50 dark:bg-neutral-800 rounded">
                  {source}
                </div>
              ))}
              {diagnosis.sources.length > 3 && (
                <button
                  onClick={() => setShowAllSources(!showAllSources)}
                  className="text-[10px] md:text-xs text-violet-600 dark:text-violet-400 hover:underline"
                >
                  {showAllSources ? 'Voir moins' : `+${diagnosis.sources.length - 3} sources`}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2.5 md:px-5 md:py-4 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center justify-between">
          <p className="text-[9px] md:text-xs text-neutral-500 dark:text-neutral-400">
            Diagnostic PRO par MECAI
          </p>
          <span className="text-[9px] md:text-xs text-neutral-400">{diagnosis.sources?.length || 0} sources</span>
        </div>
      </div>
    </div>
  )
}
