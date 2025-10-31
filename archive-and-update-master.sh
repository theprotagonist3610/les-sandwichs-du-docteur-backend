#!/bin/bash

# ============================================================================
# Script d'archivage et mise à jour de la branche master
# ============================================================================
# Ce script:
# 1. Archive l'ancienne branche master vers master-ancien
# 2. Commit tous les changements actuels
# 3. Met à jour la branche master avec le nouveau code
# ============================================================================

set -e  # Arrêter en cas d'erreur

echo "🚀 Début du processus d'archivage et mise à jour de master..."
echo ""

# Vérifier qu'on est bien sur la branche master
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "📍 Branche actuelle: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "master" ]; then
    echo "❌ Erreur: Vous devez être sur la branche master"
    echo "   Utilisez: git checkout master"
    exit 1
fi

# Vérifier s'il y a des modifications non commitées
if [ -n "$(git status --porcelain)" ]; then
    echo ""
    echo "📝 Modifications détectées. Création d'un commit..."

    # Ajouter tous les fichiers (sauf ceux dans .gitignore)
    git add .

    # Créer le commit
    git commit -m "$(cat <<'EOF'
Mise à jour complète du système

✅ Système de queue anti-collision implémenté:
- commandeToolkit avec queue (CREATE, UPDATE, DELETE, DELETE_BATCH)
- Prévention des collisions Firestore avec runTransaction
- Variable globale isExecutingCommandes
- Nettoyage automatique au changement de jour

✅ Règles Firebase mises à jour:
- firestore.rules: Ajout ventes/, comptabilite/ avec queues
- database.rules.json: Ajout notifications/commandes pour RTDB
- Correction chemins stock/transactions/liste/{DDMMYYYY}

✅ Intégration comptable automatique:
- Opérations comptables créées automatiquement avec ventes
- Codes OHADA (701 produits finis, 411 clients)
- Traitement différé après transactions Firestore

✅ Hooks React:
- useCommandes() avec filtres et sync RTDB
- useCommandeStatistiques()
- useCommandeQueue() pour surveiller la queue

✅ .gitignore corrigé:
- Exclusion des fichiers .env*
- Exclusion des fichiers Firebase (.firebase/, firebase-debug.log)
- Exclusion coverage/

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

    echo "✅ Commit créé avec succès"
else
    echo "ℹ️  Aucune modification à commiter"
fi

echo ""
echo "🔄 Archivage de l'ancienne branche master..."

# Vérifier si la branche master-ancien existe déjà
if git show-ref --verify --quiet refs/heads/master-ancien; then
    echo "⚠️  La branche master-ancien existe déjà"
    read -p "   Voulez-vous la supprimer et créer une nouvelle archive? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git branch -D master-ancien
        echo "🗑️  Branche master-ancien supprimée"
    else
        echo "❌ Opération annulée"
        exit 1
    fi
fi

# Créer la branche d'archive à partir du commit actuel de master
git branch master-ancien
echo "✅ Branche master-ancien créée"

echo ""
echo "📊 État final:"
echo "   - Branche actuelle: master"
echo "   - Archive créée: master-ancien"
echo "   - Commit actuel: $(git rev-parse --short HEAD)"

echo ""
echo "🎉 Processus terminé avec succès!"
echo ""
echo "📝 Prochaines étapes recommandées:"
echo "   1. Vérifier les changements: git log --oneline -5"
echo "   2. Pousser vers remote: git push origin master"
echo "   3. Pousser l'archive: git push origin master-ancien"
echo ""
