/**
 * schemas.js
 * Schémas de validation Zod pour les livreurs
 */

import { z } from "zod";

/**
 * Schema pour un livreur
 */
export const livreurSchema = z.object({
  id: z.string().min(1, "L'ID est requis"), // livreur_nano(10)
  denomination: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  contact: z.string().min(10, "Le contact doit contenir au moins 10 caractères"),
  actif: z.boolean().default(true),
  createdBy: z.string().min(1, "createdBy est requis"),
  updatedBy: z.string().optional(),
  createdAt: z.number().positive("createdAt doit être positif"),
  updatedAt: z.number().positive("updatedAt doit être positif"),
});

/**
 * Schema pour la liste des livreurs
 */
export const livreursListeSchema = z.object({
  livreurs: z.array(livreurSchema).default([]),
  updatedAt: z.number().positive("updatedAt doit être positif"),
});

/**
 * Schema pour l'input de création d'un livreur
 */
export const createLivreurInputSchema = z.object({
  denomination: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  contact: z.string().min(10, "Le contact doit contenir au moins 10 caractères"),
  actif: z.boolean().optional().default(true),
});

/**
 * Schema pour l'input de mise à jour d'un livreur
 */
export const updateLivreurInputSchema = z.object({
  denomination: z.string().min(2, "Le nom doit contenir au moins 2 caractères").optional(),
  contact: z.string().min(10, "Le contact doit contenir au moins 10 caractères").optional(),
  actif: z.boolean().optional(),
});
