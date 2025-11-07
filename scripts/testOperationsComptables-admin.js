/**
 * testOperationsComptables-admin.js
 * Script de génération d'opérations comptables de test - VERSION ADMIN SDK
 * Période : 1 Juillet 2025 - 7 Novembre 2025
 *
 * ⭐ Cette version utilise Firebase Admin SDK qui :
 * - Bypass automatiquement App Check
 * - Est conçue pour les environnements serveur
 * - Nécessite une clé de service (service account)
 */

import admin from "firebase-admin";
import { nanoid } from "nanoid";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Pour __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// CONFIGURATION FIREBASE ADMIN SDK
// ============================================================================

console.log("🔧 Initialisation Firebase Admin SDK...\n");

// Vérifier que la clé de service existe
const serviceAccountPath = join(__dirname, "..", "firebase-service-account-key.json");

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
  console.log("✅ Clé de service chargée");
} catch (error) {
  console.error("❌ Erreur: Impossible de charger la clé de service");
  console.error("\n💡 Étapes pour obtenir la clé:");
  console.error("   1. Allez sur Firebase Console");
  console.error("   2. Paramètres du projet ⚙️");
  console.error("   3. Onglet 'Comptes de service'");
  console.error("   4. Cliquez sur 'Générer une nouvelle clé privée'");
  console.error("   5. Téléchargez le fichier JSON");
  console.error("   6. Renommez-le 'firebase-service-account-key.json'");
  console.error("   7. Placez-le à la racine du projet");
  console.error("\n⚠️  Important: Ce fichier est déjà dans .gitignore");
  process.exit(1);
}

// Vérifier l'URL de la database
const databaseURL = process.env.VITE_DATABASE_URL;
if (!databaseURL) {
  console.error("❌ Variable VITE_DATABASE_URL manquante dans .env");
  console.error("   Format attendu: https://votre-projet-default-rtdb.firebaseio.com");
  process.exit(1);
}

// Initialiser Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: databaseURL,
});

const db = admin.firestore();
const rtdb = admin.database();

console.log(`✅ Firebase Admin initialisé`);
console.log(`   - Project ID: ${serviceAccount.project_id}`);
console.log(`   - Database URL: ${databaseURL}`);
console.log(`   - Client Email: ${serviceAccount.client_email}`);
console.log(`   - 🔓 App Check: Bypass automatique (Admin SDK)\n`);

// ============================================================================
// CONSTANTES
// ============================================================================

const DATE_DEBUT = new Date("2025-07-01");
const DATE_FIN = new Date("2025-11-07");

// Mapping des comptes
const COMPTES_IDS = {
  // Produits (Entrées)
  VENTES_PRODUITS: "701",
  VENTES_MARCHANDISES: "707",
  CAPITAL: "101",
  CLIENTS: "411",
  TVA_COLLECTEE: "4457",
  AUTRES_PRODUITS: "758",

  // Charges (Sorties)
  ACHATS_MATIERES: "601",
  FOURNITURES: "602",
  TRANSPORT: "611",
  LOYER: "613",
  ENTRETIEN: "615",
  PUBLICITE: "623",
  TELEPHONE: "626",
  HONORAIRES: "627",
  IMPOTS: "635",
  REMUNERATIONS: "641",
  CHARGES_DIVERSES: "658",
  FOURNISSEURS: "401",
  TVA_DEDUCTIBLE: "4456",

  // Trésorerie
  BANQUE: "511",
  MOBILE_MONEY: "5121",
  CAISSE: "531",
};

// Prix moyens des produits (en FCFA)
const PRIX = {
  SANDWICH: 1500,
  YAOURT: 500,
  BOISSON: 500,
  BISCUIT: 250,
  MENU: 2500,
};

