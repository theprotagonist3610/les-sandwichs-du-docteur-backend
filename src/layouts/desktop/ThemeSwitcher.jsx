/*
- icones lucide Moon et Sun
- utilise le hook hooks/useThemepour set le theme en ajoutant en effacant la class .dark de la balise <html>
*/
import { Moon, Sun } from "lucide-react";
import useTheme from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";

const ThemeSwitcher = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Changer de thème"
      className="relative">
      <Sun
        className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
        aria-hidden="true"
      />
      <Moon
        className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
        aria-hidden="true"
      />
      <span className="sr-only">{isDark ? "Clair" : "Sombre"}</span>
    </Button>
  );
};

export default ThemeSwitcher;
