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
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Icône logo */}
      <div className={`${sizes[size].icon} relative`}>
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Fond bleu arrondi */}
          <rect x="2" y="2" width="44" height="44" rx="10" fill="#3B82F6" />

          {/* Engrenage simple */}
          <g fill="white">
            <circle cx="22" cy="26" r="7" />
            <circle cx="22" cy="26" r="3" fill="#3B82F6" />
            {/* Dents */}
            <rect x="19" y="13" width="6" height="6" rx="1" />
            <rect x="19" y="33" width="6" height="6" rx="1" />
            <rect x="9" y="23" width="6" height="6" rx="1" />
            <rect x="29" y="23" width="6" height="6" rx="1" />
          </g>

          {/* Badge IA orange */}
          <circle cx="36" cy="12" r="6" fill="#F97316" />
          <text x="36" y="15.5" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold" fontFamily="Arial, sans-serif">IA</text>
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