// Motifs d'opérations
const MOTIFS = {
  VENTES: [
    "Vente sandwich poulet",
    "Vente sandwich thon",
    "Vente sandwich végétarien",
    "Vente yaourt nature",
    "Vente yaourt fruits",
    "Vente menu sandwich + boisson",
    "Vente boisson gazeuse",
    "Vente eau minérale",
    "Vente jus de fruits",
    "Vente café",
  ],
  ACHATS_MATIERES: [
    "Achat pain frais",
    "Achat poulet",
    "Achat thon",
    "Achat légumes frais",
    "Achat œufs",
    "Achat lait",
    "Achat fruits pour yaourt",
    "Achat fromage",
    "Achat sauces et condiments",
  ],
  FOURNITURES: [
    "Achat emballages sandwich",
    "Achat gobelets",
    "Achat serviettes",
    "Achat sachets plastiques",
    "Achat pailles",
  ],
  TRANSPORT: [
    "Frais livraison client entreprise",
    "Transport approvisionnement marché",
    "Frais déplacement fournisseur",
  ],
};

// ============================================================================
// UTILITAIRES
// ============================================================================

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function formatDayKey(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  return `${day}${month}${year}`;
}

function addRandomTime(date) {
  const hours = random(8, 20);
  const minutes = random(0, 59);
  const seconds = random(0, 59);
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, seconds, 0);
  return newDate.getTime();
}

// ============================================================================
// RÉCUPÉRATION DES COMPTES (ADMIN SDK)
// ============================================================================

async function getAllComptes() {
  try {
    // Admin SDK syntax
    const comptesDoc = await db.doc("comptabilite/comptes").get();

    if (!comptesDoc.exists) {
      throw new Error("Les comptes comptables n'existent pas. Veuillez initialiser le système.");
    }

    return comptesDoc.data().comptes;
  } catch (error) {
    console.error("❌ Erreur récupération comptes:", error);
    throw error;
  }
}

async function getAllComptesTresorerie() {
  try {
    const tresoDoc = await db.doc("comptabilite/tresorerie").get();

    if (!tresoDoc.exists) {
      throw new Error("Les comptes de trésorerie n'existent pas.");
    }

    return tresoDoc.data().comptes;
  } catch (error) {
    console.error("❌ Erreur récupération trésorerie:", error);
    throw error;
  }
}

// ============================================================================
// GÉNÉRATION D'OPÉRATIONS
// ============================================================================

function findCompteByCode(comptes, codeOhada) {
  const compte = comptes.find((c) => c.code_ohada === codeOhada);
  if (!compte) {
    console.warn(`⚠️ Compte ${codeOhada} introuvable`);
  }
  return compte;
}

function genererVentesJournalieres(date, comptes, comptesTresorerie) {
  const operations = [];
  const timestamp = date.getTime();

  // Compte 701: Vente de produits finis - 35 ventes
  const compte701 = findCompteByCode(comptes, COMPTES_IDS.VENTES_PRODUITS);
  if (compte701) {
    for (let i = 0; i < 35; i++) {
      const motif = randomChoice(MOTIFS.VENTES.slice(0, 6));
      const montant = motif.includes("menu") ? PRIX.MENU :
                     motif.includes("sandwich") ? PRIX.SANDWICH :
                     PRIX.YAOURT;

      operations.push({
        id: `op_${nanoid(12)}`,
        compte_id: compte701.id,
        compte_ohada: compte701.code_ohada,
        compte_denomination: compte701.denomination,
        montant: montant + random(-100, 200),
        motif,
        type_operation: "entree",
        date: addRandomTime(date),
        createdBy: "script_test",
        createdAt: timestamp,
      });
    }
  }

  // Compte 707: Vente de marchandises - 15 ventes
  const compte707 = findCompteByCode(comptes, COMPTES_IDS.VENTES_MARCHANDISES);
  if (compte707) {
    for (let i = 0; i < 15; i++) {
      const motif = randomChoice(MOTIFS.VENTES.slice(6));
      const montant = motif.includes("café") ? 300 : PRIX.BOISSON;

      operations.push({
        id: `op_${nanoid(12)}`,
        compte_id: compte707.id,
        compte_ohada: compte707.code_ohada,
        compte_denomination: compte707.denomination,
        montant: montant + random(-50, 100),
        motif,
        type_operation: "entree",
        date: addRandomTime(date),
        createdBy: "script_test",
        createdAt: timestamp,
      });
    }
  }

  return operations;
}

