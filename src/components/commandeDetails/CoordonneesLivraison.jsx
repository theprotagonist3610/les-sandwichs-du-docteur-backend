import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const CoordonneesLivraison = ({
  numeroClient,
  prenomLivraison,
  numeroLivraison,
  typeNumeroClient,
  typeNumeroLivraison,
  update,
  change,
}) => {
  const [actual, setActual] = useState({
    numeroClient: numeroClient,
    numeroLivraison: numeroLivraison,
    prenomLivraison: prenomLivraison,
    typeNumeroClient: typeNumeroClient,
    typeNumeroLivraison: typeNumeroLivraison || "direct",
  });
  const [ancien, setAncien] = useState({});
  const [nouvel, setNouvel] = useState({});
  const errorText =
    "C'est un numero de téléphone, saisissez uniquement des chiffres";
  const tooLongNumber = "Un numero de téléphone ne peut avoir que 10 chiffres";
  const [longError, setLongError] = useState({
    numeroClient: false,
    numeroLivraison: false,
  });
  const [entryError, setEntryError] = useState({
    numeroClient: false,
    numeroLivraison: false,
  });

  const handleChange = (element, val) => {
    if (element === "numeroClient") {
      setAncien({ ...ancien, numeroClient: actual.numeroClient });
      setNouvel({ ...nouvel, numeroClient: val });
      setActual({ ...actual, numeroClient: val });
    } else if (element === "numeroLivraison") {
      setAncien({ ...ancien, numeroLivraison: actual.numeroLivraison });
      setNouvel({ ...nouvel, numeroLivraison: val });
      setActual({ ...actual, numeroLivraison: val });
    } else if (element === "typeNumeroClient") {
      setAncien({ ...ancien, typeNumeroClient: actual.typeNumeroClient });
      setNouvel({ ...nouvel, typeNumeroClient: val });
      setActual({ ...actual, typeNumeroClient: val });
    } else if (element === "typeNumeroLivraison") {
      setAncien({ ...ancien, typeNumeroLivraison: actual.typeNumeroLivraison });
      setNouvel({ ...nouvel, typeNumeroLivraison: val });
      setActual({ ...actual, typeNumeroLivraison: val });
    } else {
      setAncien({ ...ancien, prenomLivraison: actual.prenomLivraison });
      setNouvel({ ...nouvel, prenomLivraison: val });
      setActual({ ...actual, prenomLivraison: val });
    }
  };
  return (
    <div className="space-y-4">
      {/* Numero du Client */}
      <div className="mb-2">
        <Label>Numéro du client</Label>
        <Input
          className="mt-1"
          inputMode="numeric"
          type="text"
          value={actual?.numeroClient}
          onChange={(e) => {
            if (/[a-zA-Z]/.test(e.target.value)) {
              setEntryError({
                ...entryError,
                numeroClient: true,
              });
              const timeout = setTimeout(() => {
                setEntryError({
                  ...entryError,
                  numeroClient: false,
                });
                clearTimeout(timeout);
              }, 5000);
            } else if (e.target.value.length > 10) {
              setLongError({
                ...longError,
                numeroClient: true,
              });
              const timeout = setTimeout(() => {
                setLongError({
                  ...longError,
                  numeroClient: false,
                });
                clearTimeout(timeout);
              }, 5000);
            } else {
              handleChange("numeroClient", e.target.value);
            }
          }}
        />
        <AnimatePresence mode="wait">
          {entryError?.numeroClient && (
            <motion.p
              key="err-client"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="p-2 italic text-xs text-red-500">
              {errorText}
            </motion.p>
          )}
          {longError?.numeroClient && (
            <motion.p
              key="long-err-client"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="p-2 italic text-xs text-red-500">
              {tooLongNumber}
            </motion.p>
          )}
        </AnimatePresence>
        <div className="text-xs flex justify-between mt-1">
          {ancien?.numeroClient && (
            <span className="line-through m-1 p-1 text-red-500">
              {numeroClient}
            </span>
          )}
          {ancien?.numeroClient && (
            <span
              onClick={() => {
                update({ key: "telephone_client", val: numeroClient });
                setAncien({});
                setNouvel({});
                setActual({ ...actual, numeroClient: numeroClient });
                change(false);
              }}
              className="m-1 p-1 border-black border-1 rounded-md bg-red-200">
              Annuler
            </span>
          )}
          {ancien?.numeroClient && (
            <span
              onClick={() => {
                update({ key: "telephone_client", val: nouvel?.numeroClient });
                toast.message("Modifications", {
                  description: `Le nouveau numero du client est ${nouvel?.numeroClient}`,
                });
                setAncien({});
                setNouvel({});
                change(true);
              }}
              className="m-1 p-1 border-black border-1 rounded-md bg-green-200">
              Enregistrer
            </span>
          )}
        </div>
      </div>
      {/* Type du Numero du Client */}
      <div className="mb-2">
        <Label>Type numéro du client</Label>
        <div className="mt-2 flex justify-evenly">
          <div
            onClick={() => handleChange("typeNumeroClient", "direct")}
            className={`p-2 rounded-md border-2 ${
              actual.typeNumeroClient === "direct"
                ? "bg-[#BA1A1A]"
                : "bg-[#FFC67A]"
            }`}>
            Direct
          </div>
          <div
            onClick={() => handleChange("typeNumeroClient", "whatsapp")} //here i am
            className={`p-2 rounded-md border-2 ${
              actual.typeNumeroClient === "whatsapp"
                ? "bg-[#BA1A1A]"
                : "bg-[#FFC67A]"
            }`}>
            Whatsapp
          </div>
        </div>
        <div className="text-xs mt-1 flex justify-end">
          {ancien?.typeNumeroClient && (
            <span
              onClick={() => {
                update({ key: "type_appel", val: typeNumeroClient });
                setAncien({ ...ancien, typeNumeroClient: "" });
                setNouvel({ ...nouvel, typeNumeroClient: "" });
                setActual({ ...actual, typeNumeroClient: typeNumeroClient });
                change(false);
              }}
              className="m-1 p-1 border-black border-1 rounded-md bg-red-200">
              Annuler
            </span>
          )}
          {ancien?.typeNumeroClient && (
            <span
              onClick={() => {
                update({ key: "type_appel", val: nouvel?.typeNumeroClient });
                toast.message("Modifications", {
                  description: `Le numero du client est en appel ${nouvel?.typeNumeroClient}`,
                });
                setAncien({ ...ancien, typeNumeroClient: "" });
                setNouvel({ ...nouvel, typeNumeroClient: "" });
                change(true);
              }}
              className="m-1 p-1 border-black border-1 rounded-md bg-green-200">
              Enregistrer
            </span>
          )}
        </div>
      </div>
      {/* Identite de la personne a livrer */}
      <div className="mb-2">
        <Label>Identité de la personne à livrer</Label>
        <Input
          className="mt-1"
          type="text"
          value={actual?.prenomLivraison}
          onChange={(e) => handleChange("prenomLivraison", e.target.value)}
        />
        <div className="text-xs flex justify-between mt-1">
          {ancien?.prenomLivraison && (
            <span className="line-through m-1 p-1 text-red-500">
              {prenomLivraison}
            </span>
          )}
          {ancien?.prenomLivraison && (
            <span
              onClick={() => {
                update({ key: "telephone_client", val: prenomLivraison });
                setAncien({});
                setNouvel({});
                setActual({ ...actual, prenomLivraison: prenomLivraison });
                change(false);
              }}
              className="m-1 p-1 border-black border-1 rounded-md bg-red-200">
              Annuler
            </span>
          )}
          {ancien?.prenomLivraison && (
            <span
              onClick={() => {
                update({
                  key: "prenom_a_livrer",
                  val: nouvel?.prenomLivraison,
                });
                toast.message("Modifications", {
                  description: `La personne à livrer est ${nouvel?.prenomLivraison}`,
                });
                setAncien({});
                setNouvel({});
                change(true);
              }}
              className="m-1 p-1 border-black border-1 rounded-md bg-green-200">
              Enregistrer
            </span>
          )}
        </div>
      </div>
      {/* Numero de la personne a livrer */}
      <div className="mb-2">
        <Label>Numéro de la personne à livrer</Label>
        <Input
          className="mt-1"
          inputMode="numeric"
          type="text"
          value={actual?.numeroLivraison}
          onChange={(e) => {
            if (/[a-zA-Z]/.test(e.target.value)) {
              setEntryError({
                ...entryError,
                numeroLivraison: true,
              });
              const timeout = setTimeout(() => {
                setEntryError({
                  ...entryError,
                  numeroLivraison: false,
                });
                clearTimeout(timeout);
              }, 5000);
            } else if (e.target.value.length > 10) {
              setLongError({
                ...longError,
                numeroLivraison: true,
              });
              const timeout = setTimeout(() => {
                setLongError({
                  ...longError,
                  numeroLivraison: false,
                });
                clearTimeout(timeout);
              }, 5000);
            } else {
              handleChange("numeroLivraison", e.target.value);
            }
          }}
        />
        <AnimatePresence mode="wait">
          {entryError?.numeroLivraison && (
            <motion.p
              key="err-livraison"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="p-2 italic text-xs text-red-500">
              {errorText}
            </motion.p>
          )}
          {longError?.numeroLivraison && (
            <motion.p
              key="long-err-livraison"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="p-2 italic text-xs text-red-500">
              {tooLongNumber}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="text-xs flex justify-between mt-1">
          {ancien?.numeroLivraison && (
            <span className="line-through m-1 p-1 text-red-500">
              {numeroLivraison}
            </span>
          )}
          {ancien?.numeroLivraison && (
            <span
              onClick={() => {
                update({ key: "telephone_client", val: numeroLivraison });
                setAncien({});
                setNouvel({});
                setActual({ ...actual, numeroLivraison: numeroLivraison });
                change(false);
              }}
              className="m-1 p-1 border-black border-1 rounded-md bg-red-200">
              Annuler
            </span>
          )}
          {ancien?.numeroLivraison && (
            <span
              onClick={() => {
                update({
                  key: "numero_a_livrer",
                  val: nouvel?.numeroLivraison,
                });
                toast.message("Modifications", {
                  description: `La personne à livrer est ${nouvel?.numeroLivraison}`,
                });
                setAncien({});
                setNouvel({});
                change(true);
              }}
              className="m-1 p-1 border-black border-1 rounded-md bg-green-200">
              Enregistrer
            </span>
          )}
        </div>
      </div>
      {/* Type du Numero de la personne a livrer */}
      <div className="mb-2">
        <Label>Type numéro de la personne à livrer</Label>
        <div className="mt-2 flex justify-evenly">
          <div
            onClick={() => handleChange("typeNumeroLivraison", "direct")}
            className={`p-2 rounded-md border-2 ${
              actual?.typeNumeroLivraison === "direct"
                ? "bg-[#BA1A1A]"
                : "bg-[#FFC67A]"
            }`}>
            Direct
          </div>
          <div
            onClick={() => handleChange("typeNumeroLivraison", "whatsapp")}
            className={`p-2 rounded-md border-2 ${
              actual?.typeNumeroLivraison === "whatsapp"
                ? "bg-[#BA1A1A]"
                : "bg-[#FFC67A]"
            }`}>
            Whatsapp
          </div>
        </div>
        <div className="text-xs mt-1 flex justify-end">
          {ancien?.typeNumeroLivraison && (
            <span
              onClick={() => {
                update({
                  key: "type_appel_livraison",
                  val: typeNumeroLivraison || "direct",
                });
                setAncien({ ...ancien, typeNumeroLivraison: "" });
                setNouvel({ ...nouvel, typeNumeroLivraison: "" });
                setActual({
                  ...actual,
                  typeNumeroLivraison: typeNumeroLivraison,
                });
                change(false);
              }}
              className="m-1 p-1 border-black border-1 rounded-md bg-red-200">
              Annuler
            </span>
          )}
          {ancien?.typeNumeroLivraison && (
            <span
              onClick={() => {
                update({
                  key: "type_appel_livraison",
                  val: nouvel?.typeNumeroLivraison,
                });
                toast.message("Modifications", {
                  description: `Le numero du client est en appel ${nouvel?.typeNumeroLivraison}`,
                });
                setAncien({ ...ancien, typeNumeroLivraison: "" });
                setNouvel({ ...nouvel, typeNumeroLivraison: "" });
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

export default CoordonneesLivraison;
