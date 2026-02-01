#!/bin/bash

# Script pour appliquer la migration user_events
# Exécuter depuis le dossier racine du projet

echo "🚀 Application de la migration user_events..."

# Vérifier que les variables d'environnement sont définies
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo "❌ Erreur: SUPABASE_URL et SUPABASE_SERVICE_KEY doivent être définis"
  echo ""
  echo "Exemple:"
  echo "  export SUPABASE_URL=https://dgcryodwrwqdxgghrjpp.supabase.co"
  echo "  export SUPABASE_SERVICE_KEY=votre_service_key"
  exit 1
fi

# Appliquer la migration
echo "📝 Exécution du script SQL..."
cat supabase/migrations/20260201_user_events.sql | \
  psql "$SUPABASE_URL/postgres" -U postgres

if [ $? -eq 0 ]; then
  echo "✅ Migration appliquée avec succès !"
else
  echo ""
  echo "⚠️  Si psql n'est pas disponible, vous pouvez appliquer la migration manuellement:"
  echo ""
  echo "1. Allez sur https://supabase.com/dashboard/project/dgcryodwrwqdxgghrjpp/sql"
  echo "2. Copiez le contenu de supabase/migrations/20260201_user_events.sql"
  echo "3. Exécutez le script"
fi
