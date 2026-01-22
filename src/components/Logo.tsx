import { Link } from 'react-router-dom'
import { useId } from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  linkTo?: string
  className?: string
  variant?: 'light' | 'dark'
}

export default function Logo({
  size = 'md',
  showText = true,
  linkTo,
  className = '',
  variant = 'light'
}: LogoProps) {
  const sizes = {
    sm: { height: 'h-6', iconSize: 20 },
    md: { height: 'h-8', iconSize: 24 },
    lg: { height: 'h-10', iconSize: 32 },
  }

  const s = sizes[size]

  // Gradient IDs uniques pour éviter les conflits (useId génère un ID stable)
  const uniqueId = useId()
  const gradientId = `mecai-grad-${uniqueId}`

  // Couleurs selon variant
  const textColor = variant === 'dark' ? 'white' : '#0f172a'
  const badgeColors = variant === 'dark'
    ? { start: '#fb923c', mid: '#fb7185', end: '#60a5fa' }
    : { start: '#f97316', mid: '#f43f5e', end: '#3b82f6' }

  const logoContent = (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Badge M avec gradient */}
      <svg
        width={s.iconSize}
        height={s.iconSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={badgeColors.start} />
            <stop offset="50%" stopColor={badgeColors.mid} />
            <stop offset="100%" stopColor={badgeColors.end} />
          </linearGradient>
        </defs>
        <rect width="24" height="24" rx="6" fill={`url(#${gradientId})`} />
        <text
          x="12"
          y="17"
          fontFamily="'SF Pro Display', 'Inter', -apple-system, system-ui, sans-serif"
          fontSize="14"
          fontWeight="900"
          textAnchor="middle"
          fill="white"
        >
          M
        </text>
      </svg>

      {/* Texte MECAI */}
      {showText && (
        <span
          className={`font-extrabold tracking-tight ${
            size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-2xl'
          }`}
          style={{ color: textColor, letterSpacing: '-0.02em' }}
        >
          MECAI
        </span>
      )}
    </div>
  )

  if (linkTo) {
    return <Link to={linkTo}>{logoContent}</Link>
  }

  return logoContent
}
