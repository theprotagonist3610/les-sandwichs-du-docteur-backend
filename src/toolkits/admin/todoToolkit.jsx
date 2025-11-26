/**
 * todoToolkit.jsx
 * Gestion des TODOs avec cache local et synchronisation RTDB
 *
 * Structure RTDB :
 * - todos/liste_todos: array de todos stringifié
 *
 * Durée de vie max d'un TODO : 7 jours
 */

import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import { ref, get, set, onValue, off } from "firebase/database";
import { rtdb, auth } from "@/firebase.js";
import { nanoid } from "nanoid";
import { useUser } from "@/toolkits/global/userToolkit";

// ============================================================================
// CONSTANTES
// ============================================================================

const TODOS_RTDB_PATH = "todos/liste_todos";
const LOCAL_TODOS_KEY = "local_lsd_todos";
const TODO_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 jours en millisecondes

// ============================================================================
// SCHEMAS ZOD
// ============================================================================

/**
 * Enum des rôles possibles
 */
const rolesEnum = z.enum([
  "admin",
  "cuisinier",
  "livreur",
  "vendeur",
  "superviseur",
]);

/**
 * Schema pour un TODO
 */
export const todoSchema = z.object({
  id: z.string().min(1, "L'ID est requis"),
  title: z.string().min(1, "Le titre est requis"),
  concern: z.array(rolesEnum).default([]),
  concernBy: z.array(z.string()).default([]), // Array d'IDs de users
  description: z.string().default(""),
  status: z.boolean().default(false), // false = non complété, true = complété
  deadline: z.number().positive().optional(), // Timestamp de la date butoir (optionnel)
  createdBy: z.string().min(1, "Le créateur est requis"), // ID du user ou "système"
  createdAt: z.number().positive(),
  updatedAt: z.number().positive(),
});

// ============================================================================
// GESTION DU CACHE LOCAL - TODOS
// ============================================================================

/**
 * Sauvegarde les todos dans le LocalStorage
 */
function saveTodosToCache(todos) {
  try {
    const dataToStore = {
      todos,
      lastSync: Date.now(),
    };
    localStorage.setItem(LOCAL_TODOS_KEY, JSON.stringify(dataToStore));
    console.log("✅ TODOs sauvegardés en cache");
    return true;
  } catch (error) {
    console.error("❌ Erreur sauvegarde cache TODOs:", error);
    return false;
  }
}

/**
 * Récupère les todos depuis le LocalStorage
 */
function getTodosFromCache() {
  try {
    const data = localStorage.getItem(LOCAL_TODOS_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data);
    console.log("✅ TODOs récupérés du cache");
    return parsed;
  } catch (error) {
    console.error("❌ Erreur lecture cache TODOs:", error);
    return null;
  }
}

/**
 * Supprime le cache des todos
 */
export function clearTodosCache() {
  localStorage.removeItem(LOCAL_TODOS_KEY);
  console.log("✅ Cache TODOs supprimé");
}

// ============================================================================
// CRUD TODOS
// ============================================================================

/**
 * Récupère tous les todos depuis RTDB
 */
export async function getAllTodos() {
  try {
    const todosRef = ref(rtdb, TODOS_RTDB_PATH);
    const snapshot = await get(todosRef);

    if (!snapshot.exists()) {
      console.log("ℹ️ Aucun TODO trouvé");
      return [];
    }

    const todosJson = snapshot.val();
    const todos = todosJson ? JSON.parse(todosJson) : [];

    // Sauvegarder dans le cache
    saveTodosToCache(todos);

    console.log(`✅ ${todos.length} TODOs récupérés`);
    return todos;
  } catch (error) {
    console.error("❌ Erreur récupération TODOs:", error);
    throw error;
  }
}

