import React, { useEffect, useState } from "react";
import { db } from "@/firebase";
import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import {
  UserCircle,
  Mail,
  Phone,
  ShoppingBag,
  BadgeCheck,
  Trash,
  Pencil,
  MoreHorizontal,
  Plus,
  Loader,
  AlertCircle,
  CheckCircle2,
  Info,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import VendeuseDialog from "@/components/VendeuseDialog";
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

const fonctionColors = {
  Vendeuse: "bg-blue-100 border-blue-400 text-blue-800",
  Default: "bg-gray-100 border-gray-400 text-gray-800",
};
const badgeColors = {
  Vendeuse: "bg-blue-500 text-white",
  Default: "bg-gray-400 text-white",
};

function formatDateAjout(date_ajout) {
  try {
    if (!date_ajout) return "";
    if (typeof date_ajout.toDate === "function") {
      return date_ajout.toDate().toLocaleString("fr-FR");
    }
    if (typeof date_ajout.seconds === "number") {
      return new Date(date_ajout.seconds * 1000).toLocaleString("fr-FR");
    }
    if (date_ajout instanceof Date) return date_ajout.toLocaleString("fr-FR");
    if (typeof date_ajout === "string") {
      const d = new Date(date_ajout);
      if (!isNaN(d)) return d.toLocaleString("fr-FR");
    }
  } catch {}
  return "";
}

const vendeusesColRef = collection(db, "utils", "vendeuses", "options");
const pointsDeVenteColRef = collection(
  db,
  "utils",
  "options",
  "point_de_vente"
);

export default function VendeuseDetail() {
  const [vendeuses, setVendeuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pointsDeVente, setPointsDeVente] = useState([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("add");
  const [currentVendeuse, setCurrentVendeuse] = useState(null);

  const [pendingDelete, setPendingDelete] = useState(null);

  // --- Chargement en temps réel, seulement vendeuses actives ---
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(vendeusesColRef, (snap) => {
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((v) => v.statut !== false); // Seulement statut actif
      setVendeuses(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // --- Charger les points de vente ---
  useEffect(() => {
    async function loadPV() {
      const snap = await getDocs(pointsDeVenteColRef);
      setPointsDeVente(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    }
    loadPV();
  }, []);

  const openAdd = () => {
    setCurrentVendeuse(null);
    setDialogMode("add");
    setDialogOpen(true);
  };
  const openEdit = (l) => {
    setCurrentVendeuse(l);
    setDialogMode("edit");
    setDialogOpen(true);
  };
  const openDetails = (l) => {
    setCurrentVendeuse(l);
    setDialogMode("details");
    setDialogOpen(true);
  };

  // Suppression douce : update {statut: false}
  const requestDelete = (vendeuse) => setPendingDelete(vendeuse);
  const confirmDelete = async () => {
    const vendeuse = pendingDelete;
    if (!vendeuse) return;
    setPendingDelete(null);
    try {
      const ref = doc(vendeusesColRef, vendeuse.id);
      const updatePromise = setDoc(
        ref,
        { ...vendeuse, statut: false },
        { merge: true }
      );
      toast.promise(updatePromise, {
        loading: (
          <div className="flex items-center gap-2">
            <Loader className="animate-spin" /> Suppression en cours...
          </div>
        ),
        success: () => (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-green-600" />{" "}
            {`${vendeuse.prenom} ${vendeuse.nom} a bien été supprimée.`}
          </div>
        ),
        error: (err) => (
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-500" />{" "}
            {err?.message || "Erreur lors de la suppression"}
          </div>
        ),
      });
      await updatePromise;
    } catch (e) {}
  };
  const cancelDelete = () => setPendingDelete(null);

  // Création / édition (CRUD dans parent)
  const handleDialogSubmit = async (formData) => {
    setDialogOpen(false);
    try {
      const id = `${formData.fonction}${formData.telephone}`;
      const ref = doc(vendeusesColRef, id);
      const toSave = {
        ...formData,
        date_ajout:
          dialogMode === "edit"
            ? vendeuses.find((l) => l.id === id)?.date_ajout ||
              serverTimestamp()
            : serverTimestamp(),
        statut: true,
      };
      const op = setDoc(ref, toSave, { merge: true });
      toast.promise(op, {
        loading: (
          <div className="flex items-center gap-2">
            <Loader className="animate-spin" />
            {dialogMode === "add"
              ? "Création de la vendeuse..."
              : "Modification..."}
          </div>
        ),
        success: () => (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-green-600" />
            {dialogMode === "add"
              ? `${formData.prenom} ${formData.nom} ajoutée avec succès.`
              : `${formData.prenom} ${formData.nom} a bien été mise à jour.`}
          </div>
        ),
        error: (err) => (
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-500" />
            {err?.message || "Erreur Firestore"}
          </div>
        ),
      });
      await op;
    } catch (e) {}
  };

  // Affichage
  const BadgeFonction = ({ fonction }) => (
    <span
      className={`rounded px-2 py-1 text-xs font-bold shadow ${
        badgeColors[fonction] || badgeColors.Default
      }`}>
      {fonction}
    </span>
  );

  const touchFeedback = "transition active:scale-95 active:bg-gray-100/80";

  const VendeuseCard = ({ vendeuse }) => (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      className={`relative rounded-xl border-2 ${
        fonctionColors[vendeuse.fonction] || fonctionColors.Default
      } bg-white shadow group overflow-hidden mb-3 ${touchFeedback}`}>
      <div className="relative z-10 p-4 flex flex-col gap-2">
        <div className="absolute top-2 right-2 flex gap-1 z-20">
          <Button
            size="icon"
            variant="ghost"
            className={touchFeedback}
            onClick={() => requestDelete(vendeuse)}>
            <Trash className="w-5 h-5 text-red-500" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className={touchFeedback}
            onClick={() => openEdit(vendeuse)}>
            <Pencil className="w-5 h-5 text-blue-600" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className={touchFeedback}
            onClick={() => openDetails(vendeuse)}>
            <MoreHorizontal className="w-5 h-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className={touchFeedback}
            onClick={() => window.open(`tel:${vendeuse.telephone}`)}>
            <Phone className="w-5 h-5 text-blue-600" />
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <UserCircle />
          <span className="font-bold">
            {vendeuse.prenom} {vendeuse.nom}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <BadgeFonction fonction={vendeuse.fonction} />
        </div>
        <div className="flex items-center gap-2">
          <Mail />
          <span>{vendeuse.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone />
          <span>{vendeuse.telephone}</span>
        </div>
        <div className="flex items-center gap-2">
          <BadgeCheck />
          <span>{vendeuse.point_vente}</span>
        </div>
        {vendeuse.date_ajout && (
          <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
            Ajoutée le : {formatDateAjout(vendeuse.date_ajout)}
          </div>
        )}
        <div className="absolute bottom-2 right-2">
          <Button
            onClick={() => openEdit(vendeuse)}
            variant="secondary"
            className={`rounded-full shadow ${touchFeedback}`}>
            Ouvrir
          </Button>
        </div>
      </div>
    </motion.div>
  );

  const CreateVendeuseCard = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.98 }}
      className={`rounded-xl border-dashed border-2 border-primary bg-white p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/10 mb-4 ${touchFeedback}`}
      onClick={openAdd}>
      <Plus className="w-8 h-8 text-primary" />
      <span className="font-semibold text-primary mt-2">Créer vendeuse</span>
    </motion.div>
  );

  return (
    <>
      <HeaderNav />
      <div className="max-w-lg mx-auto p-2 min-h-screen">
        <CreateVendeuseCard />
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="animate-spin w-12 h-12 text-primary" />
          </div>
        ) : vendeuses.length === 0 ? (
          <div className="text-center text-gray-500">
            <img
              src="/vendeuse.svg"
              alt=""
              className="mx-auto mb-2 w-32 opacity-80"
            />
            Aucune vendeuse.
            <br />
            Cliquez sur{" "}
            <span className="font-semibold text-primary">
              Créer vendeuse
            </span>{" "}
            pour commencer !
          </div>
        ) : (
          vendeuses.map((l) => <VendeuseCard key={l.id} vendeuse={l} />)
        )}
        {dialogOpen && (
          <VendeuseDialog
            open={dialogOpen}
            mode={dialogMode}
            vendeuse={currentVendeuse}
            onClose={() => setDialogOpen(false)}
            onSubmit={handleDialogSubmit}
            disabled={loading}
            pointsDeVente={pointsDeVente}
          />
        )}
        {/* AlertDialog pour suppression douce */}
        <AlertDialog open={!!pendingDelete} onOpenChange={cancelDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Voulez-vous vraiment supprimer{" "}
                <b>
                  {pendingDelete?.prenom} {pendingDelete?.nom}
                </b>
                 ?
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
