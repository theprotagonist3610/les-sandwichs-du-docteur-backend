/**
 * schemas.js
 * Schémas Zod pour la comptabilité OHADA
 */

import { z } from "zod";

// ============================================================================
// SCHEMAS ZOD
// ============================================================================

/**
 * Schema pour un compte comptable simple (entrée ou sortie)
 */
export const compteSchema = z.object({
  id: z.string().min(1, "L'ID est requis"), // cmpte_nano(10)
  code_ohada: z.string().min(1, "Le code OHADA est requis"),
  denomination: z.string().min(1, "La dénomination est requise"),
  description: z.string().optional().default(""),
  categorie: z.enum(["entree", "sortie"], {
    errorMap: () => ({ message: "La catégorie doit être 'entree' ou 'sortie'" }),
  }),
  createdBy: z.string().min(1, "createdBy est requis"),
  updatedBy: z.string().optional(),
  createdAt: z.number().positive("createdAt doit être positif"),
  updatedAt: z.number().positive("updatedAt doit être positif"),
});

/**
 * Schema pour un compte de trésorerie (toujours entree/sortie)
 */
export const compteTresorerieSchema = z.object({
  id: z.string().min(1, "L'ID est requis"), // tresor_nano(10)
  code_ohada: z.string().min(1, "Le code OHADA est requis"),
  denomination: z.string().min(1, "La dénomination est requise"),
  description: z.string().optional().default(""),
  numero: z.string().optional().default(""), // Numéro de compte bancaire ou Mobile Money
  categorie: z.literal("entree/sortie"),
  createdBy: z.string().min(1, "createdBy est requis"),
  updatedBy: z.string().optional(),
  createdAt: z.number().positive("createdAt doit être positif"),
  updatedAt: z.number().positive("updatedAt doit être positif"),
});

/**
 * Schema pour une opération comptable
 */
export const operationSchema = z.object({
  id: z.string().min(1, "L'ID est requis"), // op_nano(12)
  compte_id: z.string().min(1, "Le compte_id est requis"), // ID du compte (cmpte_xxx ou tresor_xxx)
  compte_ohada: z.string().min(1, "Le code OHADA est requis"),
  compte_denomination: z.string().min(1, "La dénomination du compte est requise"),
  montant: z.number().positive("Le montant doit être positif"),
  motif: z.string().min(1, "Le motif est requis"),
  type_operation: z.enum(["entree", "sortie"], {
    errorMap: () => ({ message: "Le type doit être 'entree' ou 'sortie'" }),
  }),
  date: z.number().positive("La date doit être positive"),
  createdBy: z.string().min(1, "createdBy est requis"),
  updatedBy: z.string().optional(),
  createdAt: z.number().positive("createdAt doit être positif"),
  updatedAt: z.number().optional(),
});

/**
 * Schema pour les statistiques d'un compte dans une journée
 */
export const compteStatistiqueSchema = z.object({
  compte_id: z.string(),
  code_ohada: z.string(),
  denomination: z.string(),
  categorie: z.enum(["entree", "sortie", "entree/sortie"]),
  nombre_operations: z.number().default(0),
  montant_total: z.number().default(0),
});

/**
 * Schema pour les statistiques d'une journée
 */
export const dayStatisticSchema = z.object({
  id: z.string().regex(/^\d{8}$/, "L'ID doit être au format DDMMYYYY"),
  comptes: z.array(compteStatistiqueSchema).default([]),
  tresorerie: z.array(compteStatistiqueSchema).default([]),
  total_entrees: z.number().default(0),
  total_sorties: z.number().default(0),
  solde_journalier: z.number().default(0), // entrees - sorties
  nombre_operations: z.number().default(0),
  createdAt: z.number().positive(),
  updatedAt: z.number().positive(),
});

/**
 * Schema pour les statistiques d'une semaine (agrégation de jours)
 */
export const weekStatisticSchema = z.object({
  id: z.string(), // Format: DDMMYYYY-DDMMYYYY
  debut: z.string().regex(/^\d{8}$/),
  fin: z.string().regex(/^\d{8}$/),
  jours: z.array(dayStatisticSchema).default([]),
  comptes: z.array(compteStatistiqueSchema).default([]),
  tresorerie: z.array(compteStatistiqueSchema).default([]),
  total_entrees: z.number().default(0),
  total_sorties: z.number().default(0),
  solde_hebdomadaire: z.number().default(0),
  nombre_operations: z.number().default(0),
  createdAt: z.number().positive(),
  updatedAt: z.number().positive(),
});

