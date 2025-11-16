/*
C'est un composant de loading qui bloque tout sur toute la page
il occupe le premier plan, il est fixed avec un z index eleve
il apparait en faisant un slide down et disparait en faisant un slide up
toutes les animations sont dirigees avec framer-motion
au centre on a un le logo qui est logo_petit.PNG 394x197 (sa largeur fait 2 fois sa hauteur) dans le dossier public
en dessous du logo, on a un text qui est passe en prop
en dessous totalement on a le copyright de l'entreprise
Ce loader sera importe directement dans le mainLayout et pourra etre declenche en utilisant un hook useFullPageLoader()
*/
import { createContext, useContext, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Context pour gérer le loader globalement
const FullPageLoaderContext = createContext();

export function FullPageLoaderProvider({ children }) {
  const [isVisible, setIsVisible] = useState(false);
  const [text, setText] = useState("Chargement en cours...");

  const showLoader = (customText) => {
    if (customText) setText(customText);
    setIsVisible(true);
  };

  const hideLoader = () => {
    setIsVisible(false);
  };

  return (
    <FullPageLoaderContext.Provider value={{ showLoader, hideLoader }}>
      {children}
      <FullPageLoader isVisible={isVisible} text={text} />
    </FullPageLoaderContext.Provider>
  );
}

// Hook personnalisé pour utiliser le loader
export function useFullPageLoader() {
  const context = useContext(FullPageLoaderContext);
  if (!context) {
    throw new Error(
      "useFullPageLoader doit être utilisé dans un FullPageLoaderProvider"
    );
  }
  return context;
}

// Composant du loader
const FullPageLoader = ({ isVisible, text }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: "-100%" }}
          animate={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-between py-12"
        >
          {/* Conteneur central */}
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            {/* Logo avec animation de pulse */}
            <motion.img
              src="/logo_petit.PNG"
              alt="Logo"
              className="w-[197px] h-auto"
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Texte de chargement */}
            <motion.p
              className="text-lg font-medium text-gray-700"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {text}
            </motion.p>

            {/* Points animés */}
            <div className="flex gap-2">
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  className="w-3 h-3 bg-blue-500 rounded-full"
                  animate={{
                    y: [0, -10, 0],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: index * 0.2,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Copyright en bas */}
          <motion.div
            className="text-sm text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            © {new Date().getFullYear()} Les Sandwichs du Docteur. Tous droits
            réservés.
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FullPageLoader;
