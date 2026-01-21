import { Link } from 'react-router-dom'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  linkTo?: string
  className?: string
  variant?: 'default' | 'dark' | 'icon'
}

export default function Logo({
  size = 'md',
  showText = true,
  linkTo,
  className = '',
  variant: _variant = 'default'
}: LogoProps) {
  // _variant is available for future external SVG file loading
  void _variant
  const sizes = {
    sm: { icon: 32, text: 'text-lg', gap: 'gap-2' },
    md: { icon: 40, text: 'text-xl', gap: 'gap-2.5' },
    lg: { icon: 56, text: 'text-2xl', gap: 'gap-3' },
  }

  const s = sizes[size]

  // Gradient IDs uniques pour éviter les conflits
  const gradientId = `mecai-grad-${Math.random().toString(36).substr(2, 9)}`
  const textGradientId = `mecai-text-${Math.random().toString(36).substr(2, 9)}`

  const logoContent = (
    <div className={`flex items-center ${s.gap} ${className}`}>
      {/* Logo SVG - Voiture stylisée + réseau IA */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <defs>
          {/* Gradient radial pour fond */}
          <radialGradient id={`${gradientId}-bg`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1e293b"/>
            <stop offset="100%" stopColor="#0f172a"/>
          </radialGradient>

          {/* Gradient principal orange → rose → bleu */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316"/>
            <stop offset="50%" stopColor="#f43f5e"/>
            <stop offset="100%" stopColor="#3b82f6"/>
          </linearGradient>

          {/* Glow effect */}
          <radialGradient id={`${gradientId}-glow`} cx="50%" cy="70%" r="50%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
          </radialGradient>
        </defs>

        {/* Background avec coins arrondis */}
        <rect width="48" height="48" fill={`url(#${gradientId}-bg)`} rx="10"/>

        {/* Glow subtil */}
        <ellipse cx="24" cy="30" rx="16" ry="4" fill={`url(#${gradientId}-glow)`} opacity="0.5"/>

        {/* Icon : Voiture + IA */}
        <g transform="translate(6, 10)">
          {/* Carrosserie fluide */}
          <path
            d="M 6 14 Q 10 6, 18 6 L 26 6 Q 30 6, 32 10 L 34 14 Q 36 18, 32 22 L 6 22 Q 2 18, 6 14 Z"
            fill={`url(#${gradientId})`}
          />

          {/* Circuit IA */}
          <g stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.9">
            <line x1="10" y1="12" x2="13" y2="12"/>
            <line x1="17" y1="12" x2="20" y2="12"/>
            <line x1="24" y1="12" x2="27" y2="12"/>
            <circle cx="11.5" cy="12" r="1.5" fill="white"/>
            <circle cx="18.5" cy="12" r="1.5" fill="white"/>
            <circle cx="25.5" cy="12" r="1.5" fill="white"/>
          </g>

          {/* Roues */}
          <circle cx="10" cy="22" r="3" fill="#0f172a"/>
          <circle cx="10" cy="22" r="2.2" fill={`url(#${gradientId})`}/>
          <circle cx="28" cy="22" r="3" fill="#0f172a"/>
          <circle cx="28" cy="22" r="2.2" fill={`url(#${gradientId})`}/>

          {/* Highlight */}
          <path d="M 22 8 Q 25 6.5, 28 8" stroke="white" strokeWidth="1" opacity="0.4" strokeLinecap="round" fill="none"/>
        </g>
      </svg>

      {/* Texte avec gradient */}
      {showText && (
        <div className="flex flex-col leading-none">
          <svg
            width={size === 'lg' ? 90 : size === 'md' ? 70 : 55}
            height={size === 'lg' ? 28 : size === 'md' ? 22 : 18}
            viewBox="0 0 90 28"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id={textGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f97316"/>
                <stop offset="40%" stopColor="#f43f5e"/>
                <stop offset="100%" stopColor="#3b82f6"/>
              </linearGradient>
            </defs>
            <text
              x="0"
              y="22"
              fontFamily="'SF Pro Display', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              fontSize="26"
              fontWeight="800"
              fill={`url(#${textGradientId})`}
              letterSpacing="-0.03em"
            >
              MECAI
            </text>
          </svg>
          {size === 'lg' && (
            <span className="text-[10px] bg-gradient-to-r from-orange-500 via-rose-500 to-blue-500 bg-clip-text text-transparent font-semibold tracking-widest mt-1">
              TON EXPERT AUTO PAR IA
            </span>
          )}
        </div>
      )}
    </div>
  )

  if (linkTo) {
    return <Link to={linkTo}>{logoContent}</Link>
  }

  return logoContent
}
