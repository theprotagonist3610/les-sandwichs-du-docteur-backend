/**
 * Firebase Cloud Function - Nettoyage automatique des notifications
 *
 * Cette fonction s'exécute automatiquement tous les jours à 3h du matin
 * pour supprimer les notifications de plus de 48 heures.
 *
 * INSTALLATION:
 * 1. npm install -g firebase-tools
 * 2. firebase init functions
 * 3. Copier ce fichier dans functions/src/
 * 4. firebase deploy --only functions:cleanupOldNotifications
 *
 * CONFIGURATION:
 * - Schedule: Tous les jours à 3h (Europe/Paris)
 * - Rétention: 48 heures
 * - Nœuds RTDB: notification, notifications
 *
 * COÛT ESTIMÉ:
 * - ~0.40$ par mois (Gratuit sous le quota Firebase)
 * - 1 exécution/jour * 30 jours = 30 exécutions/mois
 * - Durée moyenne: ~2 secondes
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialiser Firebase Admin (une seule fois)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.database();

// ============================================================================
// CONFIGURATION
// ============================================================================

const RTDB_NOTIFICATIONS_PATHS = ['notification', 'notifications'];
const RETENTION_PERIOD_MS = 48 * 60 * 60 * 1000; // 48 heures

// ============================================================================
// FONCTION CLOUD SCHEDULÉE
// ============================================================================

/**
 * Fonction Cloud exécutée tous les jours à 3h du matin (Europe/Paris)
 * Supprime les notifications de plus de 48H dans les nœuds RTDB
 */
exports.cleanupOldNotifications = functions
  .region('europe-west1') // Région proche de la France
  .runWith({
    timeoutSeconds: 120, // Timeout de 2 minutes (largement suffisant)
    memory: '256MB', // Mémoire allouée
  })
  .pubsub.schedule('0 3 * * *') // Cron: tous les jours à 3h
  .timeZone('Europe/Paris')
  .onRun(async (context) => {
    const startTime = Date.now();
    console.log('🧹 ========================================');
    console.log('🧹 Démarrage du nettoyage des notifications');
    console.log('🧹 ========================================');

    const now = Date.now();
    const cutoffTimestamp = now - RETENTION_PERIOD_MS;
    const cutoffDate = new Date(cutoffTimestamp);

    console.log(`📅 Date actuelle: ${new Date(now).toISOString()}`);
    console.log(`📅 Suppression des notifications avant: ${cutoffDate.toISOString()}`);
    console.log(`📅 Timestamp limite: ${cutoffTimestamp}`);

    const stats = {
      totalDeleted: 0,
      deletedByNode: {},
      errors: [],
    };

    // Nettoyer chaque nœud RTDB
    for (const nodePath of RTDB_NOTIFICATIONS_PATHS) {
      try {
        console.log(`\n🔍 Analyse du nœud: ${nodePath}`);

        const nodeRef = db.ref(nodePath);

        // Récupérer les notifications avec timestamp <= cutoffTimestamp
        const snapshot = await nodeRef
          .orderByChild('timestamp')
          .endAt(cutoffTimestamp)
          .once('value');

        if (!snapshot.exists()) {
          console.log(`✨ ${nodePath}: Aucune notification à supprimer`);
          stats.deletedByNode[nodePath] = 0;
          continue;
        }

        const notificationsToDelete = snapshot.val();
        const keysToDelete = Object.keys(notificationsToDelete);
        const count = keysToDelete.length;

        console.log(`🗑️  ${nodePath}: ${count} notification(s) trouvée(s) à supprimer`);

        // Afficher quelques exemples (max 5)
        const samples = keysToDelete.slice(0, 5);
        samples.forEach((key) => {
          const notif = notificationsToDelete[key];
          const notifDate = new Date(notif.timestamp);
          console.log(`   📄 ${key}:`);
          console.log(`      - Titre: ${notif.title || 'N/A'}`);
          console.log(`      - Date: ${notifDate.toISOString()}`);
          console.log(`      - Âge: ${Math.floor((now - notif.timestamp) / (1000 * 60 * 60))}h`);
        });

        if (count > 5) {
          console.log(`   ... et ${count - 5} autres`);
        }

        // Supprimer en batch (plus performant)
        const updates = {};
        keysToDelete.forEach((key) => {
          updates[`${nodePath}/${key}`] = null;
        });

        console.log(`🔥 Suppression en cours...`);
        await db.ref().update(updates);

        stats.deletedByNode[nodePath] = count;
        stats.totalDeleted += count;

        console.log(`✅ ${nodePath}: ${count} notification(s) supprimée(s) avec succès`);
      } catch (error) {
        console.error(`❌ Erreur lors du nettoyage de ${nodePath}:`, error);
        stats.errors.push({
          node: nodePath,
          error: error.message,
          stack: error.stack,
        });
        stats.deletedByNode[nodePath] = 0;
      }
    }

    // Résumé final
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n📊 ========================================');
    console.log('📊 RÉSUMÉ DU NETTOYAGE');
    console.log('📊 ========================================');
    console.log(`✅ Total supprimé: ${stats.totalDeleted} notification(s)`);
    console.log(`⏱️  Durée: ${duration}s`);
    console.log('📈 Détails par nœud:');
    Object.entries(stats.deletedByNode).forEach(([node, count]) => {
      console.log(`   - ${node}: ${count} notification(s)`);
    });

    if (stats.errors.length > 0) {
      console.log(`⚠️  Erreurs: ${stats.errors.length}`);
      stats.errors.forEach((err, i) => {
        console.log(`   ${i + 1}. ${err.node}: ${err.error}`);
      });
    }

    console.log('🧹 ========================================');
    console.log('🧹 Nettoyage terminé');
    console.log('🧹 ========================================\n');

    // Retourner les statistiques (disponibles dans les logs)
    return {
      success: true,
      totalDeleted: stats.totalDeleted,
      deletedByNode: stats.deletedByNode,
      errors: stats.errors,
      duration: parseFloat(duration),
      timestamp: now,
    };
  });

