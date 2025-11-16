/**
 * Firebase Cloud Functions - Point d'entrée principal
 *
 * INSTALLATION:
 * 1. Copier ce dossier 'functions-example' vers 'functions'
 * 2. cd functions
 * 3. npm install
 * 4. firebase deploy --only functions
 *
 * COMMANDES UTILES:
 * - npm run serve : Tester localement avec l'émulateur
 * - npm run deploy : Déployer toutes les fonctions
 * - npm run logs : Voir les logs en temps réel
 */

// Importer toutes les fonctions de nettoyage
const {
  cleanupOldNotifications,
  manualCleanupNotifications,
  getNotificationStats,
} = require('./scheduledCleanup');

// Exporter les fonctions
exports.cleanupOldNotifications = cleanupOldNotifications;
exports.manualCleanupNotifications = manualCleanupNotifications;
exports.getNotificationStats = getNotificationStats;

// Vous pouvez ajouter d'autres fonctions ici
// exports.autreFonction = require('./autreFonction').fonction;
