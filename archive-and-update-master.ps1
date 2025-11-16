# ============================================================================
# Script d'archivage et mise à jour de la branche master (PowerShell)
# ============================================================================
# Ce script:
# 1. Archive l'ancienne branche master vers master-ancien
# 2. Commit tous les changements actuels
# 3. Met à jour la branche master avec le nouveau code
# ============================================================================

$ErrorActionPreference = "Stop"

Write-Host "🚀 Début du processus d'archivage et mise à jour de master..." -ForegroundColor Cyan
Write-Host ""

# Vérifier qu'on est bien sur la branche master
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "📍 Branche actuelle: $currentBranch" -ForegroundColor Yellow

if ($currentBranch -ne "master") {
    Write-Host "❌ Erreur: Vous devez être sur la branche master" -ForegroundColor Red
    Write-Host "   Utilisez: git checkout master" -ForegroundColor Red
    exit 1
}

# Vérifier s'il y a des modifications non commitées
$status = git status --porcelain
if ($status) {
    Write-Host ""
    Write-Host "📝 Modifications détectées. Création d'un commit..." -ForegroundColor Yellow

    # Ajouter tous les fichiers (sauf ceux dans .gitignore)
    git add .

    # Créer le commit
    $commitMessage = @"
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
"@

    git commit -m $commitMessage

    Write-Host "✅ Commit créé avec succès" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Aucune modification à commiter" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🔄 Archivage de l'ancienne branche master..." -ForegroundColor Yellow

# Vérifier si la branche master-ancien existe déjà
$branchExists = git show-ref --verify --quiet refs/heads/master-ancien 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "⚠️  La branche master-ancien existe déjà" -ForegroundColor Yellow
    $response = Read-Host "   Voulez-vous la supprimer et créer une nouvelle archive? (y/N)"

    if ($response -match "^[Yy]$") {
        git branch -D master-ancien
        Write-Host "🗑️  Branche master-ancien supprimée" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Opération annulée" -ForegroundColor Red
        exit 1
    }
}

# Créer la branche d'archive à partir du commit actuel de master
git branch master-ancien
Write-Host "✅ Branche master-ancien créée" -ForegroundColor Green

Write-Host ""
Write-Host "📊 État final:" -ForegroundColor Cyan
$shortHash = git rev-parse --short HEAD
Write-Host "   - Branche actuelle: master"
Write-Host "   - Archive créée: master-ancien"
Write-Host "   - Commit actuel: $shortHash"

Write-Host ""
Write-Host "🎉 Processus terminé avec succès!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Prochaines étapes recommandées:" -ForegroundColor Cyan
Write-Host "   1. Vérifier les changements: git log --oneline -5"
Write-Host "   2. Pousser vers remote: git push origin master"
Write-Host "   3. Pousser l'archive: git push origin master-ancien"
Write-Host ""
