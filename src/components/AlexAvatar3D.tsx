import { useEffect, useRef, useState } from 'react'

interface AlexAvatar3DProps {
  isSpeaking?: boolean
  isListening?: boolean
}

export function AlexAvatar3D({ isSpeaking = false, isListening = false }: AlexAvatar3DProps) {
  const [mouthOpen, setMouthOpen] = useState(0)
  const animationRef = useRef<number | null>(null)

  // Animate mouth when speaking
  useEffect(() => {
    if (isSpeaking) {
      const animate = () => {
        setMouthOpen(Math.random() * 0.8 + 0.2)
        animationRef.current = requestAnimationFrame(() => {
          setTimeout(animate, 100 + Math.random() * 100)
        })
      }
      animate()
    } else {
      setMouthOpen(0)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isSpeaking])

  return (
    <div className="w-full h-full relative overflow-hidden rounded-2xl">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950" />

      {/* Ambient glow effect */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${
        isSpeaking ? 'opacity-40' : isListening ? 'opacity-30' : 'opacity-0'
      }`}>
        <div className={`absolute inset-0 ${
          isSpeaking
            ? 'bg-gradient-to-t from-green-500/30 via-transparent to-transparent'
            : 'bg-gradient-to-t from-blue-500/30 via-transparent to-transparent'
        }`} />
      </div>

      {/* Avatar container - positioned to show head + shoulders + upper torso */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative" style={{ transform: 'translateY(5%)' }}>

          {/* Body/Torso */}
          <div className="relative">
            {/* Shoulders and chest */}
            <svg viewBox="0 0 200 280" className="w-64 h-80">
              {/* Torso / Mechanic uniform */}
              <ellipse cx="100" cy="260" rx="75" ry="50" fill="#1e3a5f" />
              <rect x="25" y="180" width="150" height="100" rx="30" fill="#1e3a5f" />

              {/* Collar / uniform detail */}
              <path d="M70 180 Q100 200 130 180" fill="none" stroke="#0f2847" strokeWidth="8" />

              {/* Neck */}
              <rect x="80" y="145" width="40" height="45" rx="10" fill="#e8b89d" />

              {/* Head */}
              <ellipse cx="100" cy="100" rx="50" ry="60" fill="#e8b89d" />

              {/* Hair */}
              <ellipse cx="100" cy="55" rx="48" ry="30" fill="#3d2817" />
              <path d="M52 70 Q50 50 60 40 Q80 30 100 35 Q120 30 140 40 Q150 50 148 70" fill="#3d2817" />

              {/* Ears */}
              <ellipse cx="50" cy="100" rx="8" ry="14" fill="#e8b89d" />
              <ellipse cx="150" cy="100" rx="8" ry="14" fill="#e8b89d" />

              {/* Eyebrows */}
              <path d="M70 80 Q80 75 90 80" fill="none" stroke="#3d2817" strokeWidth="3" strokeLinecap="round" />
              <path d="M110 80 Q120 75 130 80" fill="none" stroke="#3d2817" strokeWidth="3" strokeLinecap="round" />

              {/* Eyes */}
              <ellipse cx="80" cy="95" rx="10" ry="8" fill="white" />
              <ellipse cx="120" cy="95" rx="10" ry="8" fill="white" />

              {/* Pupils - animated slightly */}
              <circle cx={isListening ? 82 : 80} cy="95" r="5" fill="#2d5a7b">
                <animate attributeName="cx" values="79;81;79" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx={isListening ? 122 : 120} cy="95" r="5" fill="#2d5a7b">
                <animate attributeName="cx" values="119;121;119" dur="3s" repeatCount="indefinite" />
              </circle>

              {/* Eye shine */}
              <circle cx="77" cy="93" r="2" fill="white" />
              <circle cx="117" cy="93" r="2" fill="white" />

              {/* Nose */}
              <path d="M100 95 L100 115 Q95 120 100 122 Q105 120 100 115" fill="none" stroke="#d4a389" strokeWidth="2" />

              {/* Mouth - animated when speaking */}
              <ellipse
                cx="100"
                cy="138"
                rx={isSpeaking ? 12 + mouthOpen * 3 : 12}
                ry={isSpeaking ? 3 + mouthOpen * 8 : 3}
                fill={isSpeaking ? "#c9736b" : "#d4a389"}
              >
                {!isSpeaking && (
                  <animate attributeName="ry" values="3;4;3" dur="4s" repeatCount="indefinite" />
                )}
              </ellipse>

              {/* Subtle smile lines */}
              {!isSpeaking && (
                <>
                  <path d="M85 138 Q100 148 115 138" fill="none" stroke="#d4a389" strokeWidth="2" strokeLinecap="round" />
                </>
              )}

              {/* Name badge on uniform */}
              <rect x="55" y="200" width="40" height="15" rx="3" fill="#f0f0f0" />
              <text x="75" y="212" textAnchor="middle" fontSize="9" fill="#333" fontWeight="bold">ALEX</text>

              {/* Wrench logo on chest */}
              <g transform="translate(105, 195) scale(0.6)">
                <path d="M10 5 L30 25 M30 5 L10 25" stroke="#4a90d9" strokeWidth="4" strokeLinecap="round" />
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* Status indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm ${
          isSpeaking
            ? 'bg-green-500/20 border border-green-500/30'
            : isListening
              ? 'bg-blue-500/20 border border-blue-500/30'
              : 'bg-white/10 border border-white/10'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isSpeaking
              ? 'bg-green-400 animate-pulse'
              : isListening
                ? 'bg-blue-400 animate-pulse'
                : 'bg-gray-400'
          }`} />
          <span className={`text-xs font-medium ${
            isSpeaking
              ? 'text-green-300'
              : isListening
                ? 'text-blue-300'
                : 'text-white/60'
          }`}>
            {isSpeaking ? 'Alex parle...' : isListening ? 'Écoute...' : 'Prêt'}
          </span>
        </div>
      </div>

      {/* Sound waves when speaking */}
      {isSpeaking && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-end gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-green-400/60 rounded-full"
              style={{
                height: `${8 + Math.random() * 16}px`,
                animation: `soundWave 0.5s ease-in-out infinite`,
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Listening pulse rings */}
      {isListening && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute w-48 h-48 rounded-full border-2 border-blue-400/30 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute w-64 h-64 rounded-full border border-blue-400/20 animate-ping" style={{ animationDuration: '2.5s' }} />
        </div>
      )}

      <style>{`
        @keyframes soundWave {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.8); }
        }
      `}</style>
    </div>
  )
}

export default AlexAvatar3D
