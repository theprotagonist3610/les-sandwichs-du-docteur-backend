// layouts/AuthLayout.jsx
import useBreakpoint from "@/hooks/useBreakpoint";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * Layout responsive pour les pages d'authentification
 * Version mobile (< 1024px) et desktop (>= 1024px)
 */
const AuthLayout = ({ children }) => {
  const { isMobile, isDesktop } = useBreakpoint();

  // Version Mobile (< 1024px)
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex flex-col min-h-screen">
          {/* Logo en haut */}
          <div className="flex-shrink-0 pt-8 pb-6 px-6">
            <div className="flex justify-center">
              <img
                src="/logo.png"
                alt="Logo Mon Application"
                className="h-24 w-24 object-contain"
              />
            </div>
          </div>

          {/* Contenu principal (children) avec ScrollArea - flexible */}
          <div className="flex-1 px-6">
            <div className="bg-card  h-[60vh] border border-border rounded-lg shadow-sm overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-6">{children}</div>
              </ScrollArea>
            </div>
          </div>

          {/* Footer en bas */}
          <div className="flex-shrink-0 text-center py-6 px-6">
            <p className="text-xs text-muted-foreground">
              © 2025 Mon Application. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Version Desktop (>= 1024px)
  if (isDesktop) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo centré en haut */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img
                src="/logo.png"
                alt="Logo Mon Application"
                className="h-32 w-32 object-contain"
              />
            </div>

            {/* Message de bienvenue */}
            <h1 className="text-3xl font-bold text-foreground mb-3">
              Bienvenue
            </h1>
            <p className="text-muted-foreground">
              Connectez-vous pour accéder à votre espace
            </p>
          </div>

          {/* Contenu principal (children) */}
          <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
            {children}
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              © 2025 Mon Application. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Fallback (ne devrait jamais arriver)
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    </div>
  );
};

export default AuthLayout;
