import type { FinalDiagnosis } from '@/types'

interface DiagnosticResultProps {
  diagnosis: FinalDiagnosis
}

const urgencyConfig = {
  low: { label: 'Faible', color: 'bg-green-500', textColor: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-950/30', icon: '🟢' },
  medium: { label: 'Moyen', color: 'bg-yellow-500', textColor: 'text-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-950/30', icon: '🟡' },
  high: { label: 'Urgent', color: 'bg-red-500', textColor: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-950/30', icon: '🔴' }
}

export default function DiagnosticResult({ diagnosis }: DiagnosticResultProps) {
  const urgency = urgencyConfig[diagnosis.urgency_level]

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl">
            🔬
          </div>
          <div>
            <h2 className="text-lg font-semibold">Diagnostic Expert</h2>
            <p className="text-blue-100 text-sm">Confiance: {diagnosis.confidence_percent}%</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary */}
        <div className={`p-4 rounded-xl ${urgency.bgColor}`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">{urgency.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${urgency.color} text-white`}>
                  {urgency.label}
                </span>
              </div>
              <p className={`font-medium ${urgency.textColor}`}>{diagnosis.diagnosis_summary}</p>
            </div>
          </div>
        </div>

        {/* Problem Identified */}
        <div>
          <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-2 flex items-center gap-2">
            <span>🎯</span> Problème identifié
          </h3>
          <p className="text-neutral-800 dark:text-neutral-200">{diagnosis.problem_identified}</p>
        </div>

        {/* Cost Estimate */}
        <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-3 flex items-center gap-2">
            <span>💰</span> Estimation financière
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-neutral-600 dark:text-neutral-400">Coût total estimé</span>
            <span className="text-xl font-bold text-neutral-900 dark:text-white">
              {diagnosis.estimated_cost_min} - {diagnosis.estimated_cost_max} €
            </span>
          </div>
          {diagnosis.parts_needed && diagnosis.parts_needed.length > 0 && (
            <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
              <p className="text-xs text-neutral-500 mb-2">Pièces nécessaires:</p>
              <div className="space-y-1">
                {diagnosis.parts_needed.map((part, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-neutral-700 dark:text-neutral-300">{part.name}</span>
                    <span className="text-neutral-500">{part.price_estimate}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Causes */}
        {diagnosis.causes.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-2 flex items-center gap-2">
              <span>🔍</span> Causes possibles
            </h3>
            <ul className="space-y-1">
              {diagnosis.causes.map((cause, i) => (
                <li key={i} className="flex items-start gap-2 text-neutral-700 dark:text-neutral-300">
                  <span className="text-neutral-400 mt-1">•</span>
                  <span>{cause}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {diagnosis.recommendations.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-2 flex items-center gap-2">
              <span>✅</span> Recommandations
            </h3>
            <ol className="space-y-2">
              {diagnosis.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-3 text-neutral-700 dark:text-neutral-300">
                  <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-medium flex-shrink-0">
                    {i + 1}
                  </span>
                  <span>{rec}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* DIY Difficulty */}
        {diagnosis.diy_difficulty && (
          <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
            <span className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
              <span>🛠️</span> Difficulté DIY
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <span
                  key={level}
                  className={`text-lg ${level <= diagnosis.diy_difficulty! ? 'opacity-100' : 'opacity-20'}`}
                >
                  ⭐
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-700">
        <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
          Diagnostic généré par MECAI • À titre indicatif uniquement
        </p>
      </div>
    </div>
  )
}
