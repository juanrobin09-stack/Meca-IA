import { Link } from 'react-router-dom'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  linkTo?: string
  className?: string
}

export default function Logo({ size = 'md', showText = true, linkTo, className = '' }: LogoProps) {
  const sizes = {
    sm: { icon: 'h-8 w-8', text: 'text-lg' },
    md: { icon: 'h-10 w-10', text: 'text-xl' },
    lg: { icon: 'h-14 w-14', text: 'text-3xl' },
  }

  const logoContent = (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Icône logo - Clé à molette + IA */}
      <div className={`${sizes[size].icon} relative`}>
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Fond gradient */}
          <defs>
            <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E40AF" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
            <linearGradient id="wrenchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F8FAFC" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>
          </defs>

          {/* Fond carré arrondi */}
          <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#bgGradient)" />

          {/* Clé à molette stylisée */}
          <g transform="translate(8, 8)">
            {/* Tête de la clé (hexagonale) */}
            <path
              d="M8 4 L12 6 L12 12 L8 14 L4 12 L4 6 Z"
              fill="url(#wrenchGradient)"
              stroke="#CBD5E1"
              strokeWidth="0.5"
            />
            <circle cx="8" cy="9" r="2" fill="#1E40AF" />

            {/* Manche de la clé */}
            <rect x="6" y="14" width="4" height="14" rx="1" fill="url(#wrenchGradient)" />

            {/* Bout de la clé (ouvert) */}
            <path
              d="M4 28 L6 28 L6 32 L4 32 L4 28 Z M10 28 L12 28 L12 32 L10 32 L10 28 Z"
              fill="url(#wrenchGradient)"
            />
          </g>

          {/* Circuit/Puce IA */}
          <g transform="translate(22, 10)">
            <rect x="2" y="2" width="12" height="12" rx="2" fill="#10B981" />
            <text x="8" y="11" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="system-ui, sans-serif">IA</text>
            {/* Lignes de circuit */}
            <line x1="8" y1="0" x2="8" y2="2" stroke="#10B981" strokeWidth="1.5" />
            <line x1="8" y1="14" x2="8" y2="16" stroke="#10B981" strokeWidth="1.5" />
            <line x1="0" y1="8" x2="2" y2="8" stroke="#10B981" strokeWidth="1.5" />
            <line x1="14" y1="8" x2="16" y2="8" stroke="#10B981" strokeWidth="1.5" />
          </g>
        </svg>
      </div>

      {/* Texte logo */}
      {showText && (
        <span className={`${sizes[size].text} font-bold tracking-tight`}>
          <span className="text-gray-900 dark:text-white">Meca</span>
          <span className="text-blue-600">IA</span>
        </span>
      )}
    </div>
  )

  if (linkTo) {
    return <Link to={linkTo}>{logoContent}</Link>
  }

  return logoContent
}
