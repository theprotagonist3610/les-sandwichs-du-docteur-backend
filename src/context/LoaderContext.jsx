// contexts/LoaderContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import Loader from "@/components/loaders/Loader";

// Création du contexte
const LoaderContext = createContext({
  isLoading: false,
  text: "Patientez...",
  showLoader: () => {},
  hideLoader: () => {},
  setText: () => {},
});

/**
 * Provider pour le contexte du loader
 * À placer à la racine de l'application
 */
export const LoaderProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [text, setText] = useState("Patientez...");

  const showLoader = useCallback((newText = "Patientez...") => {
    setText(newText);
    setIsLoading(true);
  }, []);

  const hideLoader = useCallback(() => {
    setIsLoading(false);
  }, []);

  const contextValue = useMemo(
    () => ({
      isLoading,
      text,
      showLoader,
      hideLoader,
      setText,
    }),
    [isLoading, text, showLoader, hideLoader]
  );

  return (
    <LoaderContext.Provider value={contextValue}>
      {children}
      {/* Loader global intégré */}
      <Loader isVisible={isLoading} text={text} />
    </LoaderContext.Provider>
  );
};

/**
 * Hook pour utiliser le contexte du loader
 * Doit être utilisé dans un composant enfant de LoaderProvider
 */
export const useLoader = () => {
  const context = useContext(LoaderContext);

  if (!context) {
    throw new Error("useLoader must be used within a LoaderProvider");
  }

  return context;
};

/**
 * Hook autonome pour gérer un état de loader local
 * Peut être utilisé sans LoaderProvider
 */
export const useLocalLoader = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState);

  const showLoader = useCallback(() => setIsLoading(true), []);
  const hideLoader = useCallback(() => setIsLoading(false), []);
  const toggleLoader = useCallback(() => setIsLoading((prev) => !prev), []);

  return {
    isLoading,
    showLoader,
    hideLoader,
    toggleLoader,
  };
};
