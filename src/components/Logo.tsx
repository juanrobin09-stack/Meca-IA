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

  const logoContent = (
    <div className={`flex items-center gap-2 group ${className}`}>
      {/* Icône logo */}
      <motion.div
        className={`${sizes[size].icon} relative`}
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
          </defs>
          <circle cx="24" cy="24" r="22" fill="url(#logoGrad)" />
          <path
            d="M16 28L26 18M26 18L28 20M26 18L24 16"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="31" cy="17" r="5" stroke="white" strokeWidth="2.5" fill="none" />
          <motion.path
            d="M18 22L14 28H20L18 34L26 26H20L22 22H18Z"
            fill="#fbbf24"
            stroke="#fbbf24"
            strokeWidth="0.5"
            strokeLinejoin="round"
            initial={{ opacity: 1 }}
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </svg>
      </motion.div>

      {/* Texte logo */}
      {showText && (
        <span className={`${sizes[size].text} font-bold`}>
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
