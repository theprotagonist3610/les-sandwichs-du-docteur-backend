import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Database,
  TrendingUp,
  Zap,
} from "lucide-react";

// Import des services de comptabilité
import { db } from "@/firebase";
import { doc, setDoc, writeBatch } from "firebase/firestore";
import {
  SemaineModel,
  ResumeModel,
  dateUtils,
  calculs,
  COMPTA_CONFIG,
} from "@/toolkits/comptabiliteToolkit";

// ==========================================
// CONFIGURATION DES DONNÉES FAKE
// ==========================================

const FAKE_CONFIG = {
  NB_MOIS: 3,
  TRANSACTIONS_PAR_JOUR_MIN: 15,
  TRANSACTIONS_PAR_JOUR_MAX: 35,
  RATIO_ENTREE_SORTIE: 0.75,
  TRESORERIE_INITIALE: {
    caisse: 500000,
    mobile_money: 300000,
    banque: 1000000,
    total: 1800000,
  },
};

// Comptes de produits (entrées) - Ventes
const COMPTES_PRODUITS = [
  {
    code_lsd: "VEN001",
    denomination: "Vente box poisson",
    probabilite: 0.12,
    prix_min: 2000,
    prix_max: 3000,
  },
  {
    code_lsd: "VEN002",
    denomination: "Vente box viande",
    probabilite: 0.12,
    prix_min: 2000,
    prix_max: 3000,
  },
  {
    code_lsd: "VEN003",
    denomination: "Vente box lapin",
    probabilite: 0.05,
    prix_min: 2500,
    prix_max: 3500,
  },
  {
    code_lsd: "VEN004",
    denomination: "Vente box mouton",
    probabilite: 0.08,
    prix_min: 2200,
    prix_max: 3200,
  },
  {
    code_lsd: "VEN005",
    denomination: "Vente box poulet",
    probabilite: 0.13,
    prix_min: 1800,
    prix_max: 2800,
  },
  {
    code_lsd: "VEN006",
    denomination: "Vente box poisson-viande",
    probabilite: 0.04,
    prix_min: 2500,
    prix_max: 3500,
  },
  {
    code_lsd: "VEN007",
    denomination: "Vente box viande-mouton",
    probabilite: 0.03,
    prix_min: 2500,
    prix_max: 3500,
  },
  {
    code_lsd: "VEN009",
    denomination: "Vente pain simple poisson",
    probabilite: 0.15,
    prix_min: 500,
    prix_max: 700,
  },
  {
    code_lsd: "VEN010",
    denomination: "Vente pain simple viande",
    probabilite: 0.15,
    prix_min: 500,
    prix_max: 700,
  },
  {
    code_lsd: "VEN013",
    denomination: "Vente pain simple poulet",
    probabilite: 0.12,
    prix_min: 500,
    prix_max: 700,
  },
  {
    code_lsd: "VEN014",
    denomination: "Vente pain viennois poisson",
    probabilite: 0.08,
    prix_min: 600,
    prix_max: 800,
  },
  {
    code_lsd: "VEN015",
    denomination: "Vente pain viennois viande",
    probabilite: 0.08,
    prix_min: 600,
    prix_max: 800,
  },
  {
    code_lsd: "VEN018",
    denomination: "Vente pain viennois poulet",
    probabilite: 0.06,
    prix_min: 600,
    prix_max: 800,
  },
  {
    code_lsd: "VEN019",
    denomination: "Vente Coca",
    probabilite: 0.15,
    prix_min: 500,
    prix_max: 500,
  },
  {
    code_lsd: "VEN020",
    denomination: "Vente Sprite",
    probabilite: 0.12,
    prix_min: 500,
    prix_max: 500,
  },
  {
    code_lsd: "VEN021",
    denomination: "Vente Fanta",
    probabilite: 0.1,
    prix_min: 500,
    prix_max: 500,
  },
  {
    code_lsd: "VEN022",
    denomination: "Vente yaourt petit banane",
    probabilite: 0.08,
    prix_min: 800,
    prix_max: 800,
  },
  {
    code_lsd: "VEN023",
    denomination: "Vente yaourt petit mangue",
    probabilite: 0.08,
    prix_min: 800,
    prix_max: 800,
  },
  {
    code_lsd: "VEN024",
    denomination: "Vente yaourt petit nature",
    probabilite: 0.05,
    prix_min: 800,
    prix_max: 800,
  },
  {
    code_lsd: "VEN026",
    denomination: "Vente yaourt grand banane",
    probabilite: 0.06,
    prix_min: 1200,
    prix_max: 1200,
  },
  {
    code_lsd: "VEN027",
    denomination: "Vente yaourt grand mangue",
    probabilite: 0.06,
    prix_min: 1200,
    prix_max: 1200,
  },
  {
    code_lsd: "VEN030",
    denomination: "Vente dégué petit",
    probabilite: 0.07,
    prix_min: 800,
    prix_max: 800,
  },
  {
    code_lsd: "VEN031",
    denomination: "Vente dégué grand",
    probabilite: 0.05,
    prix_min: 1200,
    prix_max: 1200,
  },
  {
    code_lsd: "VEN032",
    denomination: "Vente portion frites petite",
    probabilite: 0.08,
    prix_min: 500,
    prix_max: 700,
  },
  {
    code_lsd: "VEN033",
    denomination: "Vente portion frites grande",
    probabilite: 0.06,
    prix_min: 800,
    prix_max: 1000,
  },
];

