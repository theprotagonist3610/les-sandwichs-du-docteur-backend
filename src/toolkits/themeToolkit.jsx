/**
 * Toolkit de gestion des thèmes pour Tailwind 4.1
 * Gère la classe .dark sur la balise <html>
 */

/**
 * Initialise le thème au chargement de l'application
 * Vérifie dans cet ordre :
 * 1. Préférence sauvegardée dans localStorage
 * 2. Préférence système de l'utilisateur
 * 3. Par défaut : thème clair
 */
export const initTheme = () => {
  // Vérifier si on est côté client
  if (typeof window === "undefined") return;

  const html = document.documentElement;
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  // Logique de décision du thème
  if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
    html.classList.add("dark");
  } else {
    html.classList.remove("dark");
  }
};

/**
 * Bascule entre le thème clair et sombre
 * Sauvegarde automatiquement le choix dans localStorage
 *
 * @returns {string} Le nouveau thème actif ('light' ou 'dark')
 */
export const switchTheme = () => {
  // Vérifier si on est côté client
  if (typeof window === "undefined") return "light";

  const html = document.documentElement;
  const isDark = html.classList.contains("dark");

  if (isDark) {
    // Passer en mode clair
    html.classList.remove("dark");
    localStorage.setItem("theme", "light");
    return "light";
  } else {
    // Passer en mode sombre
    html.classList.add("dark");
    localStorage.setItem("theme", "dark");
    return "dark";
  }
};

/**
 * Vérifie si le thème sombre est actuellement actif
 *
 * @returns {boolean} true si le thème sombre est actif
 */
export const isDarkTheme = () => {
  if (typeof window === "undefined") return false;
  return document.documentElement.classList.contains("dark");
};

/**
 * Définit explicitement un thème
 *
 * @param {'light' | 'dark'} theme - Le thème à appliquer
 */
export const setTheme = (theme) => {
  if (typeof window === "undefined") return;

  const html = document.documentElement;

  if (theme === "dark") {
    html.classList.add("dark");
    localStorage.setItem("theme", "dark");
  } else {
    html.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }
};

/**
 * Écoute les changements de préférences système
 * Utile pour réagir automatiquement quand l'utilisateur change ses préférences OS
 *
 * @param {Function} callback - Fonction appelée lors du changement (reçoit le nouveau thème)
 * @returns {Function} Fonction de nettoyage pour supprimer l'écouteur
 */
export const watchSystemTheme = (callback) => {
  if (typeof window === "undefined") return () => {};

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const handleChange = (e) => {
    const newTheme = e.matches ? "dark" : "light";
    callback(newTheme);
  };

  // Ajouter l'écouteur
  mediaQuery.addEventListener("change", handleChange);

  // Retourner la fonction de nettoyage
  return () => {
    mediaQuery.removeEventListener("change", handleChange);
  };
};
