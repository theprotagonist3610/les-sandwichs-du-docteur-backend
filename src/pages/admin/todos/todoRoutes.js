/**
 * Configuration des sous-routes de Settings
 * Ces routes seront intégrées dans adminRoutes
 *
 * Pour ajouter un composant à une route :
 * 1. Créez le composant dans pages/admin/Settings/{nom}.jsx
 * 2. Importez-le en haut de ce fichier
 * 3. Remplacez `component: null` par `component: YourComponent`
 *
 * Pour ajouter des sous-routes (ex: users/create) :
 * Ajoutez un tableau `children` avec la même structure
 */

// Import des composants pour chaque section
import CreateTodo from "@/pages/admin/todos/CreateTodo";
import UpdateTodo from "@/pages/admin/todos/UpdateTodo";

export const todoSubRoutes = [
  {
    path: "create",
    nom: "Créer une tâche à accomplir",
    description: "Créer une tâche à accomplir",
    url: "/users.svg",
    component: CreateTodo, // ✅ Composant activé
  },
  {
    path: "update/:todoId",
    nom: "Modifier une tâche",
    description: "Modifier une tâche",
    url: "/users.svg",
    component: UpdateTodo, // ✅ Composant activé
  },
];

export default todoSubRoutes;
