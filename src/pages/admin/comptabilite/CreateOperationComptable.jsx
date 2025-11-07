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
 *
 * FONCTIONNALITÉS:
 * 1. Flux d'opération logique avec interdépendance
 *    - L'utilisateur sélectionne d'abord le type (Entrée ou Sortie)
 *    - Le Select des comptes filtre automatiquement selon le type choisi
 *    - Affichage du code OHADA et de la dénomination
 *    - Si le type change, le compte incompatible est réinitialisé avec feedback
 *    - Les comptes "entree/sortie" (trésorerie) sont disponibles pour les 2 types
 *
 * 2. Saisie de l'opération
 *    - Type: Entrée (recette) ou Sortie (dépense)
 *    - Montant en FCFA
 *    - Date de l'opération
 *    - Motif détaillé
 *
 * 3. Système de queue anti-collision
 *    - Utilise createOperationWithQueue() pour éviter les conflits
 *    - Les opérations sont ajoutées à une file d'attente
 *    - Traitement automatique via executeComptaOperations()
 *
 * COMPOSANTS UI:
 * - ui/input-group pour tous les champs éditables
 * - lucide-react pour l'iconographie riche
 * - framer-motion pour les animations
 * - Select pour le choix du compte avec Badge pour le code OHADA
 * - RadioGroup pour le type d'opération (Entrée/Sortie)
 *
 * DESKTOP:
 * - Layout spacieux avec disposition verticale
 * - Cards avec descriptions détaillées
 * - Animations sur les RadioGroup items
 *
 * MOBILE:
 * - Version compacte et responsive
 * - Actions sticky en bas
 * - Optimisée pour le tactile
 *
 * SYSTÈME MODULAIRE:
 * - Utilise comptabiliteToolkit.jsx (système de queue)
 * - getAllComptes() et getAllComptesTresorerie() pour les listes
 * - createOperationWithQueue() pour la création sécurisée
 *
 * VALIDATION:
 * - Compte requis
 * - Montant > 0
 * - Motif obligatoire
 * - Feedback visuel avec toast et messages d'erreur/succès
 */
