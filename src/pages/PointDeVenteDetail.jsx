import React, { useEffect, useState } from "react";
import { db } from "@/firebase";
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import {
  Store,
  Pencil,
  Trash,
  MoreHorizontal,
  Plus,
  Loader,
  AlertCircle,
  CheckCircle2,
  Info,
  Home,
  Building,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import PointDeVenteDialog from "@/components/PointDeVenteDialog";
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

const typeColors = {
  boutique: "bg-green-100 border-green-400 text-green-800",
  kiosque: "bg-blue-100 border-blue-400 text-blue-800",
  maison: "bg-yellow-100 border-yellow-400 text-yellow-800",
  Default: "bg-gray-100 border-gray-400 text-gray-800",
};
const badgeColors = {
  boutique: "bg-green-500 text-white",
  kiosque: "bg-blue-500 text-white",
  maison: "bg-yellow-500 text-white",
  Default: "bg-gray-400 text-white",
};
const iconType = {
  boutique: Building,
  kiosque: ShoppingBag,
  maison: Home,
};

function formatDateAjout(date_ajout) {
  if (!date_ajout) return "";
  if (typeof date_ajout.toDate === "function") {
    return date_ajout.toDate().toLocaleString("fr-FR");
  }
  if (typeof date_ajout.seconds === "number") {
    try {
      const ts = new Timestamp(date_ajout.seconds, date_ajout.nanoseconds || 0);
      return ts.toDate().toLocaleString("fr-FR");
    } catch {
      return new Date(date_ajout.seconds * 1000).toLocaleString("fr-FR");
    }
  }
  if (date_ajout instanceof Date) return date_ajout.toLocaleString("fr-FR");
  if (typeof date_ajout === "string") {
    const d = new Date(date_ajout);
    if (!isNaN(d)) return d.toLocaleString("fr-FR");
  }
  return "";
}

const pointDeVenteColRef = collection(db, "utils", "points_vente", "options");

export default function PointDeVenteDetail() {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("add");
  const [currentPoint, setCurrentPoint] = useState(null);

  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(
      pointDeVenteColRef,
      (snap) => {
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((d) => d.statut !== false); // Soft delete
        setPoints(data);
        setLoading(false);
      },
      (err) => {
        toast.error(
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-500" />
            Erreur Firestore
          </div>,
          { description: err.message }
        );
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const openAdd = () => {
    setCurrentPoint(null);
    setDialogMode("add");
    setDialogOpen(true);
  };
  const openEdit = (p) => {
    setCurrentPoint(p);
    setDialogMode("edit");
    setDialogOpen(true);
  };
  const openDetails = (p) => {
    setCurrentPoint(p);
    setDialogMode("details");
    setDialogOpen(true);
  };

  const requestDelete = (point) => setPendingDelete(point);

  const confirmDelete = async () => {
    const point = pendingDelete;
    if (!point) return;
    setPendingDelete(null);
    try {
      const docRef = doc(pointDeVenteColRef, point.id);
      const deletePromise = setDoc(
        docRef,
        { ...point, statut: false },
        { merge: true }
      );
      toast.promise(deletePromise, {
        loading: (
          <div className="flex items-center gap-2">
            <Loader className="animate-spin" /> Suppression en cours...
          </div>
        ),
        success: () => (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-green-600" /> Point de vente supprimé.
          </div>
        ),
        error: (err) => (
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-500" />{" "}
            {err?.message || "Erreur lors de la suppression"}
          </div>
        ),
      });
      await deletePromise;
    } catch (e) {}
  };

  const cancelDelete = () => setPendingDelete(null);

  // CRUD centralisé ici
  const handleDialogSubmit = async (formData) => {
    setDialogOpen(false);
    const id = formData.denomination.toLowerCase().replace(/[^a-z0-9]/gi, "-");
    if (dialogMode === "add") {
      if (points.find((p) => p.denomination === formData.denomination)) {
        toast.error(
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-500" /> Doublon
          </div>,
          {
            description:
              "Un point de vente avec cette dénomination existe déjà.",
          }
        );
        return;
      }
      const newPoint = {
        ...formData,
        date_ajout: serverTimestamp(),
        statut: true,
      };
      const createPromise = setDoc(doc(pointDeVenteColRef, id), newPoint);
      toast.promise(createPromise, {
        loading: (
          <div className="flex items-center gap-2">
            <Loader className="animate-spin" /> Création du point de vente...
          </div>
        ),
        success: () => (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-green-600" /> Point de vente ajouté !
          </div>
        ),
        error: (err) => (
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-500" />{" "}
            {err?.message || "Erreur lors de la création"}
          </div>
        ),
      });
      await createPromise;
      return;
    }
    // edit
    if (dialogMode === "edit") {
      const editPromise = setDoc(doc(pointDeVenteColRef, id), {
        ...formData,
        date_ajout: currentPoint.date_ajout || serverTimestamp(),
        statut: currentPoint.statut !== false,
      });
      toast.promise(editPromise, {
        loading: (
          <div className="flex items-center gap-2">
            <Loader className="animate-spin" /> Modification...
          </div>
        ),
        success: () => (
          <div className="flex items-center gap-2">
            <Info className="text-blue-600" /> Point de vente modifié.
          </div>
        ),
        error: (err) => (
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-500" />{" "}
            {err?.message || "Erreur lors de la modification"}
          </div>
        ),
      });
      await editPromise;
      return;
    }
  };

  const BadgeType = ({ type }) => (
    <span
      className={`rounded px-2 py-1 text-xs font-bold shadow ${
        badgeColors[type] || badgeColors.Default
      }`}>
      {type}
    </span>
  );

  const touchFeedback = "transition active:scale-95 active:bg-gray-100/80";

  const PointCard = ({ point }) => {
    const Icon = iconType[point.type] || Store;
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        className={`relative rounded-xl border-2 ${
          typeColors[point.type] || typeColors.Default
        } bg-white shadow group overflow-hidden mb-3 ${touchFeedback}`}>
        <div className="relative z-10 p-4 flex flex-col gap-2">
          <div className="absolute top-2 right-2 flex gap-1 z-20">
            <Button
              size="icon"
              variant="ghost"
              className={touchFeedback}
              onClick={() => requestDelete(point)}>
              <Trash className="w-5 h-5 text-red-500" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className={touchFeedback}
              onClick={() => openEdit(point)}>
              <Pencil className="w-5 h-5 text-blue-600" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className={touchFeedback}
              onClick={() => openDetails(point)}>
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Icon className="w-5 h-5" />
            <span className="font-bold">{point.denomination}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <BadgeType type={point.type} />
          </div>
          <div className="flex items-center gap-2">
            <Store />
            <span>{point.adresse}</span>
          </div>
          {point.date_ajout && (
            <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
              Ajouté le : {formatDateAjout(point.date_ajout)}
            </div>
          )}
          <div className="absolute bottom-2 right-2">
            <Button
              onClick={() => openEdit(point)}
              variant="secondary"
              className={`rounded-full shadow ${touchFeedback}`}>
              Ouvrir
            </Button>
          </div>
        </div>
      </motion.div>
    );
  };

  const CreatePointCard = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.98 }}
      className={`rounded-xl border-dashed border-2 border-primary bg-white p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/10 mb-4 ${touchFeedback}`}
      onClick={openAdd}>
      <Plus className="w-8 h-8 text-primary" />
      <span className="font-semibold text-primary mt-2">
        Créer point de vente
      </span>
    </motion.div>
  );

  return (
    <>
      <HeaderNav />
      <div className="max-w-lg mx-auto p-2 min-h-screen">
        <CreatePointCard />
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="animate-spin w-12 h-12 text-primary" />
          </div>
        ) : points.length === 0 ? (
          <div className="text-center text-gray-500">
            <img
              src="/shop.svg"
              alt=""
              className="mx-auto mb-2 w-32 opacity-80"
            />
            Aucun point de vente.
            <br />
            Cliquez sur{" "}
            <span className="font-semibold text-primary">
              Créer point de vente
            </span>{" "}
            pour commencer !
          </div>
        ) : (
          points.map((p) => <PointCard key={p.id} point={p} />)
        )}
        {dialogOpen && (
          <PointDeVenteDialog
            open={dialogOpen}
            mode={dialogMode}
            pointDeVente={currentPoint}
            onClose={() => setDialogOpen(false)}
            onSubmit={handleDialogSubmit}
            disabled={loading}
          />
        )}
        {/* AlertDialog global pour suppression */}
        <AlertDialog open={!!pendingDelete} onOpenChange={cancelDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Voulez-vous vraiment supprimer{" "}
                <b>{pendingDelete?.denomination}</b> ?
                <br />
                Cette action est{" "}
                <span className="text-red-600 font-bold">irréversible</span>.
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
                  Supprimer
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
