import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Pencil, Trash2 } from "lucide-react";

/* ---------------- Mini dialog quantité (inchangé) ---------------- */
const MiniNumberDialog = ({
  open,
  onOpenChange,
  title = "Modifier la quantité",
  defaultValue = 1,
  min = 0,
  max,
  step = 1,
  onSubmit,
}) => {
  const [value, setValue] = useState(defaultValue ?? 1);
  useEffect(() => {
    if (open) setValue(defaultValue ?? 1);
  }, [open, defaultValue]);

  const handleConfirm = () => {
    const num = Number(value);
    if (Number.isNaN(num)) return;
    if (typeof min === "number" && num < min) return;
    if (typeof max === "number" && num > max) return;
    onSubmit?.(num);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[320px] p-4">
        <DialogHeader>
          <DialogTitle className="text-sm">{title}</DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          <Input
            type="number"
            inputMode="numeric"
            step={step}
            min={min}
            max={max}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <DialogFooter className="mt-3 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleConfirm}>Valider</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ---------------- Mini carte catalogue + input quantité ---------------- */
const MiniCardItem = ({ item, currentQty = 0, onQuantityChange }) => {
  const [showInput, setShowInput] = useState(false);

  return (
    <div
      onClick={() => setShowInput(true)}
      className={`border rounded-lg p-3 cursor-pointer hover:shadow-sm transition
                  ${currentQty > 0 ? "border-green-500" : "border-gray-200"}`}>
      <div className="text-xs font-semibold">{item?.denomination}</div>
      <div className="text-[11px] text-muted-foreground">{item?.prix} FCFA</div>

      {showInput && (
        <div className="mt-2">
          <Input
            autoFocus
            type="number"
            inputMode="numeric"
            min={0}
            value={currentQty || ""}
            placeholder="Quantité"
            onChange={(e) => onQuantityChange(Number(e.target.value) || 0)}
            onBlur={() => setShowInput(false)}
          />
        </div>
      )}
    </div>
  );
};

/* ---------------- Dialog d’ajout d’éléments ---------------- */
const AddElementDialog = ({
  open,
  onOpenChange,
  catalogue = [], // liste complète (menus + boissons)
  elements,
  setElements, // tableau en cours d’édition dans DetailsCommande
}) => {
  // Séparation catalogue
  const menus = useMemo(
    () => catalogue.filter((i) => (i.type || "").toLowerCase() === "menu"),
    [catalogue]
  );
  const boissons = useMemo(
    () => catalogue.filter((i) => (i.type || "").toLowerCase() !== "menu"),
    [catalogue]
  );

  // map id -> qty actuel
  const qtyMap = useMemo(() => {
    const map = new Map();
    elements.forEach((el) => {
      if (el?.id) map.set(el.id, Number(el.quantite || 0));
    });
    return map;
  }, [elements]);

  // mise à jour immédiate d’un item (ajout/modif/suppression si 0)
  const upsertElement = (srcItem, qty) => {
    setElements((prev) => {
      const idx = prev.findIndex((p) => p.id === srcItem.id);
      // si qty 0 -> enlever
      if (!qty || qty <= 0) {
        if (idx === -1) return prev;
        const cp = [...prev];
        cp.splice(idx, 1);
        return cp;
      }
      // sinon ajouter / modifier avec les infos catalogue
      if (idx === -1) {
        return [...prev, { ...srcItem, quantite: qty }];
      } else {
        const cp = [...prev];
        cp[idx] = {
          ...cp[idx],
          quantite: qty,
          prix: srcItem.prix,
          denomination: srcItem?.denomination,
          type: srcItem.type,
        };
        return cp;
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter un élément</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="menu" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="menu">Menu</TabsTrigger>
            <TabsTrigger value="boisson">Boissons</TabsTrigger>
          </TabsList>

          {/* Onglet MENUS */}
          <TabsContent value="menu" className="mt-3">
            <div className="grid grid-cols-2 gap-2">
              {menus.map((m) => (
                <MiniCardItem
                  key={m.id}
                  item={m}
                  currentQty={qtyMap.get(m.id) || 0}
                  onQuantityChange={(q) => upsertElement(m, q)}
                />
              ))}
            </div>
          </TabsContent>

          {/* Onglet BOISSONS */}
          <TabsContent value="boisson" className="mt-3">
            <div className="grid grid-cols-2 gap-2">
              {boissons.map((b) => (
                <MiniCardItem
                  key={b.id}
                  item={b}
                  currentQty={qtyMap.get(b.id) || 0}
                  onQuantityChange={(q) => upsertElement(b, q)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ---------------- Tableau principal ---------------- */
const DetailsCommande = ({ details, liste, update, change }) => {
  // fusion initiale details(id, quantite) + catalogue(liste)
  const [list, setList] = useState(
    (() => {
      let listed = [];
      details.map((el) =>
        listed.push({
          ...liste.find((e) => el.id === e.id),
          quantite: el.quantite,
        })
      );
      return listed;
    })()
  );
  const parse_commande = (elements) => {
    let parsed = [];
    elements.map((el) =>
      parsed.push({
        id: el.id,
        prix: el.prix,
        type: el.type,
        quantite: el.quantite,
      })
    );
    return JSON.stringify(parsed);
  };
  const [elements, setElements] = useState([...list]);
  const [total, setTotal] = useState(0);
  const [changement, setChangement] = useState(false);
  // dialog quantité
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);

  // dialog ajout
  const [openAdd, setOpenAdd] = useState(false);

  useEffect(() => {
    setTotal(
      elements.reduce(
        (prev, a) => prev + Number(a?.quantite) * Number(a?.prix),
        0
      )
    );
    setChangement(JSON.stringify(list) !== JSON.stringify(elements));
  }, [elements, list]);

  const onSubmitQuantity = (newQty) => {
    if (selectedIndex == null) return;
    setElements((prev) => {
      const cp = [...prev];
      cp[selectedIndex] = { ...cp[selectedIndex], quantite: newQty };
      return cp;
    });
    change?.(true);
  };

  return (
    <div>
      {/* Bouton ouvrir AddElement */}
      <div className="flex justify-between">
        <Button
          className="text-xs mb-2 bg-[#ff6900] hover:bg-[#e05f00]"
          onClick={() => setOpenAdd(true)}>
          Ajouter
        </Button>
        {changement && (
          <>
            <Button
              className="text-xs mb-2 bg-red-200 hover:bg-[#e05f00]"
              onClick={() => {
                setElements([...list]);
                change(false);
              }}>
              Annuler
            </Button>
            <Button
              className="text-xs mb-2 bg-green-200 hover:bg-[#e05f00]"
              onClick={() => {
                update({
                  key: "details_commande",
                  val: parse_commande(elements),
                });
                toast.message("Modifications", {
                  description: `Vous avez modifié le contenu de la commande avec succès`,
                });
                setList([...elements]);
                change(true);
              }}>
              Enregistrer
            </Button>
          </>
        )}
      </div>

      <Table className="text-xs">
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Qte</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>-</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {elements.map((el, id) => (
            <TableRow key={id}>
              <TableCell>{el?.denomination}</TableCell>
              <TableCell>
                <span className="mr-1 font-semibold">{el?.quantite || ""}</span>
                x<span className="ml-1 italic">{el?.prix || ""}</span>
              </TableCell>
              <TableCell>{Number(el?.prix) * Number(el?.quantite)}</TableCell>
              <TableCell className="flex">
                <Pencil
                  onClick={() => {
                    setSelectedIndex(id);
                    setOpenDialog(true);
                  }}
                  className="w-4 h-4 mr-1 text-blue-500 cursor-pointer"
                />
                <Trash2
                  onClick={() => {
                    setElements((prev) => prev.filter((_, idx) => idx !== id));
                    change?.(true);
                  }}
                  className="w-4 h-4 ml-1 text-red-500 cursor-pointer"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>

        <TableFooter>
          <TableRow>
            <TableCell colSpan={2}>Total</TableCell>
            <TableCell>{total}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
      {/* Mini dialog quantité */}
      <MiniNumberDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        title="Modifier la quantité"
        defaultValue={
          selectedIndex != null ? elements[selectedIndex]?.quantite ?? 1 : 1
        }
        min={0}
        step={1}
        onSubmit={onSubmitQuantity}
      />

      {/* Dialog d’ajout par onglets */}
      <AddElementDialog
        open={openAdd}
        onOpenChange={(o) => {
          setOpenAdd(o);
          // optionnel : notifier modif lors de la fermeture
          if (!o) change?.(true);
        }}
        catalogue={liste}
        elements={elements}
        setElements={setElements}
      />
    </div>
  );
};

export default DetailsCommande;
