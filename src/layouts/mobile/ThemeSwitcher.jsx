/*
- icones lucide Moon et Sun
- utilise le hook hooks/useThemepour set le theme en ajoutant en effacant la class .dark de la balise <html>
*/
import { Moon, Sun } from "lucide-react";
import useTheme from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";

const ThemeSwitcher = ({ inNavBar = false }) => {
  const { isDark, toggleTheme } = useTheme();

  // Version NavBar: juste l'icône
  if (inNavBar) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        aria-label="Changer de thème"
        className="relative"
      >
        <Sun
          className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
          aria-hidden="true"
        />
        <Moon
          className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
          aria-hidden="true"
        />
        <span className="sr-only">
          {isDark ? "Passer en mode clair" : "Passer en mode sombre"}
        </span>
      </Button>
    );
  }

  // Version Sidebar: icône + texte
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      aria-label="Changer de thème"
      className="relative w-full justify-start gap-2"
    >
      {isDark ? (
        <>
          <Moon className="h-4 w-4" aria-hidden="true" />
          <span>Mode sombre</span>
        </>
      ) : (
        <>
          <Sun className="h-4 w-4" aria-hidden="true" />
          <span>Mode clair</span>
        </>
      )}
    </Button>
  );
};

export default ThemeSwitcher;
