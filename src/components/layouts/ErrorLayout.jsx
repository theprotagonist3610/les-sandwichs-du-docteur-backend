// layouts/ErrorLayout.jsx
/**
 * Layout pour les pages d'erreur
 * Design centré avec retour navigation
 */
const ErrorLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-lg">
        {children}

        {/* Actions communes pour les erreurs */}
        <div className="mt-8 space-x-4">
          <button
            onClick={() => window.history.back()}
            className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity">
            Retour
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity">
            Accueil
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorLayout;
