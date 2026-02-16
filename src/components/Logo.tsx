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

  const uniqueId = useId()
  const gradientId = `mecai-grad-${uniqueId}`

  const textColor = variant === 'dark' ? 'white' : undefined

  const logoContent = (
    <div className={`flex items-center gap-2 ${className}`}>
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
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#06B6D4" />
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

      {showText && (
        <span
          className={`font-extrabold tracking-tight text-foreground ${
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
