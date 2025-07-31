import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import HeaderNav from "@/components/HeaderNav";
import { toast } from "sonner";
import {
  Sandwich,
  Fish,
  Drumstick,
  FlaskConical,
  CupSoda,
  Box,
  Edit,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Loader2,
  Soup,
  X,
} from "lucide-react";
import { motion } from "framer-motion";

const iconeMap = {
  Sandwich,
  Poisson: Fish,
  Poulet: Drumstick,
  Yaourt: FlaskConical,
  Soda: CupSoda,
  Box,
};

export default function MenuDetailPage() {
  const id = useLocation().pathname.split("/")[2];
  const [menu, setMenu] = useState(null);
  const [editMenu, setEditMenu] = useState(null);
  const [modifCount, setModifCount] = useState(0);
  const [editDialog, setEditDialog] = useState({
    open: false,
    type: "",
    index: null,
  });
  const [editValue, setEditValue] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMenu = async () => {
      const docRef = doc(db, "menus", id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        setMenu({ id: snapshot.id, ...snapshot.data() });
        setEditMenu({ id: snapshot.id, ...snapshot.data() });
      }
    };
    fetchMenu();
  }, [id]);

  useEffect(() => {
    if (menu && editMenu) {
      let count = 0;
      if (menu.denomination !== editMenu.denomination) count++;
      if (menu.prix_vente !== editMenu.prix_vente) count++;
      if (menu.disponible !== editMenu.disponible) count++;
      if (
        JSON.stringify(menu.ingredients) !==
        JSON.stringify(editMenu.ingredients)
      ) {
        menu.ingredients.forEach((ing, idx) => {
          if (JSON.stringify(ing) !== JSON.stringify(editMenu.ingredients[idx]))
            count++;
        });
        if (menu.ingredients.length !== editMenu.ingredients.length) count++;
      }
      setModifCount(count);
    }
  }, [menu, editMenu]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (modifCount > 0) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [modifCount]);

  const openEditField = (type) => {
    setEditValue(editMenu[type]);
    setEditDialog({ open: true, type, index: null });
  };

  const openEditIngredient = (idx) => {
    setEditValue(editMenu.ingredients[idx]);
    setEditDialog({ open: true, type: "ingredient", index: idx });
  };

  const handleValidateEdit = () => {
    if (editDialog.type === "ingredient") {
      const newIngs = [...editMenu.ingredients];
      newIngs[editDialog.index] = editValue;
      setEditMenu({ ...editMenu, ingredients: newIngs });
    } else {
      setEditMenu({ ...editMenu, [editDialog.type]: editValue });
    }
    setEditDialog({ open: false, type: "", index: null });
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditDialog({ open: false, type: "", index: null });
    setEditValue("");
  };

  const handleUpdate = async () => {
    const docRef = doc(db, "menus", id);
    return toast.promise(
      updateDoc(docRef, {
        ...editMenu,
      }),
      {
        loading: "Mise à jour du menu en cours...",
        success: () => {
          setMenu(editMenu);
          setModifCount(0);
          return "Menu mis à jour avec succès !";
        },
        error: "Erreur lors de la mise à jour du menu.",
      }
    );
  };

  // Suppression menu via modale
  const handleDelete = async () => {
    setShowDeleteDialog(false);
    try {
      await toast.promise(deleteDoc(doc(db, "menus", id)), {
        loading: "Suppression en cours...",
        success: "Menu supprimé avec succès.",
        error: "Erreur lors de la suppression du menu.",
      });
      navigate("/"); // Redirige vers la liste
    } catch (err) {}
  };

  const Icone = iconeMap[menu?.icone] || Sandwich;

  const totalIngredients = editMenu?.ingredients?.reduce(
    (total, ing) => total + Number(ing.prix) * Number(ing.quantite),
    0
  );

  const ingredientsWithTotal = editMenu?.ingredients?.map((ing) => ({
    ...ing,
    total: Number(ing.prix) * Number(ing.quantite),
  }));

  if (!menu || !editMenu) {
    return (
      <div className="p-4 text-center">
        <Loader2 className="animate-spin w-8 h-8 mx-auto text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <HeaderNav />
      <div className="p-4 space-y-6 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icone className="w-8 h-8 text-orange-600" />
            <h1 className="text-xl font-bold capitalize flex items-center gap-2">
              {editMenu.denomination}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => openEditField("denomination")}
                title="Modifier"
                className="ml-2">
                <Edit className="w-4 h-4 text-orange-500" />
              </Button>
            </h1>
          </div>
          {/* Badge + Toggle */}
          <Badge
            variant={editMenu.disponible ? "default" : "outline"}
            className={
              editMenu.disponible
                ? "bg-green-100 text-green-800 flex items-center"
                : "bg-red-100 text-red-800 border-red-300 flex items-center"
            }>
            {editMenu.disponible ? (
              <CheckCircle2 className="w-4 h-4 inline mr-1" />
            ) : (
              <AlertTriangle className="w-4 h-4 inline mr-1" />
            )}
            {editMenu.disponible ? "Disponible" : "Non disponible"}
            <Switch
              className="ml-2"
              checked={!!editMenu.disponible}
              onCheckedChange={(checked) =>
                setEditMenu((prev) => ({
                  ...prev,
                  disponible: checked,
                }))
              }
            />
          </Badge>
        </motion.div>

        {/* ... Autres blocs inchangés (prix, tableau ingrédients, bouton modifier, etc.) ... */}

        {/* Tableau ingrédients */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: "spring", delay: 0.3 }}
          className="rounded-xl bg-white shadow p-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-1 font-semibold text-left">Nom</th>
                <th className="px-2 py-1 font-semibold text-left">Quantité</th>
                <th className="px-2 py-1 font-semibold text-left">
                  Prix unitaire
                </th>
                <th className="px-2 py-1 font-semibold text-left">Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ingredientsWithTotal?.map((ing, idx) => (
                <tr key={idx} className="group hover:bg-orange-50 transition">
                  <td
                    className="px-2 py-2 cursor-pointer"
                    onClick={() => openEditIngredient(idx)}>
                    {ing.nom}
                    <Edit className="w-4 h-4 inline ml-1 text-orange-400 opacity-0 group-hover:opacity-100 transition" />
                  </td>
                  <td
                    className="px-2 py-2 cursor-pointer"
                    onClick={() => openEditIngredient(idx)}>
                    {ing.quantite} {ing.unite}
                  </td>
                  <td
                    className="px-2 py-2 cursor-pointer"
                    onClick={() => openEditIngredient(idx)}>
                    {ing.prix} FCFA
                  </td>
                  <td className="px-2 py-2 font-semibold">{ing.total} FCFA</td>
                  <td>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEditIngredient(idx)}
                      title="Modifier cet ingrédient">
                      <Edit className="w-4 h-4 text-orange-500" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Supprimer"
                      onClick={() => {
                        const newIngs = editMenu.ingredients.filter(
                          (_, i) => i !== idx
                        );
                        setEditMenu({ ...editMenu, ingredients: newIngs });
                      }}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-bold">
                <td colSpan={3} className="text-right px-2 py-2">
                  Total
                </td>
                <td className="px-2 py-2">{totalIngredients} FCFA</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </motion.div>

        {/* Boutons principaux */}
        <div className="flex justify-end gap-2">
          {/* Bouton SUPPRIMER (rouge) et MODALE DE CONFIRMATION */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                onClick={() => setShowDeleteDialog(true)}
                title="Supprimer définitivement ce menu">
                <Trash2 className="w-5 h-5 mr-2" />
                Supprimer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md text-center">
              <div className="flex flex-col items-center justify-center gap-3 py-4">
                <Trash2 className="w-10 h-10 text-red-500 mx-auto" />
                <h2 className="text-lg font-bold text-red-700">
                  Supprimer ce menu ?
                </h2>
                <p className="text-gray-700">
                  Cette action est <b>irréversible</b>.<br />
                  Êtes-vous sûr de vouloir supprimer ce menu ?
                </p>
                <div className="flex gap-3 mt-4 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteDialog(false)}>
                    Annuler
                  </Button>
                  <Button
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleDelete}>
                    <Trash2 className="w-5 h-5 mr-2" />
                    Oui, supprimer définitivement
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* BOUTON MODIFIER */}
          <Button
            variant="default"
            size="lg"
            disabled={modifCount === 0}
            className="relative"
            onClick={async () => {
              await handleUpdate();
            }}>
            <Edit className="w-5 h-5 mr-2" />
            Modifier
            {modifCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full px-2 text-xs shadow font-bold">
                {modifCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Modal d’édition champ/ingrédient */}
      <Dialog open={editDialog.open} onOpenChange={handleCancelEdit}>
        <DialogContent className="max-w-md">
          {editDialog.type === "ingredient" ? (
            <IngredientEditForm
              ingredient={editValue}
              onChange={setEditValue}
              onSave={handleValidateEdit}
              onCancel={handleCancelEdit}
            />
          ) : (
            <ChampEditForm
              type={editDialog.type}
              value={editValue}
              onChange={setEditValue}
              onSave={handleValidateEdit}
              onCancel={handleCancelEdit}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Formulaires internes inchangés ---

function IngredientEditForm({ ingredient, onChange, onSave, onCancel }) {
  const [localIng, setLocalIng] = useState(ingredient);
  useEffect(() => {
    setLocalIng(ingredient);
  }, [ingredient]);
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onChange(localIng);
        onSave();
      }}>
      <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
        <Soup className="w-5 h-5 text-orange-500" /> Modifier l'ingrédient
      </h3>
      <Input
        value={localIng.nom}
        onChange={(e) => setLocalIng({ ...localIng, nom: e.target.value })}
        placeholder="Nom"
        className="mb-1"
        required
      />
      <div className="flex gap-2">
        <Input
          value={localIng.quantite}
          onChange={(e) =>
            setLocalIng({ ...localIng, quantite: e.target.value })
          }
          placeholder="Quantité"
          type="number"
          required
        />
        <Input
          value={localIng.unite}
          onChange={(e) => setLocalIng({ ...localIng, unite: e.target.value })}
          placeholder="Unité"
          required
        />
      </div>
      <Input
        value={localIng.prix}
        onChange={(e) => setLocalIng({ ...localIng, prix: e.target.value })}
        placeholder="Prix unitaire (FCFA)"
        type="number"
        required
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" variant="default">
          <Edit className="w-4 h-4 mr-1" /> Enregistrer
        </Button>
      </div>
    </form>
  );
}

function ChampEditForm({ type, value, onChange, onSave, onCancel }) {
  const labelMap = {
    denomination: "Dénomination du menu",
    prix_vente: "Prix de vente (FCFA)",
    disponible: "Disponible",
  };
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}>
      <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
        <Edit className="w-5 h-5 text-orange-500" /> Modifier {labelMap[type]}
      </h3>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={labelMap[type]}
        required
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" variant="default">
          <Edit className="w-4 h-4 mr-1" /> Enregistrer
        </Button>
      </div>
    </form>
  );
}
