import { Link } from 'react-router-dom'
import Logo from '@/components/Logo'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t py-8 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <Logo size="sm" />

          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <Link to="/mentions-legales" className="hover:text-foreground transition-colors">
              Mentions légales
            </Link>
            <Link to="/cgu" className="hover:text-foreground transition-colors">
              CGU
            </Link>
            <Link to="/confidentialite" className="hover:text-foreground transition-colors">
              Confidentialité
            </Link>
            <Link to="/pricing" className="hover:text-foreground transition-colors">
              Tarifs
            </Link>
            <a href="mailto:contact@mymecai.com" className="hover:text-foreground transition-colors">
              contact@mymecai.com
            </a>
          </div>

          <p className="text-sm text-muted-foreground">
            © {currentYear} MECAI - J.R - SIREN 994 221 653
          </p>
        </div>

        <div className="text-xs text-muted-foreground text-center mt-6 space-y-2">
          <p>
            MECAI - Votre copilote mécanique 🚗
          </p>
          <p className="max-w-3xl mx-auto">
            ⚠️ Les Diagnostics Pro sont fournis à titre indicatif.
            Pour toute intervention mécanique, consultez un professionnel certifié.
            MECAI ne saurait être tenu responsable des décisions prises suite à l'utilisation du service.
          </p>
        </div>
      </div>
    </footer>
  )
}