// Comptes de charges (sorties)
const COMPTES_CHARGES = [
  {
    code_lsd: "ACH001",
    denomination: "Achat viande de bœuf",
    probabilite: 0.07,
    prix_min: 25000,
    prix_max: 100000,
  },
  {
    code_lsd: "ACH002",
    denomination: "Achat viande de poulet",
    probabilite: 0.1,
    prix_min: 15000,
    prix_max: 50000,
  },
  {
    code_lsd: "ACH003",
    denomination: "Achat viande de mouton",
    probabilite: 0.06,
    prix_min: 20000,
    prix_max: 80000,
  },
  {
    code_lsd: "ACH004",
    denomination: "Achat viande de lapin",
    probabilite: 0.03,
    prix_min: 10000,
    prix_max: 40000,
  },
  {
    code_lsd: "ACH005",
    denomination: "Achat poisson",
    probabilite: 0.09,
    prix_min: 10000,
    prix_max: 60000,
  },
  {
    code_lsd: "ACH006",
    denomination: "Achat pain simple",
    probabilite: 0.12,
    prix_min: 5000,
    prix_max: 20000,
  },
  {
    code_lsd: "ACH007",
    denomination: "Achat pain viennois",
    probabilite: 0.08,
    prix_min: 6000,
    prix_max: 25000,
  },
  {
    code_lsd: "ACH008",
    denomination: "Achat pommes de terre",
    probabilite: 0.08,
    prix_min: 3000,
    prix_max: 15000,
  },
  {
    code_lsd: "EPI001",
    denomination: "Achat épices moulues",
    probabilite: 0.08,
    prix_min: 1000,
    prix_max: 5000,
  },
  {
    code_lsd: "EPI002",
    denomination: "Achat poivron",
    probabilite: 0.06,
    prix_min: 500,
    prix_max: 2000,
  },
  {
    code_lsd: "EPI003",
    denomination: "Achat échalotte",
    probabilite: 0.07,
    prix_min: 500,
    prix_max: 3000,
  },
  {
    code_lsd: "EPI006",
    denomination: "Achat ail",
    probabilite: 0.05,
    prix_min: 500,
    prix_max: 2000,
  },
  {
    code_lsd: "EPI008",
    denomination: "Achat sel",
    probabilite: 0.04,
    prix_min: 500,
    prix_max: 1500,
  },
  {
    code_lsd: "FRU001",
    denomination: "Achat bananes",
    probabilite: 0.08,
    prix_min: 2000,
    prix_max: 8000,
  },
  {
    code_lsd: "FRU002",
    denomination: "Achat mangues",
    probabilite: 0.07,
    prix_min: 2000,
    prix_max: 8000,
  },
  {
    code_lsd: "LAI001",
    denomination: "Achat lait en poudre",
    probabilite: 0.06,
    prix_min: 5000,
    prix_max: 25000,
  },
  {
    code_lsd: "EMB001",
    denomination: "Achat box 16x16",
    probabilite: 0.08,
    prix_min: 5000,
    prix_max: 20000,
  },
  {
    code_lsd: "EMB002",
    denomination: "Achat papier kraft",
    probabilite: 0.05,
    prix_min: 2000,
    prix_max: 10000,
  },
  {
    code_lsd: "EMB004",
    denomination: "Achat pots yaourt petits",
    probabilite: 0.06,
    prix_min: 3000,
    prix_max: 15000,
  },
  {
    code_lsd: "BOS001",
    denomination: "Achat sodas",
    probabilite: 0.1,
    prix_min: 5000,
    prix_max: 20000,
  },
  {
    code_lsd: "TIE001",
    denomination: "Paiement livreurs",
    probabilite: 0.02,
    prix_min: 10000,
    prix_max: 20000,
  },
  {
    code_lsd: "TIE002",
    denomination: "Connexion internet",
    probabilite: 0.01,
    prix_min: 15000,
    prix_max: 15000,
  },
  {
    code_lsd: "TIE003",
    denomination: "Eau courante",
    probabilite: 0.01,
    prix_min: 8000,
    prix_max: 12000,
  },
  {
    code_lsd: "TIE004",
    denomination: "Électricité",
    probabilite: 0.01,
    prix_min: 18000,
    prix_max: 25000,
  },
];

