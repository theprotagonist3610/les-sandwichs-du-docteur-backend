import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import {
  PhoneCall,
  File,
  User,
  MapPin,
  Wallet,
  MoreHorizontal,
  Bike,
  Clock,
  Percent,
  Sigma,
  HandCoins,
  ShieldUser,
} from "lucide-react";

function generateItemsCommande(commande) {
  let res = [];
  if (commande.nombre_box_poisson) {
    res.push(`${commande.nombre_box_poisson} Box poisson`);
  }
  if (commande.nombre_box_viande) {
    res.push(`${commande.nombre_box_viande} Box viande`);
  }
  if (commande.nombre_sandwich_poisson_unique) {
    res.push(`${commande.nombre_sandwich_poisson_unique} Pain-unique poisson`);
  }
  if (commande.nombre_sandwich_viande_unique) {
    res.push(`${commande.nombre_sandwich_viande_unique} Pain-unique viande`);
  }
  if (commande.nombre_yaourt_banane) {
    res.push(`${commande.nombre_yaourt_banane} yaourt banane`);
  }
  if (commande.nombre_yaourt_mangue) {
    res.push(`${commande.nombre_yaourt_mangue} yaourt mangue`);
  }
  if (commande.nombre_yaourt_nature) {
    res.push(`${commande.nombre_yaourt_nature} yaourt nature`);
  }
  if (commande.nombre_yaourt_banane_unique) {
    res.push(`${commande.nombre_yaourt_banane_unique} CYS banane`);
  }
  if (commande.nombre_yaourt_mangue_unique) {
    res.push(`${commande.nombre_yaourt_mangue_unique} CYS mangue`);
  }
  if (commande.nombre_yaourt_nature_unique) {
    res.push(`${commande.nombre_yaourt_nature_unique} CYS nature`);
  }
  return res;
}
const CommandeCardMobile = ({ commande }) => {
  return (
    <div className="bg-white rounded-xl shadow border p-3 mb-4">
      {/* En-tête : N° Commande + Statut */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b-2">
        <div className="flex items-center">
          <File className="w-4 h-4 mr-1"></File>
          <span className="font-bold text-sm">{commande.code_commande}</span>
        </div>
        <div className="flex items-center">
          <ShieldUser className="w-4 h-4 mr-1" />
          <span className="font-semibold">Audiac</span>
        </div>
        <Badge
          variant={
            commande.statut === "Livrée"
              ? "success"
              : commande.statut === "En cours"
              ? "warning"
              : "secondary"
          }>
          {commande.statut ? "En attente" : "Livree"}
        </Badge>
      </div>

      {/* Client + Téléphone */}
      <div className="flex items-center text-sm font-semibold text-muted-foreground mt-2">
        <User className="w-4 h-4 mr-1" />
        <span className="truncate flex-1">{commande.prenom_client}</span>
        <PhoneCall className="w-4 h-4 mr-1 text-green-500" />
        <span>{commande.telephone}</span>
        <span className="pl-2 pr-2 pb-1 pt-1 ml-2 border-1 rounded-sm bg-green-500 text-xs">
          Appeler
          {/* Appel direct ou whatsapp */}
        </span>
      </div>

      {/* Items de la commande */}
      <p className="text-sm mt-2">
        {generateItemsCommande(commande).map((item, index) => (
          <Badge key={index} className="mb-1 mr-1" variant="secondary">
            {item}
          </Badge>
        ))}
      </p>

      {/* Paiement */}
      <div className="flex items-center text-sm text-muted-foreground mt-2">
        <Wallet className="w-4 h-4 mr-1" />
        <span className="capitalize">{commande.paiement}</span>
      </div>

      {/* Date */}
      <div className="flex items-center text-sm text-muted-foreground mt-2">
        <Clock className="w-4 h-4 mr-1" />
        <span>{format(parseISO(commande.date_livraison), "d MMM HH:mm")}</span>
      </div>

      {/* Adresse + Livreur */}
      <div className="flex items-center text-sm text-muted-foreground mt-1">
        <MapPin className="w-4 h-4 mr-1" />
        <span className="truncate flex-1">{commande.adresse}</span>
        <Bike className="w-4 h-4 mr-1 text-red-950" />
        <span>
          <strong>{commande.livreur}</strong>
          {/* ajouter le cout de la livraison devant */}
        </span>
      </div>

      {/* Prix */}
      <div className="flex items-center text-sm text-muted-foreground mt-1">
        <Sigma className="w-4 h-4 mr-1 text-lime-500" strokeWidth={3} />
        <span className="truncate flex-1">
          {commande.cout ? commande.cout : 2000}
        </span>
        <Percent className="w-4 h-4 mr-1 text-red-500" strokeWidth={3} />
        <span className="truncate flex-1">18.5 %</span>
        <HandCoins className="w-4 h-4 mr-1 text-green-500" strokeWidth={3} />
        <span className="truncate flex-1">1800</span>
      </div>

      {/* Menu contextuel */}
      <div className="flex justify-end mt-2">
        <button
          aria-label="Actions"
          className="p-1 rounded-full hover:bg-gray-100">
          <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};

export default CommandeCardMobile;
