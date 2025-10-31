/*
 - hook qui permet de recuperer set le theme et enregistre l'actuel theme dans lsd_theme dark ou light
 - permet de set le theme en ajoutant et en retirant .dark a la balise <html> comme le veux tailwind 4.1
 */
import { useState, useEffect } from "react";

const THEME_KEY = "lsd_theme";
const THEMES = {
  LIGHT: "light",
  DARK: "dark",
};

const useTheme = () => {
  const [theme, setThemeState] = useState(() => {
    // Récupérer le thème depuis localStorage ou utiliser "light" par défaut
    const savedTheme = localStorage.getItem(THEME_KEY);
    return savedTheme === THEMES.DARK ? THEMES.DARK : THEMES.LIGHT;
  });

  useEffect(() => {
    const root = document.documentElement;

    // Appliquer ou retirer la classe "dark" sur <html>
    if (theme === THEMES.DARK) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Sauvegarder dans localStorage
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const setTheme = (newTheme) => {
    if (newTheme === THEMES.DARK || newTheme === THEMES.LIGHT) {
      setThemeState(newTheme);
    }
  };

  const toggleTheme = () => {
    setThemeState((prevTheme) =>
      prevTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT
    );
  };

  return {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === THEMES.DARK,
    isLight: theme === THEMES.LIGHT,
  };
};

export default useTheme;
