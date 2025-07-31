import React, { useEffect, useState } from "react";
import { db } from "@/firebase";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { Loader, Plus, Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import MoyenPaiementDialog from "@/components/MoyenPaiementDialog";
import HeaderNav from "@/components/HeaderNav";
import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

const colRef = collection(db, "utils", "moyens_paiement", "options");

export default function MoyenPaiementDetail() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("add");
  const [currentItem, setCurrentItem] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  // Chargement
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(colRef, (snap) => {
      setItems(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((d) => d.statut !== false)
      );
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Dialogs
  const openAdd = () => {
    setCurrentItem(null);
    setDialogMode("add");
    setDialogOpen(true);
  };
  const openEdit = (item) => {
    setCurrentItem(item);
    setDialogMode("edit");
    setDialogOpen(true);
  };
  const requestDelete = (item) => setPendingDelete(item);
  const confirmDelete = async () => {
    const item = pendingDelete;
    setPendingDelete(null);
    try {
      await updateDoc(doc(colRef, item.id), { statut: false });
      toast.success("Moyen de paiement désactivé !");
    } catch {
      toast.error("Erreur lors de la désactivation.");
    }
  };
  const cancelDelete = () => setPendingDelete(null);

  // Ajout/modification
  const handleDialogSubmit = async (formData) => {
    setDialogOpen(false);
    // L’id = denomination (en minuscules, sans espaces)
    const id = (formData.denomination || "")
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^\w_]/g, "");
    try {
      await setDoc(doc(colRef, id), {
        ...formData,
        date_ajout: formData.date_ajout || serverTimestamp(),
        statut: formData.statut === false ? false : true,
      });
      toast.success(
        dialogMode === "add"
          ? "Moyen de paiement créé !"
          : "Moyen de paiement modifié !"
      );
    } catch {
      toast.error("Erreur lors de l'enregistrement.");
    }
  };

  // Card visuelle
  const Card = ({ item }) => (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-xl border bg-white shadow p-4 mb-3">
      <div>
        <div className="font-bold text-lg">{item.denomination}</div>
        <div className="text-sm text-gray-600">{item.type}</div>
      </div>
      <div className="absolute top-3 right-3 flex gap-2">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => openEdit(item)}
          title="Modifier">
          <Pencil className="w-5 h-5 text-blue-600" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => requestDelete(item)}
          title="Supprimer">
          <Trash className="w-5 h-5 text-red-500" />
        </Button>
      </div>
    </motion.div>
  );

  const CreateCard = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.98 }}
      className="rounded-xl border-dashed border-2 border-primary bg-white p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/10 mb-4"
      onClick={openAdd}>
      <Plus className="w-8 h-8 text-primary" />
      <span className="font-semibold text-primary mt-2">
        Ajouter un moyen de paiement
      </span>
    </motion.div>
  );

  return (
    <>
      <HeaderNav />
      <div className="max-w-lg mx-auto p-2 min-h-screen">
        <CreateCard />
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="animate-spin w-12 h-12 text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            <img
              src="/paiement.svg"
              alt=""
              className="mx-auto mb-2 w-32 opacity-80"
            />
            Aucun moyen de paiement.
          </div>
        ) : (
          items.map((item) => <Card key={item.id} item={item} />)
        )}

        {dialogOpen && (
          <MoyenPaiementDialog
            open={dialogOpen}
            mode={dialogMode}
            moyen={currentItem}
            onClose={() => setDialogOpen(false)}
            onSubmit={handleDialogSubmit}
            disabled={loading}
          />
        )}

        {/* AlertDialog pour suppression */}
        <AlertDialog open={!!pendingDelete} onOpenChange={cancelDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Voulez-vous vraiment désactiver ce moyen de paiement ?
                <br />
                Cette action est{" "}
                <span className="text-red-600 font-bold">réversible</span>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel asChild>
                <Button variant="outline" onClick={cancelDelete}>
                  Annuler
                </Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button variant="destructive" onClick={confirmDelete}>
                  Désactiver
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
