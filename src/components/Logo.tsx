import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

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

  // Unique ID pour éviter les conflits de gradient
  const gradientId = `logoGrad-${Math.random().toString(36).substr(2, 9)}`

  const logoContent = (
    <div className={`flex items-center gap-2 group ${className}`}>
      {/* Icône logo - Engrenage + Circuit IA */}
      <motion.div
        className={`${sizes[size].icon} relative`}
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#1E40AF" />
            </linearGradient>
          </defs>

          {/* Fond cercle */}
          <circle cx="24" cy="24" r="22" fill={`url(#${gradientId})`} />

          {/* Engrenage stylisé */}
          <g stroke="white" strokeWidth="2" fill="none">
            {/* Cercle central de l'engrenage */}
            <circle cx="20" cy="24" r="6" />
            <circle cx="20" cy="24" r="2.5" fill="white" />

            {/* Dents de l'engrenage */}
            <path d="M20 16v2M20 30v2M14 24h2M24 24h2" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M15 19l1.5 1.5M23.5 27.5l1.5 1.5M15 29l1.5-1.5M23.5 20.5l1.5-1.5" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* Noeud IA / Circuit neural */}
          <g>
            {/* Point central IA */}
            <circle cx="32" cy="20" r="4" fill="#F97316" />
            <circle cx="32" cy="20" r="2" fill="white" />

            {/* Connexions neurales */}
            <motion.g
              initial={{ opacity: 0.6 }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <path d="M28 20L24 24" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M32 24V30" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M36 20L38 18" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="32" cy="32" r="2" fill="#F97316" />
              <circle cx="38" cy="17" r="1.5" fill="#F97316" />
            </motion.g>
          </g>
        </svg>
      </motion.div>

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
