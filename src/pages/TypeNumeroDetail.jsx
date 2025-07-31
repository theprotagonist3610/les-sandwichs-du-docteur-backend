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
  Hash,
  Pencil,
  Trash,
  MoreHorizontal,
  Plus,
  Loader,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import TypeNumeroDialog from "@/components/TypeNumeroDialog";
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

const typeNumeroColRef = collection(db, "utils", "types_numeros", "options");

export default function TypeNumeroDetail() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("add");
  const [currentType, setCurrentType] = useState(null);

  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(
      typeNumeroColRef,
      (snap) => {
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((d) => d.statut !== false);
        setTypes(data);
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
    setCurrentType(null);
    setDialogMode("add");
    setDialogOpen(true);
  };
  const openEdit = (t) => {
    setCurrentType(t);
    setDialogMode("edit");
    setDialogOpen(true);
  };
  const openDetails = (t) => {
    setCurrentType(t);
    setDialogMode("details");
    setDialogOpen(true);
  };

  const requestDelete = (type) => setPendingDelete(type);

  const confirmDelete = async () => {
    const type = pendingDelete;
    if (!type) return;
    setPendingDelete(null);
    try {
      const docRef = doc(typeNumeroColRef, type.id);
      const deletePromise = setDoc(
        docRef,
        { ...type, statut: false },
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
            <CheckCircle2 className="text-green-600" /> Type supprimé.
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
    const id = formData.type
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, "-");
    if (dialogMode === "add") {
      if (types.find((t) => t.type === formData.type)) {
        toast.error(
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-500" /> Doublon
          </div>,
          { description: "Ce type existe déjà." }
        );
        return;
      }
      const newType = {
        ...formData,
        date_ajout: serverTimestamp(),
        statut: true,
      };
      const createPromise = setDoc(doc(typeNumeroColRef, id), newType);
      toast.promise(createPromise, {
        loading: (
          <div className="flex items-center gap-2">
            <Loader className="animate-spin" /> Création du type...
          </div>
        ),
        success: () => (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-green-600" /> Type ajouté !
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
      const editPromise = setDoc(doc(typeNumeroColRef, id), {
        ...formData,
        date_ajout: currentType.date_ajout || serverTimestamp(),
        statut: currentType.statut !== false,
      });
      toast.promise(editPromise, {
        loading: (
          <div className="flex items-center gap-2">
            <Loader className="animate-spin" /> Modification...
          </div>
        ),
        success: () => (
          <div className="flex items-center gap-2">
            <Info className="text-blue-600" /> Type modifié.
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

  const touchFeedback = "transition active:scale-95 active:bg-gray-100/80";

  const TypeCard = ({ typeNumero }) => (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      className={`relative rounded-xl border-2 border-teal-300 bg-white shadow group overflow-hidden mb-3 ${touchFeedback}`}>
      <div className="relative z-10 p-4 flex flex-col gap-2">
        <div className="absolute top-2 right-2 flex gap-1 z-20">
          <Button
            size="icon"
            variant="ghost"
            className={touchFeedback}
            onClick={() => requestDelete(typeNumero)}>
            <Trash className="w-5 h-5 text-red-500" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className={touchFeedback}
            onClick={() => openEdit(typeNumero)}>
            <Pencil className="w-5 h-5 text-blue-600" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className={touchFeedback}
            onClick={() => openDetails(typeNumero)}>
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Hash className="w-5 h-5 text-teal-600" />
          <span className="font-bold">{typeNumero.type}</span>
        </div>
        {typeNumero.date_ajout && (
          <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
            Ajouté le : {formatDateAjout(typeNumero.date_ajout)}
          </div>
        )}
        <div className="absolute bottom-2 right-2">
          <Button
            onClick={() => openEdit(typeNumero)}
            variant="secondary"
            className={`rounded-full shadow ${touchFeedback}`}>
            Ouvrir
          </Button>
        </div>
      </div>
    </motion.div>
  );

  const CreateTypeCard = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.98 }}
      className={`rounded-xl border-dashed border-2 border-teal-400 bg-white p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-teal-50 mb-4 ${touchFeedback}`}
      onClick={openAdd}>
      <Plus className="w-8 h-8 text-teal-600" />
      <span className="font-semibold text-teal-700 mt-2">
        Créer type de numéro
      </span>
    </motion.div>
  );

  return (
    <>
      <HeaderNav />
      <div className="max-w-lg mx-auto p-2 min-h-screen">
        <CreateTypeCard />
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="animate-spin w-12 h-12 text-teal-600" />
          </div>
        ) : types.length === 0 ? (
          <div className="text-center text-gray-500">
            <img
              src="/number_type.svg"
              alt=""
              className="mx-auto mb-2 w-32 opacity-80"
            />
            Aucun type.
            <br />
            Cliquez sur{" "}
            <span className="font-semibold text-teal-700">
              Créer type de numéro
            </span>{" "}
            pour commencer !
          </div>
        ) : (
          types.map((t) => <TypeCard key={t.id} typeNumero={t} />)
        )}
        {dialogOpen && (
          <TypeNumeroDialog
            open={dialogOpen}
            mode={dialogMode}
            typeNumero={currentType}
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
                Voulez-vous vraiment supprimer <b>{pendingDelete?.type}</b> ?
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
