import React, { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Timestamp } from "firebase/firestore";
import { cn } from "@/lib/utils"; // si tu utilises la fonction cn de shadcn
import { toast } from "sonner";
const DateHeureLivraison = ({ date, heure, update, change }) => {
  const [actual, setACtual] = useState({
    date: date?.toDate?.() || new Date(),
    heure: heure || "",
  });
  const [ancien, setAncien] = useState({});
  const [nouvel, setNouvel] = useState({});
  const handleChange = (element, val) => {
    if (element === "date") {
      setAncien({ ...ancien, date: actual.date });
      setNouvel({ ...nouvel, date: val });
      setACtual({ ...actual, date: val });
    } else {
      setAncien({ ...ancien, heure: actual.heure });
      setNouvel({ ...nouvel, heure: val });
      setACtual({ ...actual, heure: val });
    }
  };
  return (
    <div className="space-y-4">
      {/* Ligne 1 - Date picker */}
      <div className="flex flex-col">
        <label className="text-sm font-medium text-muted-foreground mb-1">
          Date
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !actual?.date && "text-muted-foreground"
              )}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {actual?.date ? (
                format(actual?.date, "PPP")
              ) : (
                <span>Choisir une date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-white" align="start">
            <Calendar
              mode="single"
              selected={actual?.date}
              onSelect={(e) => handleChange("date", e)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <div className="text-xs flex justify-between mt-1">
          {ancien?.date && (
            <span className="line-through m-1 p-1 text-red-500 ">
              {format(ancien?.date, "dd/MM")}
            </span>
          )}
          {ancien?.date && (
            <span className="m-1 p-1 text-blue-500">
              {format(nouvel?.date, "dd/MM")}
            </span>
          )}
          {ancien?.date && (
            <span
              onClick={() => {
                update({ key: "date_livraison", val: date });
                setAncien({ ...ancien, date: "" });
                setNouvel({ ...nouvel, date: "" });
                setACtual({ ...actual, date: date?.toDate?.() || new Date() });
                change(false);
              }}
              className="m-1 p-1 border-black border-1 rounded-md bg-red-200">
              Annuler
            </span>
          )}
          {ancien?.date && (
            <span
              onClick={() => {
                update({
                  key: "date_livraison",
                  val: Timestamp.fromDate(nouvel?.date),
                });
                toast.message("Modifications", {
                  description: `La nouvelle heure de livraison est ${format(
                    nouvel?.date,
                    "PPP",
                    { locale: fr }
                  )}`,
                });
                setAncien({ ...ancien, date: "" });
                setNouvel({ ...nouvel, date: "" });
                change(true);
              }}
              className="m-1 p-1 border-black border-1 rounded-md bg-green-200">
              Enregistrer
            </span>
          )}
        </div>
      </div>

      {/* Ligne 2 - Heure */}
      <div className="flex flex-col">
        <label className="text-sm font-medium text-muted-foreground mb-1">
          Heure
        </label>
        <Input
          type="time"
          value={actual?.heure}
          onChange={(e) => handleChange("heure", e.target.value)}
        />
        <div className="text-xs flex justify-between mt-1">
          {ancien?.heure && (
            <span className="line-through m-1 p-1 text-red-500 ">
              {ancien?.heure}
            </span>
          )}
          {ancien?.heure && (
            <span className="m-1 p-1 text-blue-500">{nouvel?.heure}</span>
          )}
          {ancien?.heure && (
            <span
              onClick={() => {
                update({ key: "heure_livraison", val: heure });
                setAncien({ ...ancien, heure: "" });
                setNouvel({ ...nouvel, heure: "" });
                setACtual({ ...actual, heure: heure });
                change(false);
              }}
              className="m-1 p-1 border-black border-1 rounded-md bg-red-200">
              Annuler
            </span>
          )}
          {ancien?.heure && (
            <span
              onClick={() => {
                update({ key: "heure_livraison", val: nouvel?.heure });
                toast.message("Modifications", {
                  description: `La nouvelle heure de livraison est ${nouvel?.heure}`,
                });
                setAncien({ ...ancien, heure: "" });
                setNouvel({ ...nouvel, heure: "" });
                change(true);
              }}
              className="m-1 p-1 border-black border-1 rounded-md bg-green-200">
              Enregistrer
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default DateHeureLivraison;

// {
//   adresse:"Littoral-Cotonou-Akpakpa",
//   code_commande:"",
//   cout_total:"",
//   date_livraison:"",
//   heure_livraison:"",
//   indication_adresse:"",
//   livreur:"",
//   details_commande:"",
//   paiement:"",
//   client:"",
//   telephone_client:"",
//   numero_client:"",
//   numero_a_livrer:"",
//   prenom_a_livrer:"",
//   type_appel:"",
//   prix_livraison:"",
//   statut_livraison:"",
//   incident_livraison:"",
//   point_de_vente:"",
//   createdAt:"",
//   vendeur:"",
//   paiement:"",
//   moyen_paiement:""
// }
