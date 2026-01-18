import { AlertTriangle, Info } from 'lucide-react'

interface DisclaimerBoxProps {
  children: React.ReactNode
  variant?: 'warning' | 'info'
  className?: string
}

export default function DisclaimerBox({
  children,
  variant = 'warning',
  className = ''
}: DisclaimerBoxProps) {
  const isWarning = variant === 'warning'

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg text-sm
        ${isWarning
          ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
          : 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
        }
        ${className}
      `}
    >
      {isWarning ? (
        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
      ) : (
        <Info className="h-5 w-5 shrink-0 mt-0.5" />
      )}
      <div>{children}</div>
    </div>
  )
}
