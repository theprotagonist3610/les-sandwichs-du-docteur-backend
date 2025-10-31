#!/bin/bash

# Script de déploiement des règles de sécurité Firebase
# Usage: ./deploy-rules.sh [--dry-run]

set -e

echo "🔐 Déploiement des règles de sécurité Firebase"
echo "==============================================="
echo ""

DRY_RUN=""
if [ "$1" = "--dry-run" ]; then
  DRY_RUN="--dry-run"
  echo "🧪 MODE TEST (dry-run) - Aucun déploiement réel"
  echo ""
fi

# Vérifier que Firebase CLI est installé
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI n'est pas installé"
    echo "   Installez-le avec: npm install -g firebase-tools"
    exit 1
fi

# Vérifier l'authentification
echo "🔑 Vérification de l'authentification Firebase..."
if ! firebase projects:list &> /dev/null; then
    echo "❌ Vous n'êtes pas authentifié"
    echo "   Connectez-vous avec: firebase login"
    exit 1
fi

# Vérifier que les fichiers de règles existent
if [ ! -f "firestore.rules" ]; then
    echo "❌ Fichier firestore.rules introuvable"
    exit 1
fi

if [ ! -f "database.rules.json" ]; then
    echo "❌ Fichier database.rules.json introuvable"
    exit 1
fi

echo "✅ Authentification OK"
echo ""

# Déployer les règles Firestore
echo "📦 Déploiement des règles Firestore..."
firebase deploy --only firestore:rules $DRY_RUN

echo ""

# Déployer les règles RTDB
echo "📦 Déploiement des règles Realtime Database..."
firebase deploy --only database $DRY_RUN

echo ""
echo "✅ Déploiement terminé avec succès !"
echo ""

if [ -n "$DRY_RUN" ]; then
    echo "💡 Pour déployer en production, exécutez:"
    echo "   ./deploy-rules.sh"
else
    echo "🎉 Les règles de sécurité sont maintenant actives"
    echo ""
    echo "📊 Vérifiez dans la console Firebase:"
    echo "   - Firestore Database → Règles"
    echo "   - Realtime Database → Règles"
fi

echo ""