const MODES_PAIEMENT = [
  { mode: "caisse", probabilite: 0.4 },
  { mode: "mobile_money", probabilite: 0.45 },
  { mode: "banque", probabilite: 0.15 },
];

// ==========================================
// FONCTIONS UTILITAIRES
// ==========================================

function getRandomItem(items) {
  const totalProba = items.reduce((sum, item) => sum + item.probabilite, 0);
  let random = Math.random() * totalProba;
  for (const item of items) {
    random -= item.probabilite;
    if (random <= 0) return item;
  }
  return items[0];
}

function getRandomAmount(min, max) {
  if (min === max) return min;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getAllDatesInPeriod(startDate, endDate) {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function generateDailyTransactions(date) {
  const nbTransactions = getRandomAmount(
    FAKE_CONFIG.TRANSACTIONS_PAR_JOUR_MIN,
    FAKE_CONFIG.TRANSACTIONS_PAR_JOUR_MAX
  );

  const transactions = [];

  for (let i = 0; i < nbTransactions; i++) {
    const isEntree = Math.random() < FAKE_CONFIG.RATIO_ENTREE_SORTIE;
    const compte = isEntree
      ? getRandomItem(COMPTES_PRODUITS)
      : getRandomItem(COMPTES_CHARGES);
    const modePaiement = getRandomItem(MODES_PAIEMENT);
    const montant = getRandomAmount(compte.prix_min, compte.prix_max);

    transactions.push({
      id: calculs.generateTransactionId(),
      date,
      type: isEntree ? "entree" : "sortie",
      compte_lsd: compte.code_lsd,
      compte_denomination: compte.denomination,
      compte_type: isEntree ? "produit" : "charge",
      compte_ohada: isEntree ? "701" : "601",
      montant,
      mode_paiement: modePaiement.mode,
      description: `${isEntree ? "Vente" : "Achat"} - ${compte.denomination}`,
      reference: `REF${Date.now()}${i}`,
      created_at: new Date().toISOString(),
    });
  }

  return transactions;
}

function generatePeriod(nbMois = 3) {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() - 1);
  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - nbMois);
  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  };
}

// ==========================================
// 🚀 FONCTION PRINCIPALE D'INJECTION BATCH
// ==========================================

