# Script de déploiement des règles de sécurité Firebase
# Usage: .\deploy-rules.ps1 [-DryRun]

param(
    [switch]$DryRun
)

Write-Host "🔐 Déploiement des règles de sécurité Firebase" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

$DryRunFlag = ""
if ($DryRun) {
    $DryRunFlag = "--dry-run"
    Write-Host "🧪 MODE TEST (dry-run) - Aucun déploiement réel" -ForegroundColor Yellow
    Write-Host ""
}

# Vérifier que Firebase CLI est installé
try {
    $null = firebase --version
} catch {
    Write-Host "❌ Firebase CLI n'est pas installé" -ForegroundColor Red
    Write-Host "   Installez-le avec: npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}

# Vérifier l'authentification
Write-Host "🔑 Vérification de l'authentification Firebase..." -ForegroundColor Cyan
try {
    $null = firebase projects:list 2>&1
    Write-Host "✅ Authentification OK" -ForegroundColor Green
} catch {
    Write-Host "❌ Vous n'êtes pas authentifié" -ForegroundColor Red
    Write-Host "   Connectez-vous avec: firebase login" -ForegroundColor Yellow
    exit 1
}

# Vérifier que les fichiers de règles existent
if (-not (Test-Path "firestore.rules")) {
    Write-Host "❌ Fichier firestore.rules introuvable" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "database.rules.json")) {
    Write-Host "❌ Fichier database.rules.json introuvable" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Déployer les règles Firestore
Write-Host "📦 Déploiement des règles Firestore..." -ForegroundColor Cyan
if ($DryRun) {
    firebase deploy --only firestore:rules --dry-run
} else {
    firebase deploy --only firestore:rules
}

Write-Host ""

# Déployer les règles RTDB
Write-Host "📦 Déploiement des règles Realtime Database..." -ForegroundColor Cyan
if ($DryRun) {
    firebase deploy --only database --dry-run
} else {
    firebase deploy --only database
}

Write-Host ""
Write-Host "✅ Déploiement terminé avec succès !" -ForegroundColor Green
Write-Host ""

if ($DryRun) {
    Write-Host "💡 Pour déployer en production, exécutez:" -ForegroundColor Yellow
    Write-Host "   .\deploy-rules.ps1" -ForegroundColor Yellow
} else {
    Write-Host "🎉 Les règles de sécurité sont maintenant actives" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Vérifiez dans la console Firebase:" -ForegroundColor Cyan
    Write-Host "   - Firestore Database → Règles" -ForegroundColor White
    Write-Host "   - Realtime Database → Règles" -ForegroundColor White
}

Write-Host ""
