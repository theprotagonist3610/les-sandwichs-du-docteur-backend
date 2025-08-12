import { useState } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
const AdresseLivraison = ({ adresses, adresse, update, change }) => {
  const getAdresse = (add) =>
    adresses.find((el) => el?.id === add)?.quartier || "";
  const [actualAdress, setActualAdress] = useState(adresse || "");
  const [nouvelleAdresse, setNouvelleAdresse] = useState("");
  const [ancienneAdresse, setAncienneAdresse] = useState("");
  return (
    <div>
      <div>
        <Select
          value={actualAdress}
          onValueChange={(val) => {
            setAncienneAdresse(getAdresse(actualAdress));
            setNouvelleAdresse(getAdresse(val));
            setActualAdress(val);
          }}>
          <SelectTrigger className="w-full p-2">
            <SelectValue placeholder="Choisir une adresse" />
          </SelectTrigger>
          <SelectContent className="w-full bg-white">
            {adresses.map((el) => (
              <SelectItem key={el.id} value={el.id}>
                {el.quartier}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="text-xs flex justify-between mt-1">
        {ancienneAdresse && (
          <span className="line-through m-1 p-1 text-red-500 font-semibold">
            {ancienneAdresse}
          </span>
        )}
        {ancienneAdresse && (
          <span className="m-1 p-1 text-blue-500 font-semibold">
            {nouvelleAdresse}
          </span>
        )}
        {ancienneAdresse && (
          <span
            onClick={() => {
              setAncienneAdresse("");
              setNouvelleAdresse("");
              setActualAdress(adresse);
              update({ key: "adresse", val: adresse });
              change(false);
            }}
            className="m-1 p-1 border-black border-1 rounded-md bg-red-200">
            Annuler
          </span>
        )}
        {ancienneAdresse && (
          <span
            onClick={() => {
              update({ key: "adresse", val: nouvelleAdresse });
              toast.message("Modifications", {
                description: `La nouvelle adresse de livraison est ${nouvelleAdresse}`,
              });
              setAncienneAdresse("");
              setNouvelleAdresse("");
              change(true);
            }}
            className="m-1 p-1 border-black border-1 rounded-md bg-green-200">
            Enregistrer
          </span>
        )}
      </div>
    </div>
  );
};

export default AdresseLivraison;
