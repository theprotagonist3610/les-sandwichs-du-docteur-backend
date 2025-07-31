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
  Loader,
  Plus,
  Pencil,
  Trash,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AdresseDialog from "@/components/AdresseDialog";
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

const adressesColRef = collection(db, "utils", "adresses", "options");
const livreursColRef = collection(db, "utils", "livreurs", "options");
const pointsDeVenteColRef = collection(db, "utils", "points_vente", "options");

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

export default function AdresseDetail() {
  const [adresses, setAdresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("add");
  const [currentAdresse, setCurrentAdresse] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  // Pour les livreurs et points de vente
  const [livreurs, setLivreurs] = useState([]);
  const [pointsDeVente, setPointsDeVente] = useState([]);

  // Chargement des adresses
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(adressesColRef, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAdresses(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Chargement des livreurs et points de vente
  useEffect(() => {
    const unsubLivreurs = onSnapshot(livreursColRef, (snap) => {
      setLivreurs(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((l) => l.statut !== false)
      );
    });
    const unsubPV = onSnapshot(pointsDeVenteColRef, (snap) => {
      setPointsDeVente(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((pv) => pv.statut !== false)
      );
    });
    return () => {
      unsubLivreurs();
      unsubPV();
    };
  }, []);

  // Dialog handlers
  const openAdd = () => {
    setCurrentAdresse(null);
    setDialogMode("add");
    setDialogOpen(true);
  };
  const openEdit = (a) => {
    setCurrentAdresse(a);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  // Suppression douce
  const requestDelete = (adresse) => setPendingDelete(adresse);
  const confirmDelete = async () => {
    const adresse = pendingDelete;
    if (!adresse) return;
    setPendingDelete(null);
    try {
      const ref = doc(adressesColRef, adresse.id);
      await updateDoc(ref, { statut: false });
      toast.success("Adresse désactivée.");
    } catch (e) {
      toast.error("Erreur lors de la suppression.");
    }
  };
  const cancelDelete = () => setPendingDelete(null);

  // Ajout/modification
  const handleDialogSubmit = async (formData) => {
    setDialogOpen(false);
    const id =
      `${formData.departement}_${formData.ville}_${formData.quartier}`.replace(
        /\s+/g,
        "_"
      );
    const now = serverTimestamp();
    try {
      await setDoc(doc(adressesColRef, id), {
        ...formData,
        date_ajout: formData.date_ajout || now,
        statut: formData.statut === false ? false : true,
      });
      toast.success(
        dialogMode === "add" ? "Adresse créée !" : "Adresse modifiée !"
      );
    } catch (e) {
      toast.error("Erreur lors de l'enregistrement.");
    }
  };

  // Card d’adresse avec gestion "n tarifs restants"
  const AdresseCard = ({ adresse }) => {
    const tarifs = Array.isArray(adresse.tarifs) ? adresse.tarifs : [];
    const toShow = tarifs.slice(0, 3);
    const rest = tarifs.length - 3;
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        className="relative rounded-xl border bg-white shadow p-4 mb-3">
        <div className="flex flex-col gap-1">
          <div className="font-bold text-lg">
            {adresse.ville} ({adresse.departement})
          </div>
          <div className="text-sm text-gray-600">
            Quartier : {adresse.quartier}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {adresse.date_ajout &&
              "Ajouté le : " + formatDateAjout(adresse.date_ajout)}
          </div>
        </div>
        <div className="mt-2">
          {tarifs.length === 0 ? (
            <span className="text-xs text-gray-400">
              Aucun tarif enregistré
            </span>
          ) : (
            <>
              <table className="w-full text-xs border mb-1">
                <thead>
                  <tr>
                    <th className="font-semibold">Livreur</th>
                    <th>Départ</th>
                    <th>Tarif</th>
                  </tr>
                </thead>
                <tbody>
                  {toShow.map((t, i) => (
                    <tr key={i} className="border-t">
                      <td>{t.livreur_nom}</td>
                      <td>{t.depart_nom}</td>
                      <td>{t.tarif} FCFA</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rest > 0 && (
                <div className="text-xs text-gray-500">
                  {rest} tarifs restants...
                </div>
              )}
            </>
          )}
        </div>
        <div className="absolute top-3 right-3 flex gap-2">
          <Button size="icon" variant="ghost" onClick={() => openEdit(adresse)}>
            <Pencil className="w-5 h-5 text-blue-600" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => requestDelete(adresse)}>
            <Trash className="w-5 h-5 text-red-500" />
          </Button>
        </div>
      </motion.div>
    );
  };

  const CreateCard = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.98 }}
      className="rounded-xl border-dashed border-2 border-primary bg-white p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/10 mb-4"
      onClick={openAdd}>
      <Plus className="w-8 h-8 text-primary" />
      <span className="font-semibold text-primary mt-2">
        Ajouter une adresse
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
        ) : adresses.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            <img
              src="/livraison.svg"
              alt=""
              className="mx-auto mb-2 w-32 opacity-80"
            />
            Aucune adresse enregistrée.
          </div>
        ) : (
          adresses
            .filter((a) => a.statut !== false)
            .map((a) => <AdresseCard key={a.id} adresse={a} />)
        )}

        {dialogOpen && (
          <AdresseDialog
            open={dialogOpen}
            mode={dialogMode}
            adresse={currentAdresse}
            onClose={() => setDialogOpen(false)}
            onSubmit={handleDialogSubmit}
            disabled={loading}
            livreurs={livreurs}
            pointsDeVente={pointsDeVente}
          />
        )}

        {/* AlertDialog pour suppression */}
        <AlertDialog open={!!pendingDelete} onOpenChange={cancelDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Voulez-vous vraiment désactiver cette adresse&nbsp;? <br />
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
