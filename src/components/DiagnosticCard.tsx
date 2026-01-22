import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatRelativeTime, formatPrice } from '@/lib/utils'
import { ChevronRight, Download, Trash2 } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { downloadPDF } from '@/lib/pdfDownload'
import type { Diagnostic } from '@/types'

interface DiagnosticCardProps {
  diagnostic: Diagnostic
  onDelete?: (id: string) => Promise<void>
}

export default function DiagnosticCard({ diagnostic, onDelete }: DiagnosticCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const urgencyBadge = {
    high: { variant: 'danger' as const, label: 'Urgent', emoji: '🔴' },
    medium: { variant: 'warning' as const, label: 'Moyen', emoji: '🟡' },
    low: { variant: 'success' as const, label: 'Faible', emoji: '🟢' },
  }

  const carInfo = [diagnostic.car_brand, diagnostic.car_model, diagnostic.car_year]
    .filter(Boolean)
    .join(' ')

  const priceRange =
    diagnostic.estimated_cost_min && diagnostic.estimated_cost_max
      ? `${formatPrice(diagnostic.estimated_cost_min)} - ${formatPrice(diagnostic.estimated_cost_max)}`
      : null

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!onDelete) return

    if (window.confirm('Supprimer ce diagnostic ?')) {
      setIsDeleting(true)
      try {
        await onDelete(diagnostic.id)
      } catch (error) {
        console.error('Error deleting diagnostic:', error)
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
        alert(`Impossible de supprimer le diagnostic: ${errorMessage}\n\nAssurez-vous que la migration RLS a été appliquée dans Supabase.`)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const exportToPDF = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    console.log('[PDF] Starting PDF export for diagnostic:', diagnostic.id)
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 20
      let y = 20

      // Helper function to add text with word wrap and page breaks
      const addText = (text: string, size: number = 10, style: 'normal' | 'bold' = 'normal') => {
        if (!text) return
        doc.setFontSize(size)
        doc.setFont('helvetica', style)
        const lines = doc.splitTextToSize(String(text), pageWidth - margin * 2)

        const lineHeight = size * 0.5
        if (y + lines.length * lineHeight > pageHeight - 20) {
          doc.addPage()
          y = 20
        }

        doc.text(lines, margin, y)
        y += lines.length * lineHeight + 3
      }

      const addLine = () => {
        y += 2
        if (y > pageHeight - 30) {
          doc.addPage()
          y = 20
        }
        doc.setDrawColor(200)
        doc.line(margin, y, pageWidth - margin, y)
        y += 5
      }

      // Header
      doc.setFillColor(37, 99, 235)
      doc.rect(0, 0, pageWidth, 35, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('DIAGNOSTIC AUTOMOBILE', pageWidth / 2, 15, { align: 'center' })
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text('MECA-IA - Assistant Automobile', pageWidth / 2, 25, { align: 'center' })

      y = 45
      doc.setTextColor(0, 0, 0)

      // Date
      const dateStr = new Date(diagnostic.created_at).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
      addText(`Date du diagnostic: ${dateStr}`, 10)

      addLine()

      // Vehicle info
      if (carInfo) {
        addText('VEHICULE', 12, 'bold')
        addText(carInfo, 11)
        if (diagnostic.car_mileage) {
          addText(`Kilometrage: ${diagnostic.car_mileage.toLocaleString('fr-FR')} km`, 10)
        }
        y += 3
      }

      // Urgency
      if (diagnostic.urgency_level) {
        const urgencyLabel = diagnostic.urgency_level === 'high' ? 'URGENT' :
                            diagnostic.urgency_level === 'medium' ? 'MOYEN' : 'FAIBLE'

        if (diagnostic.urgency_level === 'high') doc.setTextColor(239, 68, 68)
        else if (diagnostic.urgency_level === 'medium') doc.setTextColor(202, 138, 4)
        else doc.setTextColor(22, 163, 74)

        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text(`NIVEAU D'URGENCE: ${urgencyLabel}`, pageWidth / 2, y, { align: 'center' })
        y += 10

        doc.setTextColor(0, 0, 0)
      }

      addLine()

      // Problem description
      addText('PROBLEME DECRIT', 12, 'bold')
      addText(diagnostic.problem_description || 'Non specifie', 10)
      y += 3

      // Diagnosis summary
      if (diagnostic.diagnosis_summary) {
        addLine()
        addText('DIAGNOSTIC', 12, 'bold')
        addText(diagnostic.diagnosis_summary, 10)
        y += 3
      }

      // Cost estimation
      if (priceRange) {
        addLine()
        if (y + 30 > pageHeight - 20) {
          doc.addPage()
          y = 20
        }
        doc.setFillColor(59, 130, 246)
        doc.roundedRect(margin, y, pageWidth - margin * 2, 20, 3, 3, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text(`Estimation: ${priceRange}`, pageWidth / 2, y + 12, { align: 'center' })
        y += 28
        doc.setTextColor(0, 0, 0)
      }

      // Conversation summary (if available)
      if (diagnostic.conversation && diagnostic.conversation.length > 0) {
        addLine()
        addText('RESUME DE LA CONVERSATION', 12, 'bold')

        // Get last few assistant messages for the summary
        const assistantMessages = diagnostic.conversation
          .filter((msg: { role: string }) => msg.role === 'assistant')
          .slice(-3)

        for (const msg of assistantMessages) {
          if (msg.content) {
            // Clean the message
            let cleanContent = String(msg.content)
              .replace(/[^\x00-\x7F\u00C0-\u00FF\u0100-\u017F]/g, '') // Remove emojis
              .substring(0, 500) // Limit length

            if (cleanContent.length > 0) {
              doc.setTextColor(60, 60, 60)
              addText(cleanContent, 9)
              doc.setTextColor(0, 0, 0)
              y += 2
            }
          }
        }
      }

      // Footer on last page
      doc.setTextColor(128, 128, 128)
      doc.setFontSize(8)
      doc.text('Rapport genere par MECA-IA - mymecai.com', pageWidth / 2, pageHeight - 10, { align: 'center' })

      // Generate filename with safe characters
      const dateForFile = new Date().toISOString().split('T')[0]
      const vehicleName = carInfo ? carInfo.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 20) : 'vehicule'
      const filename = `diagnostic-${vehicleName}-${dateForFile}.pdf`

      console.log('[PDF] Saving diagnostic PDF:', filename)

      // Use the shared download utility for proper mobile support
      await downloadPDF(doc, filename)

      console.log('[PDF] Diagnostic PDF saved successfully')
    } catch (err) {
      console.error('[PDF] Error generating diagnostic PDF:', err)
      alert(`Erreur lors de la generation du PDF: ${err instanceof Error ? err.message : 'Erreur inconnue'}`)
    }
  }

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <Link to={`/app/chat/${diagnostic.id}`} className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium truncate">
                {carInfo || 'Vehicule non specifie'}
              </h3>
              {diagnostic.urgency_level && (
                <Badge variant={urgencyBadge[diagnostic.urgency_level].variant}>
                  {urgencyBadge[diagnostic.urgency_level].emoji}{' '}
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
          </Link>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={exportToPDF}
              className="h-8 w-8 p-0"
              title="Exporter en PDF"
            >
              <Download className="h-4 w-4" />
            </Button>
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Link to={`/app/chat/${diagnostic.id}`}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
