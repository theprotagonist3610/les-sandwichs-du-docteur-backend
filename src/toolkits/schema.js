import { z } from "zod";
import { Timestamp } from "firebase/firestore";
// Validateur custom pour Firestore Timestamp
const firestoreTimestamp = z.custom((val) => val instanceof Timestamp, {
  message: "Doit être un Firestore Timestamp",
});
// ============================================================================
// User schema
// ============================================================================
export const userSchema = (data) => {
  const SCHEMA = z.object({
    app_id: z
      .string()
      .regex(
        /^user_[a-zA-Z0-9]+$/,
        "UID doit commencer par 'user_' suivi de lettres ou chiffres"
      ),
    nom: z
      .string()
      .regex(/^[a-zA-Z]+$/, "Nom doit contenir uniquement des lettres"),

    prenoms: z.array(z.string().min(1, "Prénom invalide")),

    sexe: z.enum(["F", "H"], {
      errorMap: () => ({ message: "Sexe doit être F ou H" }),
    }),

    email: z.email("Email non valide"),

    telephone: z
      .string()
      .regex(/^[0-9]+$/, "Téléphone doit contenir uniquement des chiffres")
      .max(14, "Téléphone ne doit pas dépasser 14 caractères"),

    role: z.enum(["superviseur", "vendeuse", "cuisiniere", "livreur"], {
      errorMap: () => ({ message: "Rôle invalide" }),
    }),

    level: z.enum(["admin", "user"], {
      errorMap: () => ({ message: "Level doit être admin ou user" }),
    }),
    status: z.boolean(),
    createdAt: firestoreTimestamp,
    old_roles: z.array(
      z.object({
        role: z.enum(["superviseur", "vendeuse", "cuisiniere", "livreur"]),
        createdAt: firestoreTimestamp, // Firestore Timestamp → tu peux mettre un validateur custom
        updatedAt: firestoreTimestamp,
      })
    ),
  });
  const result = SCHEMA.safeParse(data);
  if (!result.success) {
    // Extraire les champs erronés + messages
    const errors = result.error.issues.map((issue) => ({
      path: issue.path.join("."), // ex: "email", "old_roles.0.role"
      message: issue.message,
    }));
    return { success: false, errors };
  }

  return { success: true, data: result.data };
};
// ============================================================================
// Commande schema
// ============================================================================
export const commandeSchema = (data) => {
  const SCHEMA = z.object({
    adresse: z.object({
      departement: z.string().min(1, "Département requis"),
      commune: z.string().min(1, "Commune requise"),
      arrondissement: z.string().min(1, "Arrondissement requis"),
      quartier: z.string().min(1, "Quartier requis"),
      loc: z.string().min(0),
    }),

    client: z.string().min(1, "Client requis"),

    code_commande: z
      .string()
      .regex(
        /^\d{6}[FH]\d{4}-[PGC]$/,
        "Format de code commande invalide (YYYYMMF/H00000-P/G/C)"
      ),

    createdAt: firestoreTimestamp,
    updatedAt: firestoreTimestamp,

    date_livraison: z.date({ message: "Date de livraison invalide" }),

    heure_livraison: z
      .string()
      .regex(
        /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Heure invalide (format HH:MM)"
      ),

    details_commande: z
      .array(
        z.object({
          denomination: z.string().min(1, "Dénomination requise"),
          prix: z.number().min(0, "Prix requis"),
          quantite: z
            .number()
            .int()
            .min(0, "Quantité doit être un nombre positif"),
          type: z.enum(["menu", "boisson", "supplement"], {
            errorMap: () => ({
              message: "Type doit être menu, boisson ou supplement",
            }),
          }),
          id: z.string().min(1, "ID requis"),
        })
      )
      .min(1, "Au moins un détail de commande requis"),

    incident: z.object({
      type: z.enum(["favorable", "non favorable"], {
        errorMap: () => ({
          message: "Type d'incident doit être favorable ou non favorable",
        }),
      }),
      commentaires: z.string(),
    }),

    indication_adresse: z.string(),

    livreur: z.object({
      id: z.string().min(1, "ID livreur requis"),
      nom: z.string().min(1, "Nom livreur requis"),
      prenom: z.string().min(1, "Prénom livreur requis"),
    }),

    prenom_a_livrer: z.string().min(1, "Prénom à livrer requis"),
    numero_a_livrer: z.string().min(1, "Numéro à livrer requis"),

    paiement: z.object({
      total_sans_livraison: z
        .number()
        .min(0, "Total sans livraison doit être positif"),
      total: z.number().min(0, "Total doit être positif"),
      livraison: z.number().min(0, "Frais de livraison doit être positif"),
      reduction: z.number().min(0, "Réduction doit être positive"),
      montant_recu_especes: z
        .number()
        .min(0, "Montant espèces doit être positif"),
      montant_recu_momo: z
        .number()
        .min(0, "Montant mobile money doit être positif"),
      reliquat: z.number(),
      reste_a_payer: z.number(),
      statut: z.enum(["paye", "non paye", "partiel"], {
        errorMap: () => ({
          message: "Statut paiement doit être paye, non paye ou partiel",
        }),
      }),
    }),

    point_vente: z.string().min(1, "Point de vente requis"),

    statut: z.enum(
      ["livree", "en cours", "non livree", "servie", "non servie"],
      {
        errorMap: () => ({ message: "Statut invalide" }),
      }
    ),

    typeCommande: z.enum(["a livrer", "sur place"], {
      errorMap: () => ({
        message: "Type de commande doit être 'a livrer' ou 'sur place'",
      }),
    }),

    type_appel: z.enum(["direct", "whatsapp"], {
      errorMap: () => ({
        message: "Type d'appel doit être direct ou whatsapp",
      }),
    }),

    vendeur: z.object({
      id: z.string().min(1, "ID vendeur requis"),
      nom: z.string().min(1, "Nom vendeur requis"),
    }),
  });

  const result = SCHEMA.safeParse(data);

  if (!result.success) {
    // Extraire les champs erronés + messages
    const errors = result.error.issues.map((issue) => ({
      path: issue.path.join("."), // ex: "adresse.departement", "details_commande.0.prix"
      message: issue.message,
    }));
    return { success: false, errors };
  }

  return { success: true, data: result.data };
};
// ============================================================================
// Paiement schema
// ============================================================================
export const paiementSChema = (data) => {
  const SCHEMA = z.object({
    total_sans_livraison: z
      .number()
      .min(0, "Total sans livraison doit être positif"),
    total: z.number().min(0, "Total doit être positif"),
    livraison: z.number().min(0, "Frais de livraison doit être positif"),
    reduction: z.number().min(0, "Réduction doit être positive"),
    montant_recu_especes: z
      .number()
      .min(0, "Montant espèces doit être positif"),
    montant_recu_momo: z
      .number()
      .min(0, "Montant mobile money doit être positif"),
    reliquat: z.number(),
    reste_a_payer: z.number(),
    statut: z.enum(["paye", "non paye", "partiel"], {
      errorMap: () => ({
        message: "Statut paiement doit être paye, non paye ou partiel",
      }),
    }),
  });

  const result = SCHEMA.safeParse(data);

  if (!result.success) {
    // Extraire les champs erronés + messages
    const errors = result.error.issues.map((issue) => ({
      path: issue.path.join("."), // ex: "adresse.departement", "details_commande.0.prix"
      message: issue.message,
    }));
    return { success: false, errors };
  }

  return { success: true, data: result.data };
};
// ============================================================================
// Element de stock schema
// ============================================================================
export const stockSchema = (data) => {
  const SCHEMA = z.object({
    id: z.string().min(1, "ID requis"),

    denomination: z.string().min(1, "Dénomination requise"),

    createdAt: firestoreTimestamp,

    seuil_critique: z
      .number()
      .min(0, "Seuil critique doit être un nombre positif ou égal à 0"),

    fournisseur: z.object({
      nom: z.string().min(1, "Nom du fournisseur requis"),
      contact: z.string().min(1, "Contact du fournisseur requis"),
    }),
    unite: z.object({
      nom: z
        .string()
        .min(
          1,
          "Le nom de l'unite doit etre une chaine de caracteres d'au moins une lettre"
        ),
      symbol: z
        .string()
        .min(
          1,
          "Le symbol de l'unite doit etre une chaine de caracteres d'au moins une lettre"
        ),
    }),
  });

  const result = SCHEMA.safeParse(data);

  if (!result.success) {
    // Extraire les champs erronés + messages
    const errors = result.error.issues.map((issue) => ({
      path: issue.path.join("."), // ex: "fournisseur.nom", "seuil_critique"
      message: issue.message,
    }));
    return { success: false, errors };
  }

  return { success: true, data: result.data };
};
// ============================================================================
// Element de menu schema
// ============================================================================
export const menuSchema = (data) => {
  const ingredientSchema = z.object({
    id: z.string().min(1, "ID ingrédient requis"),
    denomination: z.string().min(1, "Dénomination ingrédient requise"),
    quantite: z
      .number()
      .min(0, "Quantité doit être un nombre positif ou égal à 0"),
  });
  const SCHEMA = z.object({
    id: z.string().min(1, "ID requis"),

    denomination: z.string().min(1, "Dénomination requise"),

    groupe: z.string().min(1, "Groupe requis"), // Catégorie du menu

    recipient: z.string().min(1, "Récipient requis"), // Type d'emballage

    description: z.string().optional().default(""), // Description du menu

    createdAt: firestoreTimestamp,

    prix: z.number().min(0, "Prix doit être un nombre positif ou égal à 0"),

    imgURL: z
      .union(
        [
          z.string().url("URL d'image invalide"),
          z.string().length(0), // String vide acceptée
        ],
        {
          errorMap: () => ({
            message: "Image doit être une URL valide ou une chaîne vide",
          }),
        }
      )
      .optional()
      .default(""),

    ingredients: z.array(ingredientSchema).optional().default([]),

    calories: z
      .number()
      .min(0, "Calories doit être un nombre positif ou égal à 0")
      .optional()
      .default(0),

    actif: z.boolean().optional().default(true),
  });

  const result = SCHEMA.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    return { success: false, errors };
  }

  return { success: true, data: result.data };
};
// ============================================================================
// Element de ingredient schema
// ============================================================================
export const ingredientSchema = (data) => {
  const SCHEMA = z.object({
    id: z.string().min(1, "ID requis"),

    denomination: z.string().min(1, "Dénomination requise"),

    groupe: z.string().min(1, "Groupe requis"), // Catégorie d'ingredients (fruits, legumes, viandes, poisson)

    createdAt: firestoreTimestamp,

    emoji: z.string().optional().default(""),

    calories: z
      .number()
      .min(0, "Calories doit être un nombre positif ou égal à 0")
      .optional()
      .default(0),

    actif: z.boolean().optional().default(true),
  });

  const result = SCHEMA.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    return { success: false, errors };
  }

  return { success: true, data: result.data };
};
// ============================================================================
// Element de boisson schema
// ============================================================================
export const boissonSchema = (data) => {
  // Schema pour l'objet unite
  const uniteSchema = z.object({
    nom: z.string().min(1, "Nom de l'unité requis"),
    symbole: z.string().min(1, "Symbole de l'unité requis"),
  });

  // Schema pour les ingrédients
  const ingredientSchema = z.object({
    id: z.string().min(1, "ID ingrédient requis"),
    denomination: z.string().min(1, "Dénomination ingrédient requise"),
    quantite: z
      .number()
      .min(0, "Quantité doit être un nombre positif ou égal à 0"),
  });

  const SCHEMA = z.object({
    id: z.string().min(1, "ID requis"),

    denomination: z.string().min(1, "Dénomination requise"),

    groupe: z.string().min(1, "Groupe requis"), // Nouveau: catégorie de la boisson

    recipient: z.string().min(1, "Récipient requis"), // Nouveau: type de récipient

    createdAt: firestoreTimestamp,

    prix: z.number().min(0, "Prix doit être un nombre positif ou égal à 0"),

    imgURL: z
      .union(
        [
          z.string().url("URL d'image invalide"),
          z.string().length(0), // String vide acceptée
        ],
        {
          errorMap: () => ({
            message: "Image doit être une URL valide ou une chaîne vide",
          }),
        }
      )
      .optional()
      .default(""), // Renommé de 'img' à 'imgURL'

    ingredients: z.array(ingredientSchema).optional().default([]), // Renommé de 'ingredient' à 'ingredients'

    volume: z.number().min(0, "Volume doit être un nombre positif ou égal à 0"),

    unite: uniteSchema, // Nouveau: unité de mesure

    calories: z
      .number()
      .min(0, "Calories doit être un nombre positif ou égal à 0")
      .optional()
      .default(0), // Nouveau

    actif: z.boolean().optional().default(true), // Ajout du champ actif avec valeur par défaut
  });

  const result = SCHEMA.safeParse(data);

  if (!result.success) {
    // Extraire les champs erronés + messages
    const errors = result.error.issues.map((issue) => ({
      path: issue.path.join("."), // ex: "ingredients.0.denomination", "volume"
      message: issue.message,
    }));
    return { success: false, errors };
  }

  return { success: true, data: result.data };
};
// ============================================================================
// Element de Supplement schema
// ============================================================================
export const supplementSchema = (data) => {
  const SCHEMA = z.object({
    id: z.string().min(1, "ID requis"),

    denomination: z.string().min(1, "Dénomination requise"),

    groupe: z.string().min(1, "Groupe requis"), // Ajouté pour catégoriser les suppléments

    description: z.string().optional().default(""), // Ajouté pour la description

    createdAt: firestoreTimestamp,

    prix: z.union([
      z.number().min(0, "Prix doit être un nombre positif ou égal à 0"),
      z.string().regex(/^gratuit$/i, "Prix doit être un nombre ou 'gratuit'"), // Support pour "gratuit"
    ]),

    imgURL: z
      .union(
        [
          z.string().url("URL d'image invalide"),
          z.string().length(0), // String vide acceptée
        ],
        {
          errorMap: () => ({
            message: "Image doit être une URL valide ou une chaîne vide",
          }),
        }
      )
      .optional()
      .default(""), // Renommé de 'img' à 'imgURL' pour cohérence

    actif: z.boolean().optional().default(true),
  });

  const result = SCHEMA.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    return { success: false, errors };
  }

  return { success: true, data: result.data };
};
// ============================================================================
// Lieu de livraison/location schema
// ============================================================================
export const locationSchema = (data) => {
  const SCHEMA = z.object({
    id: z.string().min(1, "ID requis"),

    departement: z.string(), // String vide acceptée

    commune: z.string(), // String vide acceptée

    arrondissement: z.string(), // String vide acceptée

    quartier: z.string(), // String vide acceptée

    loc: z.array(z.string()), // String vide acceptée
  });

  const result = SCHEMA.safeParse(data);

  if (!result.success) {
    // Extraire les champs erronés + messages
    const errors = result.error.issues.map((issue) => ({
      path: issue.path.join("."), // ex: "distance.0.point", "departement"
      message: issue.message,
    }));
    return { success: false, errors };
  }

  return { success: true, data: result.data };
};
// ============================================================================
// Point de vente/emplacement schema
// ============================================================================
export const emplacementSchema = (data) => {
  const fT = z.custom((val) => val instanceof Timestamp, {
    message: "Doit être un Firestore Timestamp",
  });

  const COORDONNEES_SCHEMA = z.object({
    longitude: z.number(),
    latitude: z.number(),
  });

  const PERIODE_SCHEMA = z.object({
    debut: fT, // timestamp
    fin: fT.nullable(), // timestamp ou null
  });

  const POSITION_SCHEMA = z.object({
    nom: z.string(),
    departement: z.string(), // String vide acceptée
    commune: z.string(), // String vide acceptée
    arrondissement: z.string(), // String vide acceptée
    quartier: z.string(), // String vide acceptée
    indication: z.string(),
    coordonnees: COORDONNEES_SCHEMA,
    periode: PERIODE_SCHEMA,
  });

  const VENDEUSE_SCHEMA = z.object({
    id: z.string(),
    nom: z.string(),
    prenoms: z.array(z.string()),
    periode: PERIODE_SCHEMA,
  });

  const ITEM_STOCK_SCHEMA = z.object({
    id: z.string(),
    denomination: z.string(),
    quantite: z.number().min(0),
  });

  const STOCK_ACTUEL_SCHEMA = z.object({
    equipements: z.array(ITEM_STOCK_SCHEMA),
    consommable: z.array(ITEM_STOCK_SCHEMA),
    perissable: z.array(ITEM_STOCK_SCHEMA),
  });

  const HISTORIQUE_STOCK_SCHEMA = z.object({
    id: z.string(),
    items: z.array(ITEM_STOCK_SCHEMA), // Liste des items concernés
    operation: z.enum(["entree", "sortie"]),
    motif: z.enum([
      "vente",
      "achat",
      "production",
      "destruction",
      "transfert",
      "initialisation",
    ]),
    description: z.string(),
    date: fT, // Timestamp de l'opération
  });

  const SCHEMA = z.object({
    id: z.string().min(1, "ID requis"),
    type: z.enum(
      ["emplacement fixe", "emplacement semi-mobile", "emplacement mobile"],
      {
        errorMap: () => ({ message: "Type d'emplacement invalide" }),
      }
    ),
    denomination: z.string().min(1, "Dénomination requise"),
    status: z.boolean(), // CHANGÉ DE STRING À BOOLEAN
    position_actuelle: POSITION_SCHEMA.nullable(), // Peut être null à la création
    historique_des_positions: z.array(POSITION_SCHEMA).default([]),
    vendeuse_actuelle: VENDEUSE_SCHEMA.nullable(), // Peut être null
    historique_des_vendeuses: z.array(VENDEUSE_SCHEMA).default([]),
    stock_actuel: STOCK_ACTUEL_SCHEMA,
    historique_du_stock: z.array(HISTORIQUE_STOCK_SCHEMA).default([]),
    created_at: fT.optional(), // Ajout des timestamps
    updated_at: fT.optional(),
    deactivated_at: fT.optional(),
  });

  if (!data) {
    // Retourner les schemas individuels si aucune data n'est passée à la fonction
    return {
      coordonnees_schema: COORDONNEES_SCHEMA,
      periode_schema: PERIODE_SCHEMA,
      position_schema: POSITION_SCHEMA,
      vendeuse_schema: VENDEUSE_SCHEMA,
      itemStock_schema: ITEM_STOCK_SCHEMA,
      stockActuel_schema: STOCK_ACTUEL_SCHEMA,
      historiqueStock_schema: HISTORIQUE_STOCK_SCHEMA,
      schema: SCHEMA,
    };
  }

  const result = SCHEMA.safeParse(data);

  if (!result.success) {
    // Extraire les champs erronés + messages
    const errors = result.error.issues.map((issue) => ({
      path: issue.path.join("."), // ex: "denomination", "coordonnees.longitude"
      message: issue.message,
    }));
    return { success: false, errors };
  }

  return { success: true, data: result.data };
};
// ============================================================================
// Client schema
// ============================================================================
export const clientSchema = (data) => {
  const SCHEMA = z.object({
    id: z.string().min(1, "ID requis"),

    nom: z.string(), // String vide acceptée

    prenom: z.string(), // String vide acceptée

    sexe: z.enum(["F", "H"], {
      errorMap: () => ({ message: "Sexe doit être F ou H" }),
    }),

    profession: z.string(), // String vide acceptée

    niveau_activite: z.enum(["faible", "moyenne", "intense"], {
      errorMap: () => ({
        message: "Niveau d'activité doit être faible, moyenne ou intense",
      }),
    }),

    poids: z.number().min(0, "Poids doit être un nombre positif ou égal à 0"),

    taille: z.number().min(0, "Taille doit être un nombre positif ou égal à 0"),

    TA: z.array(
      z.object({
        sys: z
          .number()
          .min(
            0,
            "Pression systolique doit être un nombre positif ou égal à 0"
          ),
        dia: z
          .number()
          .min(
            0,
            "Pression diastolique doit être un nombre positif ou égal à 0"
          ),
        pouls: z
          .number()
          .min(0, "Pouls doit être un nombre positif ou égal à 0"),
      })
    ), // Array peut être vide

    commandes: z.array(
      z.object({
        id: z.string().min(1, "ID commande requis"),
        details: z.object({
          denomination: z.string().min(1, "Dénomination requise"),
          prix: z
            .number()
            .min(0, "Prix doit être un nombre positif ou égal à 0"),
        }),
        livraison: z
          .number()
          .min(0, "Frais de livraison doit être un nombre positif ou égal à 0"),
        montant_paye: z
          .number()
          .min(0, "Montant payé doit être un nombre positif ou égal à 0"),
      })
    ), // Array peut être vide

    total_depense: z
      .number()
      .min(0, "Total dépensé doit être un nombre positif ou égal à 0"),
  });

  const result = SCHEMA.safeParse(data);

  if (!result.success) {
    // Extraire les champs erronés + messages
    const errors = result.error.issues.map((issue) => ({
      path: issue.path.join("."), // ex: "commandes.0.details.prix", "TA.0.sys"
      message: issue.message,
    }));
    return { success: false, errors };
  }

  return { success: true, data: result.data };
};
// ============================================================================
// CommandeReduite schema
// ============================================================================
export const commandeReduiteSchema = () => {
  const SCHEMA = z.object({
    id: z.string().min(1, "ID commande requis"),
    details: z.object({
      denomination: z.string().min(1, "Dénomination requise"),
      prix: z.number().min(0, "Prix doit être un nombre positif ou égal à 0"),
    }),
    livraison: z
      .number()
      .min(0, "Frais de livraison doit être un nombre positif ou égal à 0"),
    montant_paye: z
      .number()
      .min(0, "Montant payé doit être un nombre positif ou égal à 0"),
  });

  const result = SCHEMA.safeParse(data);

  if (!result.success) {
    // Extraire les champs erronés + messages
    const errors = result.error.issues.map((issue) => ({
      path: issue.path.join("."), // ex: "commandes.0.details.prix", "TA.0.sys"
      message: issue.message,
    }));
    return { success: false, errors };
  }

  return { success: true, data: result.data };
};
// ============================================================================
// Notification schema
// ============================================================================
export const notificationSchema = (data) => {
  const SCHEMA = z.object({
    id: z.string().min(1, "ID requis"),

    role: z.enum(["superviseur", "vendeuse", "cuisiniere", "livreur"], {
      errorMap: () => ({ message: "Rôle invalide" }),
    }),

    message: z.string().min(1, "Message requis"),
  });

  const result = SCHEMA.safeParse(data);

  if (!result.success) {
    // Extraire les champs erronés + messages
    const errors = result.error.issues.map((issue) => ({
      path: issue.path.join("."), // ex: "role", "message"
      message: issue.message,
    }));
    return { success: false, errors };
  }

  return { success: true, data: result.data };
};
// ============================================================================
// To do schema
// ============================================================================
export const toDoSchema = (data) => {
  const SCHEMA = z.object({
    id: z.string().min(1, "ID requis"),

    targetList: z.union(
      [
        z.literal("all"),
        z
          .array(z.string())
          .min(1, "TargetList doit contenir au moins un élément ou être 'all'"),
      ],
      {
        errorMap: () => ({
          message: "TargetList doit être 'all' ou un array non vide",
        }),
      }
    ),

    title: z.string().min(1, "Titre requis"),

    message: z.string().min(1, "Message requis"),
  });

  const result = SCHEMA.safeParse(data);

  if (!result.success) {
    // Extraire les champs erronés + messages
    const errors = result.error.issues.map((issue) => ({
      path: issue.path.join("."), // ex: "targetList.0", "title"
      message: issue.message,
    }));
    return { success: false, errors };
  }

  return { success: true, data: result.data };
};
// ============================================================================
// Operation de transaction de stock schema
// ============================================================================
export const stockTransfertSchema = (data) => {
  const SCHEMA = z.object({
    id: z.string().min(1, "ID requis"),

    item: z.object({
      id: z.string().min(1, "ID item requis"),
      denomination: z.string().min(1, "Dénomination item requise"),
    }),

    from: z.object({
      id: z.string().min(1, "ID source requis"),
      denomination: z.string().min(1, "Dénomination source requise"),
    }),

    to: z.object({
      id: z.string().min(1, "ID destination requis"),
      denomination: z.string().min(1, "Dénomination destination requise"),
    }),

    by: z.object({
      id: z.string().min(1, "ID utilisateur requis"),
      nom: z.string().min(1, "Nom utilisateur requis"),
      prenom: z.string().min(1, "Prénom utilisateur requis"),
    }),

    createdAt: firestoreTimestamp,
  });

  const result = SCHEMA.safeParse(data);

  if (!result.success) {
    // Extraire les champs erronés + messages
    const errors = result.error.issues.map((issue) => ({
      path: issue.path.join("."), // ex: "item.denomination", "by.nom"
      message: issue.message,
    }));
    return { success: false, errors };
  }

  return { success: true, data: result.data };
};
// ============================================================================
// Operation de stock schema
// ============================================================================
export const stockOperationSchema = (data) => {
  const SCHEMA = z.object({
    id: z.string().min(1, "ID requis"),
    uid: z.string().min(1, "UID requis"),
    item: z.object({
      id: z.string().min(1, "ID item requis"),
      denomination: z.string().min(1, "Dénomination item requise"),
    }),

    from: z.object({
      id: z.string().min(1, "ID source requis"),
      denomination: z.string().min(1, "Dénomination source requise"),
    }),

    by: z.object({
      id: z.string().min(1, "ID utilisateur requis"),
      nom: z.string().min(1, "Nom utilisateur requis"),
      prenom: z.string().min(1, "Prénom utilisateur requis"),
    }),

    createdAt: firestoreTimestamp,

    quantite: z.number().min(1, "Quantité doit être supérieure à 0"),

    motif: z.string().min(1, "Motif requis"),
  });

  const result = SCHEMA.safeParse(data);

  if (!result.success) {
    // Extraire les champs erronés + messages
    const errors = result.error.issues.map((issue) => ({
      path: issue.path.join("."), // ex: "item.denomination", "motif"
      message: issue.message,
    }));
    return { success: false, errors };
  }

  return { success: true, data: result.data };
};
// ============================================================================
// Operation de transaction comptable schema
// ============================================================================
export const transactionComptableSchema = (data) => {
  const SCHEMA = z.object({
    id: z.string().min(1, "ID requis"),

    from: z.object({
      id: z.string().min(1, "ID source requis"),
      denomination: z.string().min(1, "Dénomination source requise"),
    }),

    by: z.object({
      id: z.string().min(1, "ID utilisateur requis"),
      nom: z.string().min(1, "Nom utilisateur requis"),
      prenom: z.string().min(1, "Prénom utilisateur requis"),
    }),

    createdAt: firestoreTimestamp,

    montant: z.number(),

    motif: z.string().min(1, "Motif requis"),

    descriptiion: z.string(), // String vide acceptée
  });

  const result = SCHEMA.safeParse(data);

  if (!result.success) {
    // Extraire les champs erronés + messages
    const errors = result.error.issues.map((issue) => ({
      path: issue.path.join("."), // ex: "from.denomination", "motif"
      message: issue.message,
    }));
    return { success: false, errors };
  }

  return { success: true, data: result.data };
};
// ============================================================================
// Compte bancaire schema
// ============================================================================
export const compteSchema = (data) => {
  const SCHEMA = z.object({
    id: z.string().min(1, "ID requis"),

    type: z.enum(["caisse", "mobile", "compte_bancaire"], {
      errorMap: () => ({
        message: "Type doit être caisse, mobile ou compte_bancaire",
      }),
    }),

    numero: z.string(), // String vide acceptée

    denomination: z.string(), // String vide acceptée
  });

  const result = SCHEMA.safeParse(data);

  if (!result.success) {
    // Extraire les champs erronés + messages
    const errors = result.error.issues.map((issue) => ({
      path: issue.path.join("."), // ex: "type", "numero"
      message: issue.message,
    }));
    return { success: false, errors };
  }

  return { success: true, data: result.data };
};
// ============================================================================
// Moyens de paiement schema
// ============================================================================
export const moyenPaiementSchema = (data) => {
  const SCHEMA = z.object({
    id: z.string().min(1, "ID requis"),

    type: z.enum(["especes", "paiement_mobile", "compte_bancaire"], {
      errorMap: () => ({
        message: "Type doit être especes ou paiement_mobile",
      }),
    }),

    numero: z.string(), // String vide acceptée
    groupe: z.string(), // String vide acceptée

    denomination: z.string(), // String vide acceptée
  });

  const result = SCHEMA.safeParse(data);

  if (!result.success) {
    // Extraire les champs erronés + messages
    const errors = result.error.issues.map((issue) => ({
      path: issue.path.join("."), // ex: "type", "numero"
      message: issue.message,
    }));
    return { success: false, errors };
  }

  return { success: true, data: result.data };
};
// ============================================================================
// Resume stock schema
// ============================================================================
// ============================================================================
// Resume vente jour schema
// ============================================================================
// ============================================================================
// Resume vente semaine schema
// ============================================================================
// ============================================================================
// Resume vente mois schema
// ============================================================================
// ============================================================================
// Prise TA schema
// ============================================================================
// ============================================================================
// Statistique schema
// ============================================================================