/**
 * Crée un nouveau TODO
 * @param {Object} todoData - Données du todo
 * @param {string} todoData.title - Titre du todo (requis)
 * @param {string[]} todoData.concern - Rôles concernés
 * @param {string[]} todoData.concernBy - IDs des users concernés
 * @param {string} todoData.description - Description
 * @param {number} todoData.deadline - Timestamp de la deadline
 * @param {string} todoData.createdBy - ID du créateur ou "système" (requis)
 */
export async function createTodo(todoData) {
  try {
    if (!todoData.createdBy) {
      throw new Error("createdBy est requis pour créer un TODO");
    }

    const newTodo = {
      id: `todo_${nanoid()}`,
      title: todoData.title,
      concern: todoData.concern || [],
      concernBy: todoData.concernBy || [],
      description: todoData.description || "",
      status: false,
      deadline: todoData.deadline || undefined,
      createdBy: todoData.createdBy,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Validation
    const validatedTodo = todoSchema.parse(newTodo);

    // Récupérer la liste actuelle
    const currentTodos = await getAllTodos();

    // Ajouter le nouveau todo
    const updatedTodos = [...currentTodos, validatedTodo];

    // Sauvegarder dans RTDB
    const todosRef = ref(rtdb, TODOS_RTDB_PATH);
    await set(todosRef, JSON.stringify(updatedTodos));

    // Mettre à jour le cache
    saveTodosToCache(updatedTodos);

    console.log("✅ TODO créé:", validatedTodo.id);
    return validatedTodo;
  } catch (error) {
    console.error("❌ Erreur création TODO:", error);
    throw error;
  }
}

/**
 * Met à jour un TODO
 */
export async function updateTodo(todoId, updateData) {
  try {
    // Récupérer la liste actuelle
    const currentTodos = await getAllTodos();

    // Trouver le todo
    const todoIndex = currentTodos.findIndex((todo) => todo.id === todoId);

    if (todoIndex === -1) {
      throw new Error(`TODO ${todoId} introuvable`);
    }

    // Mettre à jour
    const updatedTodo = {
      ...currentTodos[todoIndex],
      ...updateData,
      updatedAt: Date.now(),
    };

    // Validation
    const validatedTodo = todoSchema.parse(updatedTodo);

    // Remplacer dans la liste
    currentTodos[todoIndex] = validatedTodo;

    // Sauvegarder dans RTDB
    const todosRef = ref(rtdb, TODOS_RTDB_PATH);
    await set(todosRef, JSON.stringify(currentTodos));

    // Mettre à jour le cache
    saveTodosToCache(currentTodos);

    console.log("✅ TODO mis à jour:", todoId);
    return validatedTodo;
  } catch (error) {
    console.error("❌ Erreur mise à jour TODO:", error);
    throw error;
  }
}

/**
 * Supprime un TODO
 */
export async function deleteTodo(todoId) {
  try {
    // Récupérer la liste actuelle
    const currentTodos = await getAllTodos();

    // Filtrer pour supprimer le todo
    const updatedTodos = currentTodos.filter((todo) => todo.id !== todoId);

    // Sauvegarder dans RTDB
    const todosRef = ref(rtdb, TODOS_RTDB_PATH);
    await set(todosRef, JSON.stringify(updatedTodos));

    // Mettre à jour le cache
    saveTodosToCache(updatedTodos);

    console.log("✅ TODO supprimé:", todoId);
    return { success: true, message: "TODO supprimé" };
  } catch (error) {
    console.error("❌ Erreur suppression TODO:", error);
    throw error;
  }
}

/**
 * Nettoie les todos obsolètes (plus de 7 jours)
 */
export async function cleanTodos() {
  try {
    const currentTodos = await getAllTodos();
    const now = Date.now();

    // Filtrer les  todos de moins de 7 jours
    const validTodos = currentTodos.filter((todo) => {
      const age = now - todo.createdAt;
      return age < TODO_MAX_AGE;
    });

    const removedCount = currentTodos.length - validTodos.length;

    if (removedCount > 0) {
      // Sauvegarder dans RTDB
      const todosRef = ref(rtdb, TODOS_RTDB_PATH);
      await set(todosRef, JSON.stringify(validTodos));

      // Mettre à jour le cache
      saveTodosToCache(validTodos);

      console.log(`✅ ${removedCount} TODOs obsolètes supprimés`);
    }

    return {
      success: true,
      message: `${removedCount} TODOs obsolètes supprimés`,
    };
  } catch (error) {
    console.error("❌ Erreur nettoyage TODOs:", error);
    throw error;
  }
}

// ============================================================================
// HOOK PRINCIPAL - useTodos
// ============================================================================

/**
 * Hook principal pour gérer les TODOs
 * Charge depuis le cache, synchronise avec RTDB, et filtre selon le user
 * Les ADMIN voient tous les tous
 */
export function useTodos() {
  const [todos, setTodos] = useState([]);
  const [allTodos, setAllTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Utiliser le hook useUser pour obtenir l'utilisateur courant
  const { user: currentUser } = useUser();

  // ============================================================================
  // CHARGEMENT INITIAL
  // ============================================================================
  const loadTodos = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Charger depuis le cache
      const cachedData = getTodosFromCache();
      if (cachedData?.todos) {
        setAllTodos(cachedData.todos);
        console.log(
          "✅ TODOs chargés depuis le cache",
          cachedData.todos.length
        );
      }

      // 2. Charger depuis RTDB
      const rtdbTodos = await getAllTodos();
      setAllTodos(rtdbTodos);

      setLoading(false);
    } catch (err) {
      console.error("❌ Erreur loadTodos:", err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  // ============================================================================
  // SYNC TEMPS RÉEL
  // ============================================================================
  useEffect(() => {
    loadTodos();

    // Écouter les changements RTDB
    const todosRef = ref(rtdb, TODOS_RTDB_PATH);
    const unsubscribe = onValue(
      todosRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const todosJson = snapshot.val();
          const todos = todosJson ? JSON.parse(todosJson) : [];
          setAllTodos(todos);
          saveTodosToCache(todos);
          console.log("🔄 TODOs mis à jour depuis RTDB", todos.length);
        } else {
          setAllTodos([]);
          saveTodosToCache([]);
        }
      },
      (error) => {
        console.error("❌ Erreur listener RTDB:", error);
      }
    );

    return () => off(todosRef, "value", unsubscribe);
  }, [loadTodos]);

  // ============================================================================
  // FILTRAGE PAR USER
  // ============================================================================
  useEffect(() => {
    if (!currentUser) {
      setTodos([]);
      return;
    }

    // ADMIN : Voir tous les TODOs sans filtrage
    if (currentUser.role === "admin") {
      const sortedTodos = allTodos.sort((a, b) => b.createdAt - a.createdAt);
      setTodos(sortedTodos);
      console.log("✅ Admin : affichage de tous les TODOs", sortedTodos.length);
      return;
    }

    // AUTRES ROLES : Filtrage normal
    const filteredTodos = allTodos.filter((todo) => {
      // 1. Si concern et concernBy sont vides → visible par tous
      if (todo.concern.length === 0 && todo.concernBy.length === 0) {
        return true;
      }

      // 2. Filtrage par rôle (concern)
      if (todo.concern.includes(currentUser.role)) {
        return true;
      }

      // 3. Filtrage par ID utilisateur (concernBy)
      if (todo.concernBy.includes(currentUser.id)) {
        return true;
      }

      return false;
    });

    // Trier par date de création (plus récent en premier)
    const sortedTodos = filteredTodos.sort((a, b) => b.createdAt - a.createdAt);

    setTodos(sortedTodos);
  }, [allTodos, currentUser]);

  return {
    todos,
    allTodos,
    loading,
    error,
    currentUser,
    refreshTodos: loadTodos,
    createTodo,
    updateTodo,
    deleteTodo,
    cleanTodos,
  };
}
