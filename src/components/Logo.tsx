import { Link } from 'react-router-dom'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  linkTo?: string
  className?: string
}

export default function Logo({ size = 'md', showText = true, linkTo, className = '' }: LogoProps) {
  const sizes = {
    sm: { icon: 32, text: 'text-lg', gap: 'gap-2' },
    md: { icon: 40, text: 'text-xl', gap: 'gap-2.5' },
    lg: { icon: 56, text: 'text-2xl', gap: 'gap-3' },
  }

  const s = sizes[size]

  const logoContent = (
    <div className={`flex items-center ${s.gap} ${className}`}>
      {/* Logo SVG - Tête AI + engrenage mécanique */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="headGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5EEAD4" />
            <stop offset="50%" stopColor="#2DD4BF" />
            <stop offset="100%" stopColor="#14B8A6" />
          </linearGradient>
          <linearGradient id="faceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#99F6E4" />
            <stop offset="100%" stopColor="#5EEAD4" />
          </linearGradient>
          <linearGradient id="circuitGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2DD4BF" />
            <stop offset="100%" stopColor="#14B8A6" />
          </linearGradient>
        </defs>

        {/* Orbite/anneau */}
        <ellipse
          cx="32"
          cy="34"
          rx="28"
          ry="10"
          stroke="url(#circuitGradient)"
          strokeWidth="1.5"
          fill="none"
          opacity="0.6"
        />

        {/* Tête polygonale style low-poly */}
        <path
          d="M32 8 L44 16 L48 28 L44 42 L38 48 L26 48 L20 42 L16 28 L20 16 Z"
          fill="url(#headGradient)"
          stroke="#0D9488"
          strokeWidth="1"
        />

        {/* Face interne */}
        <path
          d="M32 12 L40 18 L43 28 L40 38 L36 42 L28 42 L24 38 L21 28 L24 18 Z"
          fill="url(#faceGradient)"
          opacity="0.4"
        />

        {/* Lignes de structure */}
        <path
          d="M32 12 L32 42 M24 18 L40 38 M40 18 L24 38"
          stroke="#0D9488"
          strokeWidth="0.75"
          opacity="0.5"
        />

        {/* Yeux */}
        <circle cx="26" cy="26" r="3" fill="#0F766E" />
        <circle cx="38" cy="26" r="3" fill="#0F766E" />
        <circle cx="26" cy="26" r="1.5" fill="#5EEAD4" />
        <circle cx="38" cy="26" r="1.5" fill="#5EEAD4" />

        {/* Points de circuit sur l'orbite */}
        <circle cx="8" cy="34" r="2.5" fill="#2DD4BF" />
        <circle cx="56" cy="34" r="2.5" fill="#2DD4BF" />
        <circle cx="32" cy="44" r="2" fill="#14B8A6" />

        {/* Lignes de connexion */}
        <line x1="8" y1="34" x2="16" y2="34" stroke="#2DD4BF" strokeWidth="1.5" />
        <line x1="48" y1="34" x2="56" y2="34" stroke="#2DD4BF" strokeWidth="1.5" />
        <line x1="32" y1="44" x2="32" y2="48" stroke="#14B8A6" strokeWidth="1.5" />

        {/* Petits détails tech */}
        <rect x="29" y="32" width="6" height="4" rx="1" fill="#0D9488" opacity="0.6" />
      </svg>

      {/* Texte */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`${s.text} font-bold tracking-tight`}>
            <span className="text-gray-800 dark:text-white">MECA</span>
            <span className="text-teal-500"> AI</span>
          </span>
          {size === 'lg' && (
            <span className="text-[10px] text-teal-600 dark:text-teal-400 tracking-widest mt-0.5">
              COPILOTE MÉCANIQUE
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
