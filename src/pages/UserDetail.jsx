import React, { useEffect, useState } from "react";
import { db } from "@/firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import {
  UserCircle,
  Mail,
  Phone,
  UserCog,
  BadgeCheck,
  Trash,
  Pencil,
  MoreHorizontal,
  Plus,
  Phone as PhoneIcon,
  Loader,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import UserDialog from "@/components/UserDialog";
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
  Superviseur: "bg-violet-100 border-violet-400 text-violet-800",
  Cuisinier: "bg-yellow-100 border-yellow-400 text-yellow-800",
  Vendeur: "bg-blue-100 border-blue-400 text-blue-800",
  Vendeuse: "bg-blue-100 border-blue-400 text-blue-800",
  Livreur: "bg-green-100 border-green-400 text-green-800",
  Default: "bg-gray-100 border-gray-400 text-gray-800",
};

const badgeColors = {
  Superviseur: "bg-violet-500 text-white",
  Cuisinier: "bg-yellow-500 text-white",
  Vendeur: "bg-blue-500 text-white",
  Vendeuse: "bg-blue-500 text-white",
  Livreur: "bg-green-500 text-white",
  Default: "bg-gray-400 text-white",
};

const fonctionToCollection = {
  Superviseur: "superviseurs",
  Cuisinier: "cuisiniers",
  Vendeur: "vendeuses",
  Vendeuse: "vendeuses",
  Livreur: "livreurs",
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

async function getAllUsersFromAllSousCollections() {
  const promises = Object.entries(fonctionToCollection).map(
    async ([fonction, colName]) => {
      const snap = await getDocs(collection(db, "utils", colName, "options"));
      return snap.docs
        .map((doc) => ({
          ...doc.data(),
          id: doc.id,
          fonction: fonction,
        }))
        .filter((u) => u.statut !== false); // Ne charge que statut !== false
    }
  );
  return (await Promise.all(promises)).flat();
}

export default function UserDetail() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("add");
  const [currentUser, setCurrentUser] = useState(null);

  const [pendingDelete, setPendingDelete] = useState(null);

  async function fetchUsers() {
    setLoading(true);
    try {
      const data = await getAllUsersFromAllSousCollections();
      setUsers(data);
    } catch (e) {
      toast.error(
        <div className="flex items-center gap-2">
          <AlertCircle className="text-red-500" />
          Erreur Firestore
        </div>,
        { description: e.message }
      );
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  const openAdd = () => {
    setCurrentUser(null);
    setDialogMode("add");
    setDialogOpen(true);
  };
  const openEdit = (u) => {
    setCurrentUser(u);
    setDialogMode("edit");
    setDialogOpen(true);
  };
  const openDetails = (u) => {
    setCurrentUser(u);
    setDialogMode("details");
    setDialogOpen(true);
  };

  // Suppression douce
  const requestDelete = (user) => setPendingDelete(user);

  const confirmDelete = async () => {
    const user = pendingDelete;
    if (!user) return;
    setPendingDelete(null);
    try {
      const colName = fonctionToCollection[user.fonction] || "autres";
      const userRef = doc(db, "utils", colName, "options", user.id);

      // suppression douce : update {statut:false}
      const deletePromise = updateDoc(userRef, { statut: false });

      toast.promise(deletePromise, {
        loading: (
          <div className="flex items-center gap-2">
            <Loader className="animate-spin" /> Suppression en cours...
          </div>
        ),
        success: () => (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-green-600" />{" "}
            {`${user.prenom} ${user.nom} a bien été supprimé.`}
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
      fetchUsers();
    } catch (e) {}
  };

  const cancelDelete = () => setPendingDelete(null);

  // CRUD logic centralisée ici !
  const handleDialogSubmit = async (formData) => {
    setDialogOpen(false);

    // Mode add
    if (dialogMode === "add") {
      const colName = fonctionToCollection[formData.fonction] || "autres";
      const id = `${formData.fonction}${formData.telephone}`;
      // Doublon global
      if (users.find((u) => u.id === id)) {
        toast.error(
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-500" /> Doublon
          </div>,
          { description: "Un utilisateur avec ce téléphone existe déjà." }
        );
        return;
      }
      const newUser = { ...formData, date_ajout: serverTimestamp() };
      const createPromise = setDoc(
        doc(db, "utils", colName, "options", id),
        newUser
      );
      toast.promise(createPromise, {
        loading: (
          <div className="flex items-center gap-2 bg-slate-200">
            <Loader className="animate-spin" /> Création de l'utilisateur...
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
      fetchUsers();
      return;
    }

    // Mode edit (fonction ou tel modifiables)
    if (dialogMode === "edit") {
      const oldUser = formData.oldUser || currentUser;
      const oldFonction = oldUser?.fonction;
      const oldTel = oldUser?.telephone;
      const oldCol = fonctionToCollection[oldFonction] || "autres";
      const oldId = `${oldFonction}${oldTel}`;
      const newCol = fonctionToCollection[formData.fonction] || "autres";
      const newId = `${formData.fonction}${formData.telephone}`;

      // Si fonction ou téléphone changé, on copie et supprime l'ancien
      if (oldCol !== newCol || oldId !== newId) {
        await toast.promise(
          Promise.all([
            setDoc(doc(db, "utils", newCol, "options", newId), {
              ...formData,
              date_ajout: oldUser.date_ajout || serverTimestamp(),
            }),
            updateDoc(doc(db, "utils", oldCol, "options", oldId), {
              statut: false,
            }),
          ]),
          {
            loading: (
              <div className="flex items-center gap-2">
                <Loader className="animate-spin" /> Transfert/édition...
              </div>
            ),
            success: (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-green-600" /> Utilisateur
                transféré et modifié !
              </div>
            ),
            error: (err) => (
              <div className="flex items-center gap-2 text-red-600">
                Erreur : {err?.message || "Erreur lors du transfert"}
              </div>
            ),
          }
        );
      } else {
        // Sinon modif simple
        await toast.promise(
          setDoc(doc(db, "utils", newCol, "options", newId), {
            ...formData,
            date_ajout: oldUser.date_ajout || serverTimestamp(),
          }),
          {
            loading: (
              <div className="flex items-center gap-2">
                <Loader className="animate-spin" /> Modification...
              </div>
            ),
            success: (
              <div className="flex items-center gap-2">
                <Info className="text-blue-600" /> Utilisateur modifié !
              </div>
            ),
            error: (err) => (
              <div className="flex items-center gap-2 text-red-600">
                Erreur : {err?.message || "Erreur lors de la modification"}
              </div>
            ),
          }
        );
      }
      fetchUsers();
      return;
    }
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

  const UserCard = ({ user }) => (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      className={`relative rounded-xl border-2 ${
        fonctionColors[user.fonction] || fonctionColors.Default
      } bg-white shadow group overflow-hidden mb-3 ${touchFeedback}`}>
      <div className="relative z-10 p-4 flex flex-col gap-2">
        <div className="absolute top-2 right-2 flex gap-1 z-20">
          <Button
            size="icon"
            variant="ghost"
            className={touchFeedback}
            onClick={() => requestDelete(user)}>
            <Trash className="w-5 h-5 text-red-500" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className={touchFeedback}
            onClick={() => openEdit(user)}>
            <Pencil className="w-5 h-5 text-blue-600" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className={touchFeedback}
            onClick={() => openDetails(user)}>
            <MoreHorizontal className="w-5 h-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className={touchFeedback}
            onClick={() => window.open(`tel:${user.telephone}`)}>
            <PhoneIcon className="w-5 h-5 text-green-600" />
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <UserCircle />
          <span className="font-bold">
            {user.prenom} {user.nom}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <BadgeFonction fonction={user.fonction} />
        </div>
        <div className="flex items-center gap-2">
          <Mail />
          <span>{user.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone />
          <span>{user.telephone}</span>
        </div>
        <div className="flex items-center gap-2">
          <UserCog />
          <span>{user.role}</span>
        </div>
        {user.date_ajout && (
          <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
            Ajouté le : {formatDateAjout(user.date_ajout)}
          </div>
        )}
        <div className="absolute bottom-2 right-2">
          <Button
            onClick={() => openEdit(user)}
            variant="secondary"
            className={`rounded-full shadow ${touchFeedback}`}>
            Ouvrir
          </Button>
        </div>
      </div>
    </motion.div>
  );

  const CreateUserCard = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.98 }}
      className={`rounded-xl border-dashed border-2 border-primary bg-white p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/10 mb-4 ${touchFeedback}`}
      onClick={openAdd}>
      <Plus className="w-8 h-8 text-primary" />
      <span className="font-semibold text-primary mt-2">Créer utilisateur</span>
    </motion.div>
  );

  return (
    <>
      <HeaderNav />
      <div className="max-w-lg mx-auto p-2 min-h-screen">
        <CreateUserCard />
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="animate-spin w-12 h-12 text-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center text-gray-500">
            <img
              src="/empty_list.svg"
              alt=""
              className="mx-auto mb-2 w-32 opacity-80"
            />
            Aucun utilisateur.
            <br />
            Cliquez sur{" "}
            <span className="font-semibold text-primary">
              Créer utilisateur
            </span>{" "}
            pour commencer !
          </div>
        ) : (
          users.map((u) => <UserCard key={u.id} user={u} />)
        )}
        {dialogOpen && (
          <UserDialog
            open={dialogOpen}
            mode={dialogMode}
            user={currentUser}
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
