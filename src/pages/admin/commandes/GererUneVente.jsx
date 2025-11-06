import useBreakpoint from "@/hooks/useBreakpoint";
import MobileGererUneVente from "./mobile/MobileGererUneVente";
import DesktopGererUneVente from "./desktop/DesktopGererUneVente";

const GererUneVente = () => {
  const { mobile } = useBreakpoint();
  return mobile ? <MobileGererUneVente /> : <DesktopGererUneVente />;
};

export default GererUneVente;
/*
 - mobile
  1. 4 cards dans un alignement vertical [Details de creation(code, date,  heure, emplacement, vendeur, type) | Details de la commande (tableau [denomination | quantite | total ]) | Details de paiement | Details de service/livraison ]
  2. concernant la premiere card  
   2.1. le code est clairement inscrit dans le coin superieur gauche
   2.2. le nom du vendeur est ecrit (recupere le nom du vendeur a travers son id)
   2.3. le type de la commande est represente par un badge
  3. concernant la card des details de la commande, utiliser un tableau avec un total pour chaque ligne et un total global a la fin
  4. concernant les details du paiement faire une liste total, reduction, livraison (si cmde a livrer), total avec livraison, especes recu, momo recu, total recu, dette 
  5. la derniere card sert a cloturer ou non la commande (Confirmer commande servie | Confirmer commande livree) selon le type de la commande

 - desktop
  une disposition en 3 colonnes. On reutilise les memes cards que sur mobile
  la card details de creation et de cloture de commande sont dans la colonne de gauche, details de la commande au centre et details de paiement a droite
 
  - specificite
   1. lucide-react pour une iconographie riche
   2. framer-motion pour les animations d'entree et de sorties
   3. lit bien commandeToolkit, menuToolkit et boissonToolkit pour implementer les fonctionnalites
   4. les champs suivant sont editables 
   5. utiliser un store zustand useEditCommande pour l'edition des champs (emplacement (champs type select), vendeur (champs type select), type (champs type select), details de paiement, details de service/livraison)
   6. au niveau du tableau de details des commandes, ajouter une entete qui permet d'ajouter de nouvelles lignes d'articles au tableau via un dialog et la possibilite d'editer/supprimer les lignes existantes 
*/
