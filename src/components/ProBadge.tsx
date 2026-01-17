import { Briefcase } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function ProBadge() {
  return (
    <Badge className="bg-gradient-to-r from-amber-400 to-amber-600 text-white">
      <Briefcase className="h-3 w-3 mr-1" />
      Pro verifie
    </Badge>
  )
}
