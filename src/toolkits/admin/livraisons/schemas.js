/**
 * schemas.js
 * Schémas de validation Zod pour les livraisons
 */

import { z } from "zod";

/**
 * Schema pour le statut d'une livraison
 */
export const statutLivraisonEnum = z.enum([
  "en_attente",     // Commande prête, pas encore assignée
  "assignee",       // Livreur assigné, colis pas encore récupéré
  "recuperee",      // Colis récupéré par le livreur
  "en_cours",       // En cours de livraison
  "livree",         // Livrée avec succès
  "annulee",        // Livraison annulée
]);

/**
 * Schema pour la priorité d'une livraison
 */
export const prioriteLivraisonEnum = z.enum([
  "normale",
  "urgente",
]);

/**
 * Schema pour les informations client d'une livraison
 */
export const clientLivraisonSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  telephone: z.string().min(10, "Le téléphone doit contenir au moins 10 caractères"),
  adresse_id: z.string().min(1, "L'adresse est requise"),
});

/**
 * Schema pour les informations livreur d'une livraison
 */
export const livreurLivraisonSchema = z.object({
  id: z.string().min(1, "L'ID du livreur est requis"),
  nom: z.string().min(1, "Le nom du livreur est requis"),
}).nullable();

/**
 * Schema pour les dates d'une livraison
 */
export const datesLivraisonSchema = z.object({
  creation: z.number().positive("La date de création doit être positive"),
  assignation: z.number().positive().nullable(),
  recuperation: z.number().positive().nullable(),
  livraison: z.number().positive().nullable(),
});

/**
 * Schema pour une livraison complète
 */
export const livraisonSchema = z.object({
  id: z.string().min(1, "L'ID est requis"), // LIV_nano(10)
  commande_code: z.string().min(1, "Le code commande est requis"),
  statut: statutLivraisonEnum,
  client: clientLivraisonSchema,
  livreur: livreurLivraisonSchema,
  colis_recupere: z.boolean().default(false),
  priorite: prioriteLivraisonEnum.default("normale"),
  dates: datesLivraisonSchema,
  notes: z.string().default(""),
  createdBy: z.string().min(1, "createdBy est requis"),
  updatedBy: z.string().optional(),
  updatedAt: z.number().positive("updatedAt doit être positif"),
});

/**
 * Schema pour la liste des livraisons (document Firestore unique)
 */
export const livraisonsListeSchema = z.object({
  livraisons: z.array(livraisonSchema).default([]),
  updatedAt: z.number().positive("updatedAt doit être positif"),
});

/**
 * Schema pour l'index RTDB d'une livraison
 */
export const livraisonIndexSchema = z.object({
  livraison_id: z.string().min(1, "L'ID de livraison est requis"),
  statut: statutLivraisonEnum,
  livreur_id: z.string().nullable(),
  colis_recupere: z.boolean(),
  updatedAt: z.number().positive(),
});

/**
 * Schema pour l'input de création d'une livraison
 */
export const createLivraisonInputSchema = z.object({
  commande_code: z.string().min(1, "Le code commande est requis"),
  client: clientLivraisonSchema,
  priorite: prioriteLivraisonEnum.optional().default("normale"),
  notes: z.string().optional().default(""),
});

/**
 * Schema pour l'input d'assignation d'un livreur
 */
export const assignerLivreurInputSchema = z.object({
  livreur_id: z.string().min(1, "L'ID du livreur est requis"),
  livreur_nom: z.string().min(1, "Le nom du livreur est requis"),
});

/**
 * Schema pour l'input de mise à jour d'une livraison
 */
export const updateLivraisonInputSchema = z.object({
  statut: statutLivraisonEnum.optional(),
  priorite: prioriteLivraisonEnum.optional(),
  notes: z.string().optional(),
  colis_recupere: z.boolean().optional(),
});
