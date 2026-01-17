import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
}

export function LoadingSpinner({ size = 'md', text, className }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-8', className)}>
      <Loader2 className={cn(sizeClasses[size], 'animate-spin text-blue-600')} />
      {text && <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">{text}</p>}
    </div>
  )
}

export function FullPageLoader({ message = 'Chargement de MecaIA...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-900">
      <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      <p className="text-muted-foreground font-medium">{message}</p>
    </div>
  )
}

export function ButtonLoader() {
  return <Loader2 className="h-4 w-4 animate-spin mr-2" />
}
