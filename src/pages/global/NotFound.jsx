import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center space-y-6 max-w-md">
        {/* Logo */}
        <img
          src="/logo_petit.PNG"
          alt="Les Sandwichs du Docteur"
          className="w-48 h-auto mx-auto mb-8"
        />

        {/* 404 */}
        <div className="space-y-2">
          <h1 className="text-9xl font-bold text-primary">404</h1>
          <h2 className="text-3xl font-semibold text-foreground">
            Page non trouvée
          </h2>
          <p className="text-muted-foreground">
            Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button asChild variant="default">
            <Link to="/" className="flex items-center gap-2">
              <Home size={18} />
              Retour à l'accueil
            </Link>
          </Button>
          <Button asChild variant="outline" onClick={() => window.history.back()}>
            <span className="flex items-center gap-2 cursor-pointer">
              <ArrowLeft size={18} />
              Page précédente
            </span>
          </Button>
        </div>

        {/* Copyright */}
        <p className="text-sm text-muted-foreground pt-8">
          © {new Date().getFullYear()} Les Sandwichs du Docteur
        </p>
      </div>
    </div>
  );
};

export default NotFound;