/**
 * Schema pour le bilan d'une journée
 */
export const dayBilanSchema = z.object({
  id: z.string().regex(/^\d{8}$/),
  total_entrees: z.number().default(0),
  total_sorties: z.number().default(0),
  resultat: z.number().default(0), // entrees - sorties
  statut: z.enum(["positif", "negatif", "equilibre"]),
  tresorerie_entrees: z.number().default(0),
  tresorerie_sorties: z.number().default(0),
  solde_tresorerie: z.number().default(0),
  createdAt: z.number().positive(),
  updatedAt: z.number().positive(),
});

/**
 * Schema pour le bilan d'une semaine
 */
export const weekBilanSchema = z.object({
  id: z.string(), // Format: DDMMYYYY-DDMMYYYY
  debut: z.string().regex(/^\d{8}$/),
  fin: z.string().regex(/^\d{8}$/),
  comptes_statistiques: z.array(compteStatistiqueSchema).default([]),
  tresorerie_statistiques: z.array(compteStatistiqueSchema).default([]),
  total_entrees: z.number().default(0),
  total_sorties: z.number().default(0),
  resultat: z.number().default(0), // Différence entre encaissements trésorerie et autres opérations
  statut: z.enum(["positif", "negatif", "equilibre"]),
  tresorerie_entrees: z.number().default(0),
  tresorerie_sorties: z.number().default(0),
  solde_tresorerie: z.number().default(0),
  createdAt: z.number().positive(),
  updatedAt: z.number().positive(),
});

/**
 * Schema pour un document de compte (array de comptes)
 */
export const comptesListeSchema = z.object({
  comptes: z.array(compteSchema).default([]),
  lastUpdated: z.number().positive(),
});

/**
 * Schema pour un document de comptes trésorerie (array)
 */
export const comptesTresorerieListeSchema = z.object({
  comptes: z.array(compteTresorerieSchema).default([]),
  lastUpdated: z.number().positive(),
});

/**
 * Schema pour un document d'opérations (today ou historique)
 */
export const operationsListeSchema = z.object({
  operations: z.array(operationSchema).default([]),
  lastUpdated: z.number().positive(),
});

// ============================================================================
// SCHEMAS BUDGETS
// ============================================================================

/**
 * Schema pour une ligne de budget
 */
export const ligneBudgetSchema = z.object({
  compte_id: z.string().min(1, "Le compte_id est requis"),
  code_ohada: z.string().min(1, "Le code OHADA est requis"),
  denomination: z.string().min(1, "La dénomination est requise"),
  categorie: z.enum(["entree", "sortie"], {
    errorMap: () => ({ message: "La catégorie doit être 'entree' ou 'sortie'" }),
  }),
  montant_previsionnel: z.number().positive("Le montant prévisionnel doit être positif"),
  seuil_alerte: z.number().min(0).max(100).default(80), // Pourcentage avant alerte
});

/**
 * Schema pour un budget prévisionnel
 */
export const budgetSchema = z.object({
  id: z.string().min(1, "L'ID est requis"), // budget_nano(10)
  mois: z.string().regex(/^\d{6}$/, "Le mois doit être au format MMYYYY"),
  nom: z.string().min(1, "Le nom est requis"),
  description: z.string().optional().default(""),
  montant_total_previsionnel: z.number().positive("Le montant total doit être positif"),
  statut: z.enum(["actif", "archive", "depasse"]).default("actif"),
  lignes_budget: z.array(ligneBudgetSchema).min(1, "Au moins une ligne de budget est requise"),
  createdBy: z.string().min(1, "createdBy est requis"),
  updatedBy: z.string().optional(),
  createdAt: z.number().positive("createdAt doit être positif"),
  updatedAt: z.number().positive("updatedAt doit être positif"),
});

/**
 * Schema pour une ligne de budget avec réalisation
 */
