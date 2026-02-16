import { memo } from 'react'

const LoadingSkeleton = memo(function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background gradient-mesh flex items-center justify-center">
      <div className="w-full max-w-md p-8 text-center">
        {/* Logo pulse */}
        <div className="flex justify-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 animate-pulse-glow flex items-center justify-center">
            <span className="text-white font-extrabold text-xl">M</span>
          </div>
        </div>

        {/* Shimmer bars */}
        <div className="space-y-3">
          <div className="h-3 shimmer rounded-full w-3/4 mx-auto" />
          <div className="h-3 shimmer rounded-full w-1/2 mx-auto" />
        </div>

        {/* Spinner */}
        <div className="flex justify-center mt-8">
          <div
            className="h-8 w-8 rounded-full border-3 border-violet-500/20 border-t-violet-500"
            style={{
              animation: 'spin 0.7s linear infinite',
              willChange: 'transform',
              borderWidth: '3px',
            }}
          />
        </div>
      </div>
    </div>
  )
})

export const CardSkeleton = memo(function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-6 animate-pulse">
      <div className="h-4 bg-muted rounded-full w-1/3 mb-4" />
      <div className="h-8 bg-muted rounded-full w-1/2 mb-2" />
      <div className="h-3 bg-muted rounded-full w-2/3" />
    </div>
  )
})

export const ListSkeleton = memo(function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-card/50 animate-pulse">
          <div className="h-10 w-10 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded-full w-1/3" />
            <div className="h-3 bg-muted rounded-full w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
})

export const SidebarSkeleton = memo(function SidebarSkeleton() {
  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-card/50 border-r border-border/50 animate-pulse">
      <div className="p-4">
        <div className="h-8 w-32 bg-muted rounded-lg" />
      </div>
      <div className="flex-1 p-4 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 bg-muted rounded-xl" />
        ))}
      </div>
    </div>
  )
})

export default LoadingSkeleton