async function injectBatchData(onProgress, onLog) {
  const { startDate, endDate } = generatePeriod(FAKE_CONFIG.NB_MOIS);
  const allDates = getAllDatesInPeriod(startDate, endDate);

  onLog(`🚀 Génération pour ${FAKE_CONFIG.NB_MOIS} mois`, "success");
  onLog(
    `📅 Période : ${dateUtils.formatDate(startDate)} → ${dateUtils.formatDate(
      endDate
    )}`,
    "info"
  );
  onLog(`📊 ${allDates.length} jours à traiter`, "info");

  // Étape 1 : Générer TOUTES les transactions en mémoire
  onLog(`⚡ Génération des transactions en mémoire...`, "info");
  const allTransactions = [];

  for (const date of allDates) {
    const dailyTransactions = generateDailyTransactions(date);
    allTransactions.push(...dailyTransactions);
  }

  onLog(`✅ ${allTransactions.length} transactions générées`, "success");

  // Étape 2 : Grouper les transactions par semaine
  onLog(`📦 Regroupement par semaine...`, "info");

  const year = new Date(startDate).getFullYear();
  const semaines = SemaineModel.genererSemainesAnnee(year);
  const transactionsByWeek = {};

  for (const transaction of allTransactions) {
    const weekInfo = SemaineModel.getWeekFromDate(transaction.date, year);
    if (weekInfo) {
      if (!transactionsByWeek[weekInfo.weekId]) {
        transactionsByWeek[weekInfo.weekId] = {
          weekInfo,
          transactions: [],
        };
      }
      transactionsByWeek[weekInfo.weekId].transactions.push(transaction);
    }
  }

  const weeksToProcess = Object.values(transactionsByWeek);
  onLog(`✅ ${weeksToProcess.length} semaines à traiter`, "success");

  // Étape 3 : Injecter semaine par semaine avec batch writes
  let tresorerieActuelle = { ...FAKE_CONFIG.TRESORERIE_INITIALE };
  let weeksProcessed = 0;
  const totalWeeks = weeksToProcess.length;

  onLog(`💾 Injection dans Firestore...`, "info");

  for (const weekData of weeksToProcess) {
    const { weekInfo, transactions } = weekData;

    // Calculer le résumé de la semaine
    const resume = ResumeModel.calculerHebdomadaire(
      transactions,
      tresorerieActuelle,
      weekInfo.nombreJours
    );

    // Préparer le document semaine
    const weekDocument = {
      ...weekInfo,
      transactions,
      resume,
      cloture: false,
      hasAnnexe: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Injecter avec setDoc (rapide, pas de transaction Firestore)
    const weekRef = doc(
      db,
      COMPTA_CONFIG.COLLECTION,
      year.toString(),
      "weeks",
      weekInfo.weekId
    );

    try {
      await setDoc(weekRef, weekDocument);

      // Mettre à jour la trésorerie pour la semaine suivante
      tresorerieActuelle = { ...resume.tresorerie_fin };

      weeksProcessed++;
      const progress = (weeksProcessed / totalWeeks) * 100;
      onProgress(progress);

      onLog(
        `✅ ${weekInfo.label} : ${transactions.length} transactions injectées`,
        "success"
      );
    } catch (error) {
      onLog(`❌ Erreur ${weekInfo.weekId} : ${error.message}`, "error");
      throw error;
    }
  }

  // Étape 4 : Calculer et injecter le résumé annuel
  onLog(`📊 Calcul du résumé annuel...`, "info");

  const weeksData = weeksToProcess.map((w) => ({
    resume: ResumeModel.calculerHebdomadaire(
      w.transactions,
      FAKE_CONFIG.TRESORERIE_INITIALE,
      w.weekInfo.nombreJours
    ),
  }));

  const resumeAnnuel = ResumeModel.calculerAnnuel(weeksData);

  const yearRef = doc(db, COMPTA_CONFIG.COLLECTION, year.toString());
  await setDoc(yearRef, {
    year,
    resume: resumeAnnuel,
    cloture: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  onLog(`✅ Résumé annuel calculé et sauvegardé`, "success");

  return {
    totalTransactions: allTransactions.length,
    totalWeeks: weeksToProcess.length,
    year,
  };
}

// ==========================================
// COMPOSANT PRINCIPAL
// ==========================================

export default function FakeComptaDataGenerator() {
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalWeeks: 0,
    startTime: null,
    endTime: null,
  });
  const [logs, setLogs] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  const addLog = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString("fr-FR");
    setLogs((prev) => [...prev, { timestamp, message, type }]);
  };

  const generateAndInject = async () => {
    setStatus("generating");
    setProgress(0);
    setLogs([]);
    setErrorMessage("");

    const startTime = Date.now();
    setStats({ totalTransactions: 0, totalWeeks: 0, startTime, endTime: null });

    try {
      const result = await injectBatchData(
        (prog) => setProgress(prog),
        (msg, type) => addLog(msg, type)
      );

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      setStats({
        totalTransactions: result.totalTransactions,
        totalWeeks: result.totalWeeks,
        startTime,
        endTime,
      });

      addLog(`🎉 Injection terminée en ${duration}s`, "success");
      addLog(
        `📊 ${result.totalTransactions} transactions sur ${result.totalWeeks} semaines`,
        "success"
      );

      setStatus("success");
      setProgress(100);
    } catch (error) {
      addLog(`❌ Erreur fatale : ${error.message}`, "error");
      setErrorMessage(error.message);
      setStatus("error");
      console.error("Erreur génération:", error);
    }
  };

  const resetGenerator = () => {
    setStatus("idle");
    setProgress(0);
    setStats({
      totalTransactions: 0,
      totalWeeks: 0,
      startTime: null,
      endTime: null,
    });
    setLogs([]);
    setErrorMessage("");
  };

  const getDuration = () => {
    if (!stats.startTime) return "0s";
    const end = stats.endTime || Date.now();
    return ((end - stats.startTime) / 1000).toFixed(2) + "s";
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            Générateur Ultra-Rapide de Données Test
          </CardTitle>
          <CardDescription>
            Génère et injecte {FAKE_CONFIG.NB_MOIS} mois de transactions en mode
            batch (5-10 secondes)
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Période :</span>{" "}
              {FAKE_CONFIG.NB_MOIS} mois
            </div>
            <div>
              <span className="font-medium">Transactions/jour :</span>{" "}
              {FAKE_CONFIG.TRANSACTIONS_PAR_JOUR_MIN}-
              {FAKE_CONFIG.TRANSACTIONS_PAR_JOUR_MAX}
            </div>
            <div>
              <span className="font-medium">Mode :</span> Batch (ultra-rapide)
            </div>
            <div>
              <span className="font-medium">Trésorerie initiale :</span>{" "}
              {FAKE_CONFIG.TRESORERIE_INITIALE.total.toLocaleString()} FCFA
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="text-xs space-y-1">
              <div>• {COMPTES_PRODUITS.length} comptes de produits</div>
              <div>• {COMPTES_CHARGES.length} comptes de charges</div>
              <div>
                • Génération en mémoire puis injection groupée par semaine
              </div>
              <div className="text-green-600 font-medium">
                ⚡ Temps estimé : 5-10 secondes
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {status !== "idle" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Statistiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.totalWeeks}
                </div>
                <div className="text-xs text-gray-600">Semaines</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats.totalTransactions}
                </div>
                <div className="text-xs text-gray-600">Transactions</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {getDuration()}
                </div>
                <div className="text-xs text-gray-600">Durée</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      {status === "generating" && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Progression</span>
                <span className="text-gray-600">{progress.toFixed(1)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Injection batch en cours...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Messages */}
      {status === "success" && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">
                  Injection terminée !
                </p>
                <p className="text-sm text-green-700 mt-1">
                  {stats.totalTransactions} transactions sur {stats.totalWeeks}{" "}
                  semaines en {getDuration()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {status === "error" && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Erreur</p>
                <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto space-y-1 text-sm font-mono bg-gray-50 p-4 rounded">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`
                  ${log.type === "error" ? "text-red-600" : ""}
                  ${log.type === "success" ? "text-green-600" : ""}
                  ${log.type === "info" ? "text-gray-700" : ""}
                `}>
                  <span className="text-gray-400">[{log.timestamp}]</span>{" "}
                  {log.message}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          onClick={generateAndInject}
          disabled={status === "generating"}
          className="flex-1"
          size="lg">
          {status === "generating" ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Générer (Mode Rapide)
            </>
          )}
        </Button>

        {status !== "idle" && status !== "generating" && (
          <Button onClick={resetGenerator} variant="outline" size="lg">
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Warning */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-800">
                Mode Test Optimisé
              </p>
              <p className="text-sm text-orange-700 mt-1">
                Ce générateur utilise le mode batch pour une injection
                ultra-rapide. Temps estimé : 5-10 secondes pour 3 mois de
                données (~1800 transactions).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
