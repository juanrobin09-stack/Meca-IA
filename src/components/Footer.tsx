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
            <a href="mailto:contact@mecaia.fr" className="hover:text-foreground transition-colors">
              Contact
            </a>
          </div>

          <p className="text-sm text-muted-foreground">
            © {currentYear} MecaIA - Juan Robin - SIREN 994 221 653
          </p>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          MecaIA fournit des diagnostics à titre informatif uniquement et ne remplace pas l'avis d'un professionnel.
        </p>
      </div>
    </footer>
  )
}
