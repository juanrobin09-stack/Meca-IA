import { memo } from 'react'

// Skeleton de chargement optimisé avec GPU acceleration
const LoadingSkeleton = memo(function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-md p-8">
        {/* Logo skeleton */}
        <div className="flex justify-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary/20 animate-pulse" />
        </div>

        {/* Content skeleton */}
        <div className="space-y-4">
          <div className="h-4 bg-muted rounded-lg animate-pulse w-3/4 mx-auto" />
          <div className="h-4 bg-muted rounded-lg animate-pulse w-1/2 mx-auto" />
        </div>

        {/* Spinner */}
        <div className="flex justify-center mt-8">
          <div
            className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary"
            style={{
              animation: 'spin 0.8s linear infinite',
              willChange: 'transform',
            }}
          />
        </div>
      </div>
    </div>
  )
})

// Skeleton pour les cartes
export const CardSkeleton = memo(function CardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 animate-pulse">
      <div className="h-4 bg-muted rounded w-1/3 mb-4" />
      <div className="h-8 bg-muted rounded w-1/2 mb-2" />
      <div className="h-3 bg-muted rounded w-2/3" />
    </div>
  )
})

// Skeleton pour les listes
export const ListSkeleton = memo(function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-card animate-pulse">
          <div className="h-10 w-10 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
})

// Skeleton pour le sidebar
export const SidebarSkeleton = memo(function SidebarSkeleton() {
  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-card border-r animate-pulse">
      <div className="p-4">
        <div className="h-8 w-32 bg-muted rounded" />
      </div>
      <div className="flex-1 p-4 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 bg-muted rounded-lg" />
        ))}
      </div>
    </div>
  )
})

export default LoadingSkeleton
