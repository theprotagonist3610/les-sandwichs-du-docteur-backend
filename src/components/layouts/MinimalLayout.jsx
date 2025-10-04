// layouts/MinimalLayout.jsx
/**
 * Layout minimal pour maintenance, landing pages, etc.
 * Très épuré, sans navigation
 */
const MinimalLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header minimal optionnel */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold text-foreground">
            Mon Application
          </h1>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
};

export default MinimalLayout;
