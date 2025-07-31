import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { toast } from "sonner";
import {
  Sandwich,
  Fish,
  Drumstick,
  FlaskConical,
  CupSoda,
  Box,
} from "lucide-react";

const iconesDisponibles = [
  { nom: "Sandwich", composant: Sandwich },
  { nom: "Poisson", composant: Fish },
  { nom: "Poulet", composant: Drumstick },
  { nom: "Yaourt", composant: FlaskConical },
  { nom: "Soda", composant: CupSoda },
  { nom: "Box", composant: Box },
];

export default function CreerMenu() {
  const [denomination, setDenomination] = useState("");
  const [prix, setPrix] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [disponible, setDisponible] = useState(true);
  const [icone, setIcone] = useState(null);
  const [type, setType] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchStocks() {
      const snapshot = await getDocs(collection(db, "stocks"));
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const filtered = data.filter((item) => item.categorie === "ingrédient");
      setStocks(filtered);
    }
    fetchStocks();
  }, []);

  const creerMenu = async () => {
    if (
      !denomination ||
      !prix ||
      !icone ||
      !type ||
      isNaN(Number(prix)) ||
      Number(prix) <= 0
    ) {
      toast.error(
        "Tous les champs sont obligatoires et le prix doit être un nombre positif."
      );
      return;
    }

    try {
      await addDoc(collection(db, "menus"), {
        denomination,
        prix: Number(prix), // prix sera TOUJOURS de type number
        ingredient: ingredients,
        icone: icone.nom,
        type,
        disponible,
      });
      toast.success("Menu ajouté avec succès");
      setDenomination("");
      setPrix("");
      setIngredients([]);
      setIcone(null);
      setType("");
    } catch (error) {
      toast.error("Erreur lors de l'ajout du menu");
    }
  };

  const ajouterIngredientDepuisDialog = (stock) => {
    if (ingredients.some((i) => i.nom === stock.denomination)) {
      toast.error("Cet ingrédient est déjà ajouté");
      return;
    }
    setIngredients([
      ...ingredients,
      {
        nom: stock.denomination,
        prix: stock.cout?.moyen_achat || 0,
        quantite: 0,
        unite: stock.unite || "",
      },
    ]);
    setDialogOpen(false);
  };

  const modifierIngredient = (index, champ, valeur) => {
    const maj = [...ingredients];
    maj[index][champ] = valeur;
    setIngredients(maj);
  };

  const supprimerIngredient = (index) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  return (
    <div className="h-[90vh] overflow-y-auto p-4">
      <div className="text-lg font-bold mb-4">Nouveau Plat</div>
      <div className="space-y-4">
        <Input
          placeholder="Dénomination"
          value={denomination}
          onChange={(e) => setDenomination(e.target.value)}
        />
        <Input
          type="number"
          placeholder="Prix de vente"
          value={prix}
          min={0}
          onChange={(e) => setPrix(e.target.value)}
        />

        {/* Type */}
        <div>
          <div className="font-semibold mb-1">Type *</div>
          <div className="flex gap-2">
            <Button
              variant={type === "menu" ? "default" : "outline"}
              onClick={() => setType("menu")}
              type="button"
              size="sm">
              Menu
            </Button>
            <Button
              variant={type === "boisson" ? "default" : "outline"}
              onClick={() => setType("boisson")}
              type="button"
              size="sm">
              Boisson
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="font-semibold">Ingrédients (optionnel)</div>
          {ingredients.map((ing, index) => (
            <div
              key={index}
              className="flex flex-col gap-2 border p-2 rounded-md">
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Prix"
                  value={ing.prix}
                  onChange={(e) =>
                    modifierIngredient(index, "prix", e.target.value)
                  }
                />
                <Input
                  type="number"
                  placeholder="Quantité"
                  value={ing.quantite}
                  onChange={(e) =>
                    modifierIngredient(index, "quantite", e.target.value)
                  }
                />
                <Input
                  placeholder="Unité"
                  value={ing.unite}
                  onChange={(e) =>
                    modifierIngredient(index, "unite", e.target.value)
                  }
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => supprimerIngredient(index)}
                className="text-red-500">
                Supprimer
              </Button>
            </div>
          ))}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 w-4 h-4" /> Ajouter un ingrédient
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 gap-2">
                {stocks.map((stock) => (
                  <Button
                    key={stock.id}
                    variant="ghost"
                    className="justify-start"
                    onClick={() => ajouterIngredientDepuisDialog(stock)}>
                    {stock.denomination}
                  </Button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-2">
          <div className="font-semibold">Icône *</div>
          <div className="grid grid-cols-3 gap-2">
            {iconesDisponibles.map((icon) => {
              const IconComponent = icon.composant;
              return (
                <Button
                  key={icon.nom}
                  variant={icone?.nom === icon.nom ? "default" : "outline"}
                  onClick={() => setIcone(icon)}
                  className="flex flex-col items-center justify-center gap-1 h-16">
                  <IconComponent className="w-5 h-5" />
                  <span className="text-xs">{icon.nom}</span>
                </Button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="dispo" className="text-sm font-medium">
            Disponible :
          </label>
          <input
            id="dispo"
            type="checkbox"
            checked={disponible}
            onChange={(e) => setDisponible(e.target.checked)}
          />
        </div>

        <Button
          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          onClick={creerMenu}>
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
