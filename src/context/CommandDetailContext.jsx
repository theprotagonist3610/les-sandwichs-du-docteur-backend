import { createContext, useContext, useState } from "react";
import {
  useMenus,
  useBoissons,
  useAdressesLivraison,
  useLivreurs,
  useMoyensPaiement,
  usePointDeVente,
} from "@/components/CommandeToolkit";
const CommandeDetailContext = createContext();

export const CommandDetailProvider = ({ children }) => {
  const [modifiedCommand, setModifiedCommand] = useState({});
  const menus = useMenus();
  const boissons = useBoissons();
  const livreurs = useLivreurs();
  const adresses = useAdressesLivraison();
  const moyensPaiement = useMoyensPaiement();
  const pointDeVente = usePointDeVente();
  const updateCommand = ({ key, val }) => {
    setModifiedCommand({ ...modifiedCommand, [key]: val });
  };
  return (
    <CommandeDetailContext.Provider
      value={{
        updateCommand,
        menus,
        boissons,
        livreurs,
        adresses,
        moyensPaiement,
        pointDeVente,
      }}>
      {children}
    </CommandeDetailContext.Provider>
  );
};

export const useCommandDetail = () => useContext(CommandeDetailContext);
