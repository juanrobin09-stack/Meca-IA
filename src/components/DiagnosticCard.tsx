import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime, formatPrice } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'
import type { Diagnostic } from '@/types'

interface DiagnosticCardProps {
  diagnostic: Diagnostic
}

export default function DiagnosticCard({ diagnostic }: DiagnosticCardProps) {
  const urgencyBadge = {
    high: { variant: 'danger' as const, label: 'Urgent' },
    medium: { variant: 'warning' as const, label: 'Moyen' },
    low: { variant: 'success' as const, label: 'Faible' },
  }

  const carInfo = [diagnostic.car_brand, diagnostic.car_model, diagnostic.car_year]
    .filter(Boolean)
    .join(' ')

  const priceRange =
    diagnostic.estimated_cost_min && diagnostic.estimated_cost_max
      ? `${formatPrice(diagnostic.estimated_cost_min)} - ${formatPrice(diagnostic.estimated_cost_max)}`
      : null

  return (
    <Link to={`/app/chat/${diagnostic.id}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium truncate">
                  {carInfo || 'Véhicule non spécifié'}
                </h3>
                {diagnostic.urgency_level && (
                  <Badge variant={urgencyBadge[diagnostic.urgency_level].variant}>
                    {diagnostic.urgency_level === 'high' && '🔴 '}
                    {diagnostic.urgency_level === 'medium' && '🟡 '}
                    {diagnostic.urgency_level === 'low' && '🟢 '}
                    {urgencyBadge[diagnostic.urgency_level].label}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {diagnostic.problem_description}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{formatRelativeTime(diagnostic.created_at)}</span>
                {priceRange && (
                  <span className="flex items-center gap-1">
                    💰 {priceRange}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
