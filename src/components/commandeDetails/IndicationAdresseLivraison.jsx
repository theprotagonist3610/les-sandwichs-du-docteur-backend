import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
const IndicationAdresseLivraison = ({ indication, update, change }) => {
  const [actual, setACtual] = useState(indication || "");
  const [ancien, setAncien] = useState("");
  const [nouvel, setNouvel] = useState("");
  const handleChange = (e) => {
    setAncien(actual);
    setACtual(e.target.value);
    setNouvel(e.target.value);
  };
  return (
    <div>
      <Textarea value={actual} onChange={handleChange} />
      {ancien && (
        <p className="line-through m-1 p-1 text-red-500 font-semibold text-xs">
          {indication}
        </p>
      )}
      <div className="flex justify-end text-xs mt-1">
        {ancien && (
          <span
            onClick={() => {
              setAncien("");
              setNouvel("");
              setACtual(indication || "");
              update({ key: "indication_adresse", val: indication });
            }}
            className="m-1 p-1 border-black border-1 rounded-md bg-red-200">
            Annuler
          </span>
        )}
        {ancien && (
          <span
            onClick={() => {
              update({ key: "indication_adresse", val: nouvel });
              toast.message("Precision du lieu de livraison", {
                description: `${nouvel}`,
              });
              setAncien("");
              setNouvel("");
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

export default IndicationAdresseLivraison;