function genererOperationsTresorerie(date, comptesTresorerie) {
  const operations = [];
  const timestamp = date.getTime();

  // 2 encaissements en caisse
  const compteCaisse = findCompteByCode(comptesTresorerie, COMPTES_IDS.CAISSE);
  if (compteCaisse) {
    for (let i = 0; i < 2; i++) {
      operations.push({
        id: `op_${nanoid(12)}`,
        compte_id: compteCaisse.id,
        compte_ohada: compteCaisse.code_ohada,
        compte_denomination: compteCaisse.denomination,
        montant: random(20000, 50000),
        motif: "Encaissement ventes journée en espèces",
        type_operation: "entree",
        date: addRandomTime(date),
        createdBy: "script_test",
        createdAt: timestamp,
      });
    }
  }

  // 1 encaissement Mobile Money
  const compteMobileMoney = findCompteByCode(comptesTresorerie, COMPTES_IDS.MOBILE_MONEY);
  if (compteMobileMoney) {
    operations.push({
      id: `op_${nanoid(12)}`,
      compte_id: compteMobileMoney.id,
      compte_ohada: compteMobileMoney.code_ohada,
      compte_denomination: compteMobileMoney.denomination,
      montant: random(15000, 35000),
      motif: "Encaissement ventes Mobile Money (MTN/Moov)",
      type_operation: "entree",
      date: addRandomTime(date),
      createdBy: "script_test",
      createdAt: timestamp,
    });
  }

  // 1 décaissement caisse
  if (compteCaisse && Math.random() > 0.3) {
    operations.push({
      id: `op_${nanoid(12)}`,
      compte_id: compteCaisse.id,
      compte_ohada: compteCaisse.code_ohada,
      compte_denomination: compteCaisse.denomination,
      montant: random(5000, 15000),
      motif: randomChoice([
        "Retrait pour approvisionnement",
        "Petite dépense urgente",
        "Achat au marché",
      ]),
      type_operation: "sortie",
      date: addRandomTime(date),
      createdBy: "script_test",
      createdAt: timestamp,
    });
  }

  return operations;
}

function genererTransfertsBanque(date, comptesTresorerie) {
  const operations = [];
  const timestamp = date.getTime();

  const compteBanque = findCompteByCode(comptesTresorerie, COMPTES_IDS.BANQUE);
  const compteCaisse = findCompteByCode(comptesTresorerie, COMPTES_IDS.CAISSE);

  if (compteBanque && compteCaisse) {
    const montantDepot = random(50000, 100000);

    // Sortie de la caisse
    operations.push({
      id: `op_${nanoid(12)}`,
      compte_id: compteCaisse.id,
      compte_ohada: compteCaisse.code_ohada,
      compte_denomination: compteCaisse.denomination,
      montant: montantDepot,
      motif: "Dépôt bancaire depuis caisse",
      type_operation: "sortie",
      date: addRandomTime(date),
      createdBy: "script_test",
      createdAt: timestamp,
    });

    // Entrée à la banque
    operations.push({
      id: `op_${nanoid(12)}`,
      compte_id: compteBanque.id,
      compte_ohada: compteBanque.code_ohada,
      compte_denomination: compteBanque.denomination,
      montant: montantDepot,
      motif: "Dépôt bancaire reçu de la caisse",
      type_operation: "entree",
      date: addRandomTime(date),
      createdBy: "script_test",
      createdAt: timestamp,
    });
  }

  return operations;
}