export const ligneBudgetAvecRealisationSchema = ligneBudgetSchema.extend({
  montant_realise: z.number().default(0),
  nombre_operations: z.number().default(0),
  taux_realisation: z.number().default(0), // Pourcentage
  alerte_active: z.boolean().default(false),
});

/**
 * Schema pour un budget avec réalisation (pour affichage)
 */
export const budgetAvecRealisationSchema = budgetSchema.extend({
  lignes_budget_avec_realisation: z.array(ligneBudgetAvecRealisationSchema).default([]),
  montant_total_realise: z.number().default(0),
  taux_realisation_global: z.number().default(0), // Pourcentage
});

/**
 * Schema pour un document de budgets (collection)
 */
export const budgetsListeSchema = z.object({
  budgets: z.array(budgetSchema).default([]),
  lastUpdated: z.number().positive(),
});

// ============================================================================
// SCHEMAS PREVISIONS
// ============================================================================

/**
 * Schema pour une prévision d'un compte pour un mois
 */
export const previsionCompteSchema = z.object({
  mois: z.string().regex(/^\d{6}$/, "Format mois invalide (MMYYYY)"),
  compte_id: z.string().min(1, "Le compte_id est requis"),
  code_ohada: z.string().min(1, "Le code OHADA est requis"),
  denomination: z.string().min(1, "La dénomination est requise"),
  categorie: z.enum(["entree", "sortie"]),
  montant_prevu: z.number().min(0, "Le montant prévu doit être positif ou nul"),
  scenario_pessimiste: z.number().min(0),
  scenario_optimiste: z.number().min(0),
  taux_croissance: z.number(), // Peut être négatif
  facteur_saisonnalite: z.number().positive(),
});

/**
 * Schema pour les prévisions d'un mois complet
 */
export const previsionMoisSchema = z.object({
  mois: z.string().regex(/^\d{6}$/, "Format mois invalide (MMYYYY)"),
  total_entrees_prevu: z.number().min(0),
  total_sorties_prevu: z.number().min(0),
  total_entrees_pessimiste: z.number().min(0),
  total_sorties_pessimiste: z.number().min(0),
  total_entrees_optimiste: z.number().min(0),
  total_sorties_optimiste: z.number().min(0),
  solde_prevu: z.number(),
  solde_pessimiste: z.number(),
  solde_optimiste: z.number(),
  comptes: z.array(previsionCompteSchema).default([]),
});

/**
 * Schema pour un ensemble complet de prévisions
 */
export const previsionsGlobalesSchema = z.object({
  periode_analyse: z.object({
    debut: z.string().regex(/^\d{6}$/),
    fin: z.string().regex(/^\d{6}$/),
    nb_mois: z.number().positive(),
  }),
  periode_previsions: z.object({
    nb_mois: z.number().positive(),
    debut: z.string().regex(/^\d{6}$/),
    fin: z.string().regex(/^\d{6}$/),
  }),
  indicateurs_cles: z.object({
    taux_croissance_moyen: z.number(),
    marge_previsionnelle: z.number(),
    nombre_comptes_analyses: z.number().min(0),
  }),
  previsions_par_mois: z.array(previsionMoisSchema),
  previsions_par_compte: z.array(z.object({
    compte: z.object({
      compte_id: z.string(),
      code_ohada: z.string(),
      denomination: z.string(),
      categorie: z.enum(["entree", "sortie"]),
    }),
    historique: z.array(z.object({
      mois: z.string(),
      montant: z.number(),
    })),
    previsions: z.array(previsionCompteSchema),
    tendance: z.number(),
    moyenne_mobile: z.number(),
  })),
  historique: z.array(z.any()), // Flexible pour l'historique
  generatedAt: z.number().positive(),
});

/**
 * Schema pour une anomalie détectée
 */
export const anomalieSchema = z.object({
  type: z.enum(["total", "compte"]),
  categorie: z.enum(["entree", "sortie"]).optional(),
  compte_id: z.string().optional(),
  code_ohada: z.string().optional(),
  denomination: z.string().optional(),
  severite: z.enum(["basse", "moyenne", "haute"]),
  message: z.string().min(1),
  ecart_montant: z.number(),
  ecart_pourcentage: z.number().min(0),
  montant_prevu: z.number().optional(),
  montant_realise: z.number().optional(),
});
