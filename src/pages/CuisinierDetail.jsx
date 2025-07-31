import React, { useEffect, useState } from "react";
import { db } from "@/firebase";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  onSnapshot,
} from "firebase/firestore";
import {
  UserCircle,
  Mail,
  Phone,
  ChefHat,
  BadgeCheck,
  Trash,
  Pencil,
  MoreHorizontal,
  Plus,
  Loader,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import CuisinierDialog from "@/components/CuisinierDialog";
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
  Cuisinier: "bg-yellow-100 border-yellow-400 text-yellow-800",
  Default: "bg-gray-100 border-gray-400 text-gray-800",
};
const badgeColors = {
  Cuisinier: "bg-yellow-500 text-white",
  Default: "bg-gray-400 text-white",
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

const cuisiniersColRef = collection(db, "utils", "cuisiniers", "options");

export default function CuisinierDetail() {
  const [cuisiniers, setCuisiniers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("add");
  const [currentCuisinier, setCurrentCuisinier] = useState(null);

  const [pendingDelete, setPendingDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  // Ecoute temps réel Firestore + filtrage actifs
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(
      cuisiniersColRef,
      (snap) => {
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((l) => l.statut !== false);
        setCuisiniers(data);
        setLoading(false);
      },
      (e) => {
        toast.error(
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-500" />
            Erreur Firestore
          </div>,
          { description: e.message }
        );
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // Dialogs
  const openAdd = () => {
    setCurrentCuisinier(null);
    setDialogMode("add");
    setDialogOpen(true);
  };
  const openEdit = (l) => {
    setCurrentCuisinier(l);
    setDialogMode("edit");
    setDialogOpen(true);
  };
  const openDetails = (l) => {
    setCurrentCuisinier(l);
    setDialogMode("details");
    setDialogOpen(true);
  };

  // Suppression douce : update statut: false
  const requestDelete = (cuisinier) => setPendingDelete(cuisinier);

  const confirmDelete = async () => {
    const cuisinier = pendingDelete;
    if (!cuisinier) return;
    setPendingDelete(null);
    try {
      const updatePromise = updateDoc(doc(cuisiniersColRef, cuisinier.id), {
        statut: false,
      });
      toast.promise(updatePromise, {
        loading: (
          <div className="flex items-center gap-2">
            <Loader className="animate-spin" /> Désactivation en cours...
          </div>
        ),
        success: () => (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-green-600" />{" "}
            {`${cuisinier.prenom} ${cuisinier.nom} désactivé.`}
          </div>
        ),
        error: (err) => (
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-500" />{" "}
            {err?.message || "Erreur lors de la désactivation"}
          </div>
        ),
      });
      await updatePromise;
    } catch (e) {}
  };

  const cancelDelete = () => setPendingDelete(null);

  // CRUD via Dialog (add/edit)
  const handleDialogSubmit = async (formData) => {
    setSaving(true);
    setDialogOpen(false);
    try {
      const id = `${formData.fonction}${formData.telephone}`;
      if (dialogMode === "add") {
        if (cuisiniers.find((l) => l.id === id)) {
          toast.error(
            <div className="flex items-center gap-2">
              <AlertCircle className="text-red-500" /> Doublon
            </div>,
            { description: "Un cuisinier avec ce téléphone existe déjà." }
          );
          setSaving(false);
          return;
        }
        const newCuisinier = {
          ...formData,
          date_ajout: serverTimestamp(),
          statut: true,
        };
        const createPromise = setDoc(doc(cuisiniersColRef, id), newCuisinier);
        toast.promise(createPromise, {
          loading: (
            <div className="flex items-center gap-2">
              <Loader className="animate-spin" /> Création du cuisinier...
            </div>
          ),
          success: () => (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-green-600" />{" "}
              {`${formData.prenom} ${formData.nom} ajouté avec succès.`}
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
      } else if (dialogMode === "edit") {
        const editPromise = setDoc(doc(cuisiniersColRef, id), {
          ...formData,
          date_ajout:
            cuisiniers.find((l) => l.id === id)?.date_ajout ||
            serverTimestamp(),
          statut: true,
        });
        toast.promise(editPromise, {
          loading: (
            <div className="flex items-center gap-2">
              <Loader className="animate-spin" /> Modification...
            </div>
          ),
          success: () => (
            <div className="flex items-center gap-2">
              <Info className="text-blue-600" />{" "}
              {`${formData.prenom} ${formData.nom} a bien été mis à jour.`}
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
      }
    } catch (e) {}
    setSaving(false);
  };

  const BadgeFonction = ({ fonction }) => (
    <span
      className={`rounded px-2 py-1 text-xs font-bold shadow ${
        badgeColors[fonction] || badgeColors.Default
      }`}>
      {fonction}
    </span>
  );

  const touchFeedback = "transition active:scale-95 active:bg-gray-100/80";

  const CuisinierCard = ({ cuisinier }) => (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      className={`relative rounded-xl border-2 ${
        fonctionColors[cuisinier.fonction] || fonctionColors.Default
      } bg-white shadow group overflow-hidden mb-3 ${touchFeedback}`}>
      <div className="relative z-10 p-4 flex flex-col gap-2">
        <div className="absolute top-2 right-2 flex gap-1 z-20">
          <Button
            size="icon"
            variant="ghost"
            className={touchFeedback}
            onClick={() => requestDelete(cuisinier)}>
            <Trash className="w-5 h-5 text-red-500" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className={touchFeedback}
            onClick={() => openEdit(cuisinier)}>
            <Pencil className="w-5 h-5 text-blue-600" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className={touchFeedback}
            onClick={() => openDetails(cuisinier)}>
            <MoreHorizontal className="w-5 h-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className={touchFeedback}
            onClick={() => window.open(`tel:${cuisinier.telephone}`)}>
            <Phone className="w-5 h-5 text-yellow-600" />
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <UserCircle />
          <span className="font-bold">
            {cuisinier.prenom} {cuisinier.nom}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <BadgeFonction fonction={cuisinier.fonction} />
        </div>
        <div className="flex items-center gap-2">
          <Mail />
          <span>{cuisinier.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone />
          <span>{cuisinier.telephone}</span>
        </div>
        {cuisinier.date_ajout && (
          <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
            Ajouté le : {formatDateAjout(cuisinier.date_ajout)}
          </div>
        )}
        <div className="absolute bottom-2 right-2">
          <Button
            onClick={() => openEdit(cuisinier)}
            variant="secondary"
            className={`rounded-full shadow ${touchFeedback}`}>
            Ouvrir
          </Button>
        </div>
      </div>
    </motion.div>
  );

  const CreateCuisinierCard = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.98 }}
      className={`rounded-xl border-dashed border-2 border-primary bg-white p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/10 mb-4 ${touchFeedback}`}
      onClick={openAdd}>
      <Plus className="w-8 h-8 text-primary" />
      <span className="font-semibold text-primary mt-2">Créer cuisinier</span>
    </motion.div>
  );

  return (
    <>
      <HeaderNav />
      <div className="max-w-lg mx-auto p-2 min-h-screen">
        <CreateCuisinierCard />
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="animate-spin w-12 h-12 text-primary" />
          </div>
        ) : cuisiniers.length === 0 ? (
          <div className="text-center text-gray-500">
            <img
              src="/cuisinier.svg"
              alt=""
              className="mx-auto mb-2 w-32 opacity-80"
            />
            Aucun cuisinier.
            <br />
            Cliquez sur{" "}
            <span className="font-semibold text-primary">
              Créer cuisinier
            </span>{" "}
            pour commencer !
          </div>
        ) : (
          cuisiniers.map((l) => <CuisinierCard key={l.id} cuisinier={l} />)
        )}
        {dialogOpen && (
          <CuisinierDialog
            open={dialogOpen}
            mode={dialogMode}
            cuisinier={currentCuisinier}
            onClose={() => setDialogOpen(false)}
            onSubmit={handleDialogSubmit}
            disabled={loading || saving}
          />
        )}
        {/* AlertDialog global pour suppression douce */}
        <AlertDialog open={!!pendingDelete} onOpenChange={cancelDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la désactivation</AlertDialogTitle>
              <AlertDialogDescription>
                Voulez-vous vraiment désactiver{" "}
                <b>
                  {pendingDelete?.prenom} {pendingDelete?.nom}
                </b>
                &#8239;?
                <br />
                Cette action est{" "}
                <span className="text-red-600 font-bold">irréversible</span>. Le
                cuisinier ne sera plus affiché dans la liste.
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
