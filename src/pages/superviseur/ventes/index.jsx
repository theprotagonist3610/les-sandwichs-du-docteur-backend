// components/Ventes.jsx
import { NavLink } from "react-router-dom";
import useBreakpoint from "@/hooks/useBreakpoint";
/**
 * Composant de carte pour les actions de ventes
 */
const VentesCard = ({ imageSrc, title, navigateTo, className = "" }) => {
  return (
    <NavLink
      to={navigateTo}
      className={`
        group block p-3 bg-card border border-border rounded-lg shadow-sm
        hover:shadow-md hover:border-primary/20 transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        ${className}
      `}>
      <div className="flex flex-col items-center space-y-4">
        {/* Container pour l'image avec effet hover */}
        <div className="w-24 h-24 flex items-center justify-center bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors duration-200">
          <img
            src={imageSrc}
            alt={title}
            className="w-24 h-24 object-contain opacity-80 group-hover:opacity-100 transition-opacity duration-200"
          />
        </div>

        {/* Titre */}
        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-200 text-center">
          {title}
        </h3>

        {/* Indicateur visuel subtil */}
        <div className="w-0 h-0.5 bg-primary group-hover:w-12 transition-all duration-300"></div>
      </div>
    </NavLink>
  );
};

/**
 * Composant principal Ventes avec versions mobile/desktop
 */
const Ventes = () => {
  const { isMobile, isDesktop } = useBreakpoint();

  // Configuration des cartes
  const ventesCards = [
    {
      id: "panneau-vente",
      imageSrc: "/sell.svg",
      title: "Panneau de vente",
      navigateTo: `/superviseur/ventes/panneau_de_vente/`,
    },
    {
      id: "commandes",
      imageSrc: "/list.svg",
      title: "Commandes",
      navigateTo: "/superviseur/ventes/commandes/",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Espace Ventes
        </h1>
        <p className="text-muted-foreground">Gérez vos ventes et commandes</p>
      </div>

      {/* Version Mobile - Cartes verticales */}
      {isMobile && (
        <div className="space-y-6">
          {ventesCards.map((card) => (
            <VentesCard
              key={card.id}
              imageSrc={card.imageSrc}
              title={card.title}
              navigateTo={card.navigateTo}
              className="w-full"
            />
          ))}
        </div>
      )}

      {/* Version Desktop - Cartes horizontales */}
      {isDesktop && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {ventesCards.map((card) => (
            <VentesCard
              key={card.id}
              imageSrc={card.imageSrc}
              title={card.title}
              navigateTo={card.navigateTo}
              className="min-h-[200px] flex items-center justify-center"
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Ventes;

// Version alternative avec plus d'options de customisation
export const VentesAdvanced = ({
  title = "Espace Ventes",
  subtitle = "Gérez vos ventes et commandes",
  cards = [
    {
      id: "panneau-vente",
      imageSrc: "/sell.svg",
      title: "Panneau de vente",
      navigateTo: "/panneau_de_vente",
      description: "Interface de vente rapide",
    },
    {
      id: "commandes",
      imageSrc: "/list.svg",
      title: "Commandes",
      navigateTo: "/commandes",
      description: "Suivi des commandes",
    },
  ],
  breakpoint = 1024,
}) => {
  const { isMobile, isDesktop } = useBreakpoint(breakpoint);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête personnalisable */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>

      {/* Layout responsive */}
      <div
        className={`
        ${
          isMobile
            ? "space-y-6"
            : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
        }
      `}>
        {cards.map((card) => (
          <NavLink
            key={card.id}
            to={card.navigateTo}
            className={`
              group block p-6 bg-card border border-border rounded-xl shadow-sm
              hover:shadow-lg hover:border-primary/30 hover:-translate-y-1
              transition-all duration-300 ease-out
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
              ${isMobile ? "w-full" : "min-h-[220px]"}
            `}>
            <div className="flex flex-col items-center space-y-4 h-full justify-center">
              {/* Icône avec animation */}
              <div className="w-20 h-20 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20 rounded-2xl group-hover:from-primary/20 group-hover:to-primary/30 transition-all duration-300 group-hover:rotate-3">
                <img
                  src={card.imageSrc}
                  alt={card.title}
                  className="w-10 h-10 object-contain opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
                />
              </div>

              {/* Contenu */}
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors duration-200">
                  {card.title}
                </h3>
                {card.description && (
                  <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                    {card.description}
                  </p>
                )}
              </div>

              {/* Flèche indicative */}
              <div className="mt-auto pt-4">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </NavLink>
        ))}
      </div>
    </div>
  );
};
