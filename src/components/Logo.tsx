import { Link } from 'react-router-dom'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  linkTo?: string
  className?: string
}

export default function Logo({ size = 'md', showText = true, linkTo, className = '' }: LogoProps) {
  const sizes = {
    sm: { img: 'h-8', text: 'text-lg' },
    md: { img: 'h-10', text: 'text-xl' },
    lg: { img: 'h-14', text: 'text-2xl' },
  }

  const logoContent = (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Logo image */}
      <img
        src="/logo.png"
        alt="MecaIA"
        className={`${sizes[size].img} w-auto object-contain`}
      />

      {/* Texte optionnel */}
      {showText && (
        <span className={`${sizes[size].text} font-bold tracking-tight`}>
          <span className="text-gray-900 dark:text-white">Meca</span>
          <span className="text-emerald-500">IA</span>
        </span>
      )}
    </div>
  )

  if (linkTo) {
    return <Link to={linkTo}>{logoContent}</Link>
  }

  return logoContent
}