function genererAchatsEtCharges(date, comptes, jourDuMois) {
  const operations = [];
  const timestamp = date.getTime();

  // Achats de matières premières (tous les jours)
  const compte601 = findCompteByCode(comptes, COMPTES_IDS.ACHATS_MATIERES);
  if (compte601) {
    const nbAchats = random(2, 4);
    for (let i = 0; i < nbAchats; i++) {
      operations.push({
        id: `op_${nanoid(12)}`,
        compte_id: compte601.id,
        compte_ohada: compte601.code_ohada,
        compte_denomination: compte601.denomination,
        montant: random(10000, 30000),
        motif: randomChoice(MOTIFS.ACHATS_MATIERES),
        type_operation: "sortie",
        date: addRandomTime(date),
        createdBy: "script_test",
        createdAt: timestamp,
      });
    }
  }

  // Fournitures consommables (2-3 fois par semaine)
  if (jourDuMois % 3 === 0) {
    const compte602 = findCompteByCode(comptes, COMPTES_IDS.FOURNITURES);
    if (compte602) {
      operations.push({
        id: `op_${nanoid(12)}`,
        compte_id: compte602.id,
        compte_ohada: compte602.code_ohada,
        compte_denomination: compte602.denomination,
        montant: random(5000, 15000),
        motif: randomChoice(MOTIFS.FOURNITURES),
        type_operation: "sortie",
        date: addRandomTime(date),
        createdBy: "script_test",
        createdAt: timestamp,
      });
    }
  }

  // Transport (2-3 fois par semaine)
  if (jourDuMois % 3 === 1) {
    const compte611 = findCompteByCode(comptes, COMPTES_IDS.TRANSPORT);
    if (compte611) {
      operations.push({
        id: `op_${nanoid(12)}`,
        compte_id: compte611.id,
        compte_ohada: compte611.code_ohada,
        compte_denomination: compte611.denomination,
        montant: random(2000, 8000),
        motif: randomChoice(MOTIFS.TRANSPORT),
        type_operation: "sortie",
        date: addRandomTime(date),
        createdBy: "script_test",
        createdAt: timestamp,
      });
    }
  }

  // Loyer (premier jour du mois)
  if (jourDuMois === 1) {
    const compte613 = findCompteByCode(comptes, COMPTES_IDS.LOYER);
    if (compte613) {
      operations.push({
        id: `op_${nanoid(12)}`,
        compte_id: compte613.id,
        compte_ohada: compte613.code_ohada,
        compte_denomination: compte613.denomination,
        montant: 150000,
        motif: "Loyer mensuel du local commercial",
        type_operation: "sortie",
        date: addRandomTime(date),
        createdBy: "script_test",
        createdAt: timestamp,
      });
    }
  }

  // Téléphone et Internet (5 du mois)
  if (jourDuMois === 5) {
    const compte626 = findCompteByCode(comptes, COMPTES_IDS.TELEPHONE);
    if (compte626) {
      operations.push({
        id: `op_${nanoid(12)}`,
        compte_id: compte626.id,
        compte_ohada: compte626.code_ohada,
        compte_denomination: compte626.denomination,
        montant: random(8000, 15000),
        motif: "Facture téléphone et connexion internet",
        type_operation: "sortie",
        date: addRandomTime(date),
        createdBy: "script_test",
        createdAt: timestamp,
      });
    }
  }

  // Électricité (10 du mois)
  if (jourDuMois === 10) {
    const compte615 = findCompteByCode(comptes, COMPTES_IDS.ENTRETIEN);
    if (compte615) {
      operations.push({
        id: `op_${nanoid(12)}`,
        compte_id: compte615.id,
        compte_ohada: compte615.code_ohada,
        compte_denomination: compte615.denomination,
        montant: random(25000, 40000),
        motif: "Facture électricité du local",
        type_operation: "sortie",
        date: addRandomTime(date),
        createdBy: "script_test",
        createdAt: timestamp,
      });
    }
  }

  // Rémunérations (25 du mois)
  if (jourDuMois === 25) {
    const compte641 = findCompteByCode(comptes, COMPTES_IDS.REMUNERATIONS);
    if (compte641) {
      operations.push({
        id: `op_${nanoid(12)}`,
        compte_id: compte641.id,
        compte_ohada: compte641.code_ohada,
        compte_denomination: compte641.denomination,
        montant: random(80000, 120000),
        motif: "Paiement salaires aide et livreur",
        type_operation: "sortie",
        date: addRandomTime(date),
        createdBy: "script_test",
        createdAt: timestamp,
      });
    }
  }

  // Publicité (15 et 28 du mois)
  if (jourDuMois === 15 || (jourDuMois === 28 && Math.random() > 0.5)) {
    const compte623 = findCompteByCode(comptes, COMPTES_IDS.PUBLICITE);
    if (compte623) {
      operations.push({
        id: `op_${nanoid(12)}`,
        compte_id: compte623.id,
        compte_ohada: compte623.code_ohada,
        compte_denomination: compte623.denomination,
        montant: random(15000, 35000),
        motif: randomChoice([
          "Impression flyers et affiches",
          "Publicité Facebook et Instagram",
          "Sponsoring événement local",
        ]),
        type_operation: "sortie",
        date: addRandomTime(date),
        createdBy: "script_test",
        createdAt: timestamp,
      });
    }
  }

  // Charges diverses (aléatoire)
  if (Math.random() > 0.7) {
    const compte658 = findCompteByCode(comptes, COMPTES_IDS.CHARGES_DIVERSES);
    if (compte658) {
      operations.push({
        id: `op_${nanoid(12)}`,
        compte_id: compte658.id,
        compte_ohada: compte658.code_ohada,
        compte_denomination: compte658.denomination,
        montant: random(3000, 10000),
        motif: randomChoice([
          "Pourboires et gratifications",
          "Dépense imprévue réparation",
          "Achat petit matériel",
        ]),
        type_operation: "sortie",
        date: addRandomTime(date),
        createdBy: "script_test",
        createdAt: timestamp,
      });
    }
  }

  return operations;
}