// ============================================================================
// FONCTION HTTP (OPTIONNELLE) - Pour déclenchement manuel
// ============================================================================

/**
 * Fonction HTTP pour déclencher manuellement le nettoyage
 * URL: https://europe-west1-<project-id>.cloudfunctions.net/manualCleanupNotifications
 *
 * Sécurité: Ajouter une authentification en production !
 */
exports.manualCleanupNotifications = functions
  .region('europe-west1')
  .runWith({
    timeoutSeconds: 120,
    memory: '256MB',
  })
  .https.onRequest(async (req, res) => {
    // IMPORTANT: Ajouter une authentification en production !
    // Exemple: Vérifier un token dans req.headers.authorization

    console.log('🔧 Nettoyage manuel déclenché via HTTP');

    try {
      // Réutiliser la logique de nettoyage
      const result = await exports.cleanupOldNotifications.run({});

      res.status(200).json({
        success: true,
        message: 'Nettoyage effectué avec succès',
        result,
      });
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage manuel:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

// ============================================================================
// FONCTION DE STATISTIQUES (OPTIONNELLE)
// ============================================================================

/**
 * Fonction pour obtenir des statistiques sur les notifications
 * Utile pour monitoring
 */
exports.getNotificationStats = functions
  .region('europe-west1')
  .https.onRequest(async (req, res) => {
    try {
      const stats = {
        timestamp: Date.now(),
        nodes: {},
      };

      const now = Date.now();
      const cutoffTimestamp = now - RETENTION_PERIOD_MS;

      for (const nodePath of RTDB_NOTIFICATIONS_PATHS) {
        const nodeRef = db.ref(nodePath);

        // Total
        const totalSnapshot = await nodeRef.once('value');
        const total = totalSnapshot.exists() ? Object.keys(totalSnapshot.val()).length : 0;

        // Anciennes (à supprimer)
        const oldSnapshot = await nodeRef
          .orderByChild('timestamp')
          .endAt(cutoffTimestamp)
          .once('value');
        const old = oldSnapshot.exists() ? Object.keys(oldSnapshot.val()).length : 0;

        // Récentes (à garder)
        const recent = total - old;

        stats.nodes[nodePath] = {
          total,
          recent,
          old,
          percentageOld: total > 0 ? ((old / total) * 100).toFixed(1) : 0,
        };
      }

      res.status(200).json(stats);
    } catch (error) {
      console.error('❌ Erreur lors du calcul des statistiques:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

// ============================================================================
// EXPORTS
// ============================================================================

// Note: Les exports sont déjà faits inline ci-dessus avec exports.functionName
