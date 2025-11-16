import useBreakpoint from "@/hooks/useBreakpoint";
import MobileCreateAdresse from "./mobile/MobileCreateAdresse";
import DesktopCreateAdresse from "./desktop/DesktopCreateAdresse";
const CreateAdresse = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileCreateAdresse /> : <DesktopCreateAdresse />;
};

export default CreateAdresse;
/*
- mobile 
  * un store zustand en fonction du schema des adresse, chaque element du store est consomme par un champ unique pour eviter les rerendues inutiles
  * un formulaire verticale bien aere
  * utilise le composant ui/input-group pour le rendu des champs du formulaire
  * les champs pour les coordonnes longitude et latitude seront inclus dans une card avec un bouton "Position actuelle" qui utilise l'API de navigation du navigateur pour detecter longitude et latitude automatiquement
  * une zone erreur pour afficher les erreurs s'il y en a et surtout s'il existe un doublon. La recherche des doublons ne doit pas etre stricte, il faut voir les approximations egalement
- desktop
  meme chose que la version mobile mais avec un formulaire plus aere et des cards 


- specificite 
 * icone lucide-react pour une iconographie riche 
 * framer-motion pour les animations d'entree et de sortie 
 * ui/input group pour tous les champs de saisies 
 * feedback user bien construis
*/