function genererOperationsJour(date, comptes, comptesTresorerie) {
  const jourDuMois = date.getDate();

  const operations = [
    ...genererVentesJournalieres(date, comptes, comptesTresorerie),
    ...genererOperationsTresorerie(date, comptesTresorerie),
    ...genererTransfertsBanque(date, comptesTresorerie),
    ...genererAchatsEtCharges(date, comptes, jourDuMois),
  ];

  return operations;
}

// ============================================================================
// SAUVEGARDE DES OPÉRATIONS (ADMIN SDK)
// ============================================================================

async function sauvegarderOperationsJour(date, operations) {
  try {
    const dayKey = formatDayKey(date);
    const docPath = `comptabilite/historique/days/${dayKey}`;

    // Admin SDK syntax
    await db.doc(docPath).set({
      operations,
      lastUpdated: Date.now(),
    });

    // Trigger RTDB (Admin SDK)
    await rtdb.ref("comptabilite_trigger").push({
      action: "bulk_operations_test",
      dayKey,
      count: operations.length,
      timestamp: Date.now(),
    });

    console.log(`✅ ${dayKey}: ${operations.length} opérations sauvegardées`);
  } catch (error) {
    console.error(`❌ Erreur sauvegarde ${formatDayKey(date)}:`, error);
    throw error;
  }
}

// ============================================================================
// FONCTION PRINCIPALE
// ============================================================================

async function main() {
  console.log("🚀 Démarrage de la génération d'opérations comptables de test");
  console.log(`📅 Période: ${DATE_DEBUT.toLocaleDateString()} - ${DATE_FIN.toLocaleDateString()}`);
  console.log("");

  try {
    // Charger les comptes
    console.log("📥 Chargement des comptes...");
    const comptes = await getAllComptes();
    const comptesTresorerie = await getAllComptesTresorerie();
    console.log(`✅ ${comptes.length} comptes comptables chargés`);
    console.log(`✅ ${comptesTresorerie.length} comptes de trésorerie chargés`);
    console.log("");

    // Générer et sauvegarder les opérations pour chaque jour
    let totalOperations = 0;
    let joursTraites = 0;

    const currentDate = new Date(DATE_DEBUT);
    while (currentDate <= DATE_FIN) {
      const operations = genererOperationsJour(currentDate, comptes, comptesTresorerie);
      await sauvegarderOperationsJour(currentDate, operations);

      totalOperations += operations.length;
      joursTraites++;

      // Avancer au jour suivant
      currentDate.setDate(currentDate.getDate() + 1);

      // Pause pour éviter de surcharger Firestore
      if (joursTraites % 10 === 0) {
        console.log(`⏸️  Pause de 2 secondes... (${joursTraites} jours traités)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log("");
    console.log("🎉 Génération terminée avec succès!");
    console.log(`📊 Statistiques:`);
    console.log(`   - Jours traités: ${joursTraites}`);
    console.log(`   - Total opérations: ${totalOperations}`);
    console.log(`   - Moyenne par jour: ${Math.round(totalOperations / joursTraites)}`);

  } catch (error) {
    console.error("💥 Erreur fatale:", error);
    process.exit(1);
  }
}

// ============================================================================
// EXÉCUTION
// ============================================================================

main()
  .then(() => {
    console.log("\n✨ Script terminé. Vous pouvez fermer cette fenêtre.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Erreur:", error);
    process.exit(1);
  });
