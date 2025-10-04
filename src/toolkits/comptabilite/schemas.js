// ==========================================
// 📄 toolkits/comptabilite/schemas.js
// ==========================================

import { z } from "zod";

export const tresorerieSchema = z.object({
  caisse: z.number().default(0),
  mobile_money: z.number().default(0),
  banque: z.number().default(0),
  total: z.number().default(0),
});

export const repartitionPaiementsSchema = z.object({
  especes_pct: z.number().default(0),
  mobile_money_pct: z.number().default(0),
  banque_pct: z.number().default(0),
});

export const transactionComptableSchema = z.object({
  id: z.string(),
  date: z.string(),
  type: z.enum(["entree", "sortie"]),
  compte_lsd: z.string(),
  compte_denomination: z.string(),
  compte_type: z.string(),
  compte_ohada: z.string(),
  montant: z.number().positive(),
  mode_paiement: z.enum(["caisse", "mobile_money", "banque"]),
  description: z.string().optional(),
  reference: z.string().optional(),
  created_at: z.string(),
  created_by: z.string().optional(),
});

export const resumeHebdomadaireSchema = z.object({
  tresorerie_debut: tresorerieSchema,
  tresorerie_fin: tresorerieSchema,
  total_encaissements: tresorerieSchema,
  total_decaissements: tresorerieSchema,
  chiffre_affaires: z.number().default(0),
  produits_par_compte: z.record(z.number()).default({}),
  charges_par_compte: z.record(z.number()).default({}),
  charges_fixes: z.number().default(0),
  charges_variables: z.number().default(0),
  balance_nette: z.number().default(0),
  excedent_insuffisance: z.number().default(0),
  capacite_autofinancement: z.number().default(0),
  repartition_paiements: repartitionPaiementsSchema,
  nombre_transactions: z.number().default(0),
  tresorerie_moyenne_journaliere: z.number().default(0),
  delai_moyen_caisse: z.number().default(0),
});

export const resumeMensuelSchema = z.object({
  mois: z.number().min(1).max(12),
  annee: z.number(),
  nom_mois: z.string(),
  resume: resumeHebdomadaireSchema,
});

export const resumeAnnuelSchema = z.object({
  tresorerie_debut: tresorerieSchema,
  tresorerie_fin: tresorerieSchema,
  total_encaissements: tresorerieSchema,
  total_decaissements: tresorerieSchema,
  chiffre_affaires: z.number().default(0),
  produits_par_compte: z.record(z.number()).default({}),
  charges_par_compte: z.record(z.number()).default({}),
  charges_fixes: z.number().default(0),
  charges_variables: z.number().default(0),
  balance_nette: z.number().default(0),
  excedent_insuffisance: z.number().default(0),
  capacite_autofinancement: z.number().default(0),
  repartition_paiements: repartitionPaiementsSchema,
  nombre_transactions_total: z.number().default(0),
  tresorerie_moyenne_journaliere: z.number().default(0),
  tresorerie_mensuelle: z.record(resumeMensuelSchema).default({}),
});

export const semaineSchema = z.object({
  weekId: z.string(),
  label: z.string(),
  dateDebut: z.string(),
  dateFin: z.string(),
  annee: z.number(),
  numeroSemaine: z.number(),
  nombreJours: z.number(),
  transactions: z.array(transactionComptableSchema),
  resume: resumeHebdomadaireSchema,
  cloture: z.boolean().default(false),
  hasAnnexe: z.boolean().default(false),
  created_at: z.string(),
  updated_at: z.string(),
});

export const annexeSchema = z.object({
  parentWeekId: z.string(),
  transactions: z.array(transactionComptableSchema),
  created_at: z.string(),
  updated_at: z.string(),
});

export const documentAnnuelSchema = z.object({
  year: z.number(),
  resume: resumeAnnuelSchema,
  cloture: z.boolean().default(false),
  created_at: z.string(),
  updated_at: z.string(),
});
