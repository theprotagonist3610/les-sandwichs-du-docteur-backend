import React, { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Notebook,
  NotebookPen,
  Store,
  FileSpreadsheet,
  Verified,
} from "lucide-react";
const DetailsCreation = ({
  createdAt,
  updatedAt,
  vendeur,
  point_de_vente,
  code_commande,
  pointDeVente,
  update,
  change,
}) => {
  const [created, setCreated] = useState(createdAt?.toDate() || new Date());
  const [updated, setUpdated] = useState(updatedAt?.toDate() || new Date());
  const [store, setStore] = useState(
    point_de_vente &&
      pointDeVente.find((el) => el?.id === point_de_vente)?.denomination
  );
  const [type, setType] = useState(code_commande?.split("-")[1] || "");
  const [user, setUser] = useState(JSON.parse(vendeur)?.nom || "");
  return (
    <div className="space-y-4 text-xs">
      {/* Date et heure de creation */}
      <div className="flex place-items-center mb-2">
        <Notebook className="mr-2 h-4 w-4 text-green-500" />
        <span>Commande crée le</span>
        <span className="ml-2 font-semibold">{` ${format(created, "PPP", {
          locale: fr,
        })}`}</span>
      </div>
      {/* Date et heure de mise a jour */}
      <div className="flex place-items-center mb-2">
        <NotebookPen className="mr-2 h-4 w-4  text-blue-500" />
        <span>Commande mise à jour le </span>
        <span className="ml-2 font-semibold">
          {format(updated, "PPP", { locale: fr })}
        </span>
      </div>
      {/* Point de vente */}
      <div className="flex place-items-center mb-2">
        <Store className="mr-2 h-4 w-4 text-[#BA1A1A]" />
        <span className="font-semibold">{store}</span>
      </div>
      {/* Type de commande */}
      <div className="flex place-items-center mb-2">
        <FileSpreadsheet className="mr-2 h-4 w-4 text-[#BA1A1A]" />
        {type === "P" && (
          <>
            <span>Cette commande est</span>
            <span className="font-semibold ml-2">Personnelle</span>
          </>
        )}
        {type === "C" && (
          <>
            <span>Cette commande est un</span>
            <span className="font-semibold ml-2">Cadeau</span>
          </>
        )}
        {type === "G" && (
          <>
            <span>Cette commande est une</span>
            <span className="font-semibold ml-2">Gratification</span>
          </>
        )}
      </div>
      {/* Vendeur */}
      <div className="flex place-items-center mb-2">
        <Verified className="mr-2 h-4 w-4 text-[#BA1A1A]" />
        <span className="ml-2 font-semibold">{user}</span>
      </div>
    </div>
  );
};

export default DetailsCreation;
