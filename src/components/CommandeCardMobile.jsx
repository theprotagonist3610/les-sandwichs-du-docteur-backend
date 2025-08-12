import { Badge } from "@/components/ui/badge";
import {
  PhoneCall,
  PhoneOutgoing,
  File,
  User,
  MapPin,
  Wallet,
  MoreHorizontal,
  Bike,
  Clock,
  Store,
  Percent,
  Sigma,
  HandCoins,
  ShieldUser,
  CreditCard,
} from "lucide-react";
import { BadgeDual } from "@/components/BadgeDual";
import { useNavigate } from "react-router-dom";
//send link whatsapp, adjust new command fields
const BikeMapIcon = ({ size = 32, className = "" }) => {
  const overlap = size * 0.4; // 20% de chevauchement
  const iconSize = size;

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      style={{ width: size + (iconSize - overlap), height: iconSize }}>
      <MapPin size={iconSize} className="absolute left-0 top-0" />
      <Bike
        size={iconSize}
        className="absolute"
        style={{
          left: iconSize - overlap,
          top: 0,
        }}
      />
    </div>
  );
};
const BikeClockIcon = ({ size = 32, className = "" }) => {
  const overlap = size * 0.3; // 20% de chevauchement
  const iconSize = size;

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      style={{ width: size + (iconSize - overlap), height: iconSize }}>
      <Clock size={iconSize} className="absolute left-0 top-0" />
      <Bike
        size={iconSize}
        className="absolute"
        style={{
          left: iconSize - overlap,
          top: 0,
        }}
      />
    </div>
  );
};
const SigmaBikeIcon = ({ size = 32, className = "" }) => {
  const overlap = size * 0.4; // 20% de chevauchement
  const iconSize = size;

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      style={{ width: size + (iconSize - overlap), height: iconSize }}>
      <Sigma size={iconSize} className="absolute left-0 top-0 text-green-300" />
      <Bike
        size={iconSize}
        className="absolute"
        style={{
          left: iconSize - overlap,
          top: 0,
        }}
      />
    </div>
  );
};
function generateItemsCommande(commande, menus, boissons) {
  let res = [];
  let items = [...menus, ...boissons];
  let cmd = JSON.parse(commande.details_commande);
  let cmde = [];
  cmd.map((el) => {
    cmde.push({ ...items.find((e) => e.id === el.id), quantite: el.quantite });
  });
  cmde.map((el) => {
    if (new RegExp("yaourt").test(el?.denomination?.toLowerCase())) {
      res.push(`${el.quantite} CYS ${el?.denomination}`);
    } else {
      res.push(`${el.quantite} ${el?.denomination}`);
    }
  });
  return res;
}
const StatusBadge = (commande) => {
  if (commande?.statut) {
    return (
      <>
        <Badge
          variant={"outline"}
          className={`${
            commande?.paiement_statut === "paye"
              ? "bg-green-400"
              : commande?.paiement_statut === "partiel"
              ? "bg-blue-400"
              : "bg-red-400"
          } text-white`}>
          {`${commande.paiement_statut
            .charAt(0)
            .toUpperCase()}${commande.paiement_statut.slice(1)}`}
        </Badge>
        <Badge
          variant={"outline"}
          className={`${
            commande?.statut === "non servi" ? "bg-red-400" : "bg-green-400"
          } text-white`}>
          {`${commande.statut.charAt(0).toUpperCase()}${commande.statut.slice(
            1
          )}`}
        </Badge>
      </>
    );
  } else if (commande?.statut_livraison) {
    if (commande?.statut_livraison === "livree") {
      return (
        <>
          <Badge
            variant={"outline"}
            className={`${
              commande?.paiement_statut === "paye"
                ? "bg-green-400"
                : commande?.paiement_statut === "partiel"
                ? "bg-blue-400"
                : "bg-red-400"
            } text-white`}>
            {commande?.paiement_statut.charAt(0).toUpperCase() +
              commande?.paiement_statut.slice(1)}
          </Badge>
          <Badge variant={"outline"} className={`bg-green-400`}>
            {"Livrée"}
          </Badge>
        </>
      );
    } else if (commande?.statut_livraison === "en cours") {
      return (
        <>
          <Badge
            variant={"outline"}
            className={`${
              commande?.paiement_statut === "paye"
                ? "bg-green-400"
                : commande?.paiement_statut === "partiel"
                ? "bg-blue-400"
                : "bg-red-400"
            } text-white`}>
            {commande?.paiement_statut.charAt(0).toUpperCase() +
              commande?.paiement_statut.slice(1)}
          </Badge>
          <Badge variant={"outline"} className={`bg-blue-400`}>
            {"En cours"}
          </Badge>
        </>
      );
    } else {
      return (
        <>
          <Badge
            variant={"outline"}
            className={`${
              commande?.paiement_statut === "paye"
                ? "bg-green-400"
                : commande?.paiement_statut === "partiel"
                ? "bg-blue-400"
                : "bg-red-400"
            } text-white`}>
            {commande?.paiement_statut.charAt(0).toUpperCase() +
              commande?.paiement_statut.slice(1)}
          </Badge>
          <Badge variant={"outline"} className={`bg-red-400 text-white`}>
            {"Non livrée"}
          </Badge>
        </>
      );
    }
  } else {
    return <></>;
  }
};
const Phones = (commande) => {
  //ajouter les fonctions de messages whatsapp
  if (commande?.numero_a_livrer) {
    return (
      <>
        <BadgeDual>
          <PhoneCall className="w-4 h-4 mr-1 text-blue-500" />
          <span>{commande?.telephone_client}</span>
        </BadgeDual>
        <BadgeDual>
          <PhoneOutgoing className="w-4 h-4 mr-1 text-green-500"></PhoneOutgoing>
          <span>{commande?.numero_a_livrer}</span>
        </BadgeDual>
      </>
    );
  } else if (commande?.telephone_client) {
    return (
      <>
        <BadgeDual>
          <PhoneCall className="w-4 h-4 mr-1 text-green-500" />
          <span>{commande?.telephone_client}</span>
        </BadgeDual>
      </>
    );
  } else {
    return <></>;
  }
};
const PaiementBadges = (obj) => {
  return (
    <div className="flex items-center text-sm text-muted-foreground mt-2">
      {obj?.montant_recu > 0 && <Wallet className="w-4 h-4 mr-1" />}
      {obj.montant_recu_especes > 0 && (
        <Badge className="mb-1 mr-1" variant="outline">
          Espèces
        </Badge>
      )}
      {obj?.montant_recu_momo > 0 && (
        <Badge className="mb-1 mr-1" variant="outline">
          Momo
        </Badge>
      )}
    </div>
  );
};
const DetailsCreation = (obj, pointDeVentes) => {
  let pdv =
    pointDeVentes.find((el) => el?.id === obj.point_de_vente)?.denomination ||
    "inconnu";
  return (
    <div className="flex gap-2 justify-evenly text-xs">
      <div>
        <span>{`Créée le ${
          obj?.createdAt?.toDate()?.toLocaleString()?.split(" ")[0]
        } à ${
          obj?.createdAt?.toDate()?.toLocaleString()?.split(" ")[1]
        }`}</span>
      </div>
      <div className="flex gap-2 items-center">
        <Store className="w-4 h-4 mr-1 ml-2" />
        <span>{`${pdv || "inconnu"}`}</span>
      </div>
    </div>
  );
};
const DetailsLivraison = (obj, adresses) => {
  const navigate = useNavigate();
  const adresse =
    adresses.find((el) => el?.id === obj.adresse)?.ville || "inconnu";
  const prix_livraison = JSON.parse(obj?.paiement)
    ? JSON.parse(obj?.paiement)?.prix_livraison
    : null;
  return (
    <div className="flex justify-between text-xs text-muted-foreground mt-1">
      {/*Adresse : la ville seulement*/}
      <div className="flex gap-2 items-center">
        <BikeMapIcon size={16} />
        {/* <MapPin className="w-4 h-4 mr-1" /> */}
        <span>{adresse}</span>
      </div>
      {/*Date et heure de livraison*/}
      <div className="flex gap-2 items-center">
        <BikeClockIcon size={16} />
        <span>{obj?.heure_livraison || "inconnu"}</span>
      </div>
      {/*Livreur + (Prix de livraison)*/}
      {adresse && (
        <div className="flex gap-2 items-center">
          {obj?.livreur && prix_livraison ? (
            <>
              <Bike className="w-4 h-4 mr-1" />
              <span>{`${obj?.livreur} (${prix_livraison})` || "inconnu"}</span>
            </>
          ) : (
            <>
              <Bike className="w-4 h-4 mr-1" />
              <span
                onClick={() => navigate(`/commandes/${obj?.id}?action=livreur`)}
                className="cursor-pointer p-1 border-1 rounded-md bg-blue-200">
                Choisir livreur
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
const DetailsPaiement = (paiement) => {
  return (
    <div className="flex justify-between text-xs text-muted-foreground rounded-md mt-2 p-2 bg-gray-200">
      {/*Cout total de la commande sans livraison*/}
      <div className="flex gap-2 items-center">
        <SigmaBikeIcon size={16} />
        <span className="font-semibold">{paiement?.total + " FCFA"}</span>
      </div>
      {/*Reduction*/}
      {paiement?.reduction_percent > 0 && (
        <div className="flex gap-2 items-center">
          <Percent className="w-4 h-4 mr-1 text-red-500" />
          <span>{paiement?.reduction_percent}</span>
        </div>
      )}
      {/*Montant recu*/}
      {paiement?.montant_recu > 0 && (
        <div className="flex gap-2 items-center">
          <HandCoins className="w-4 h-4 mr-1 text-green-500" />
          <span className="font-semibold">{paiement?.montant_recu}</span>
        </div>
      )}
      {/*Reste a devoir*/}
      {paiement?.dette > 0 && (
        <div className="flex gap-2 items-center">
          <CreditCard className="w-4 h-4 mr-1 text-red-500" />
          <span>{paiement?.dette}</span>
        </div>
      )}
    </div>
  );
};
const CommandeCardMobile = ({
  commande,
  menus,
  boissons,
  adresses,
  pointDeVentes,
}) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-xl shadow border p-3 mb-4">
      {/* En-tête : N° Commande + Statut */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b-2">
        <div className="flex items-center text-xs">
          <span className="font-semibold text-sm">
            {commande.code_commande}
          </span>
        </div>
        <div className="flex items-center text-xs">
          <ShieldUser className="w-4 h-4 mr-1" />
          <span className="font-semibold">
            {JSON.parse(commande?.vendeur)?.nom || "Inconnu"}
          </span>
        </div>
        {StatusBadge(commande)}
      </div>

      {/* Informations de creation de la commande */}
      {DetailsCreation(commande, pointDeVentes)}
      {/* Client + Téléphone */}
      <div className="flex items-center text-sm font-semibold text-muted-foreground mt-2">
        <User className="w-4 h-4 mr-1" />
        <span className="truncate flex-1">{`${
          new RegExp("H").test(commande.code_commande)
            ? "Mr. " + commande.client
            : "Mme. " + commande.client
        }`}</span>
      </div>
      <div className="flex justify-end text-sm font-semibold text-muted-foreground mt-2">
        {Phones(commande)}
      </div>

      {/* Items de la commande */}
      <p className="text-sm mt-2">
        {generateItemsCommande(commande, menus, boissons).map((item, index) => (
          <Badge key={index} className="mb-1 mr-1" variant="secondary">
            {item}
          </Badge>
        ))}
      </p>

      {/* Paiement */}
      {PaiementBadges(JSON.parse(commande?.paiement))}

      {/* Date Adresse + Livreur */}
      {commande?.adresse && DetailsLivraison(commande, adresses)}

      {/* Details du paiement */}
      {DetailsPaiement(JSON.parse(commande?.paiement))}
      {/* Menu contextuel */}
      <div className="flex justify-end mt-2">
        <button
          onClick={() => navigate(`/commandes/${commande?.id}`)}
          aria-label="Actions"
          className="p-1 rounded-full hover:bg-gray-100">
          <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};

export default CommandeCardMobile;
