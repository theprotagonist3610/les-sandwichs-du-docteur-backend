import useBreakpoint from "@/hooks/useBreakpoint";
import MobileCreateOperationComptable from "./mobile/MobileCreateOperationComptable";
import DesktopCreateOperationComptable from "./desktop/DesktopCreateOperationComptable";

const CreateOperationComptable = () => {
  const { mobile } = useBreakpoint();
  return mobile ? (
    <MobileCreateOperationComptable />
  ) : (
    <DesktopCreateOperationComptable />
  );
};

export default CreateOperationComptable;

/*
 * CREATEOPERATIONCOMPTABLE - Composant de création d'opérations comptables
 *
 * ARCHITECTURE:
 * - Utilise useBreakpoint pour basculer entre Mobile et Desktop
 * - Store Zustand: useCreateOperationStore pour éviter les re-renders inutiles
 * - Chaque champ consomme une variable unique du store via des sélecteurs
 * - Support de la query string ?type=[entree|sortie|transfert]
 *
 * FONCTIONNALITÉS:
 * 1. Flux d'opération logique avec interdépendance
 *    - L'utilisateur sélectionne d'abord le type (Entrée, Sortie ou Transfert)
 *    - Le Select des comptes filtre automatiquement selon le type choisi
 *    - Affichage du code OHADA et de la dénomination
 *    - Si le type change, le compte incompatible est réinitialisé avec feedback
 *    - Les comptes "entree/sortie" (trésorerie) sont disponibles pour les 2 types
 *
 * 2. Types d'opération
 *    a) Entrée (recette):
 *       - 1 compte (comptable ou trésorerie)
 *       - Montant, date, motif obligatoires
 *
 *    b) Sortie (dépense):
 *       - 1 compte (comptable ou trésorerie)
 *       - Montant, date, motif obligatoires
 *
 *    c) Transfert (nouveau):
 *       - 2 comptes de trésorerie (source + destination)
 *       - Génère automatiquement 2 opérations:
 *         * Une sortie du compte source avec motif auto-généré
 *         * Une entrée sur le compte destination avec motif auto-généré
 *       - Montant et date obligatoires (motif non requis)
 *
 * 3. Système de queue anti-collision
 *    - Utilise createOperationWithQueue() pour les entrées/sorties
 *    - Utilise createTransfertWithQueue() pour les transferts
 *    - Les opérations sont ajoutées à une file d'attente
 *    - Traitement automatique via executeComptaOperations()
 *
 * COMPOSANTS UI:
 * - ui/input-group pour tous les champs éditables
 * - lucide-react pour l'iconographie riche (TrendingUp, TrendingDown, ArrowLeftRight)
 * - framer-motion pour les animations
 * - Select pour le choix du compte avec Badge pour le code OHADA
 * - RadioGroup pour le type d'opération (Entrée/Sortie/Transfert)
 *
 * DESKTOP:
 * - Layout spacieux avec disposition verticale
 * - Cards avec descriptions détaillées
 * - Animations sur les RadioGroup items
 * - 3 colonnes pour les types d'opération
 *
 * MOBILE:
 * - Version compacte et responsive
 * - Actions sticky en bas
 * - Optimisée pour le tactile
 * - RadioGroup en liste verticale
 *
 * SYSTÈME MODULAIRE:
 * - Utilise comptabiliteToolkit.jsx (système de queue)
 * - getAllComptes() et getAllComptesTresorerie() pour les listes
 * - createOperationWithQueue() pour les opérations simples
 * - createTransfertWithQueue() pour les transferts (crée 2 opérations)
 *
 * VALIDATION:
 * Entrée/Sortie:
 * - Compte requis
 * - Montant > 0
 * - Motif obligatoire
 *
 * Transfert:
 * - Compte source et destination requis
 * - Comptes différents
 * - Montant > 0
 * - Motif auto-généré
 *
 * - Feedback visuel avec toast et messages d'erreur/succès
 */
