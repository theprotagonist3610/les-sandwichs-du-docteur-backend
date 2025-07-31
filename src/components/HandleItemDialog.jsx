// AdminPage.jsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getDocs, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Users,
  Truck,
  UserCircle,
  Store,
  CreditCard,
  MapPin,
  Phone,
  X,
  Edit,
  Trash,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import {
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
  addDoc,
  collection as fsCollection,
} from "firebase/firestore";

const optionsTypes = [
  { id: "utilisateurs", label: "Utilisateur", icon: Users },
  { id: "livreurs", label: "Livreur", icon: Truck },
  { id: "vendeuses", label: "Vendeuse", icon: UserCircle },
  { id: "points_de_vente", label: "Point de vente", icon: Store },
  { id: "moyens_de_paiement", label: "Moyen de paiement", icon: CreditCard },
  { id: "adresses_de_livraison", label: "Adresse de livraison", icon: MapPin },
  { id: "types_de_numero", label: "Type de numéro", icon: Phone },
];

function HandleItemDialog({ item, onClose }) {
  const [options, setOptions] = useState([]);
  const [newOption, setNewOption] = useState("");

  useEffect(() => {
    async function fetchOptions() {
      const snapshot = await getDocs(
        collection(db, "utils", item.id, "options")
      );
      setOptions(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    }
    fetchOptions();
  }, [item.id]);

  const handleAddOption = async () => {
    if (!newOption.trim()) return;
    const snapshot = await getDocs(
      fsCollection(db, "utils", item.id, "options")
    );
    const existing = snapshot.docs.find(
      (doc) => doc.data().nom.toLowerCase() === newOption.toLowerCase()
    );
    if (existing) return toast.error("Cette option existe déjà.");
    await addDoc(fsCollection(db, "utils", item.id, "options"), {
      nom: newOption,
    });
    toast.success("Option ajoutée !");
    setNewOption("");
    const refreshed = await getDocs(
      fsCollection(db, "utils", item.id, "options")
    );
    setOptions(refreshed.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  const handleDelete = async (optionId) => {
    const confirm = window.confirm("Supprimer cette option ?");
    if (!confirm) return;
    await deleteDoc(doc(db, "utils", item.id, "options", optionId));
    setOptions((prev) => prev.filter((opt) => opt.id !== optionId));
    toast.success("Option supprimée.");
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full p-6">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Gérer {item.label}</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="space-y-2 mb-4">
              {options.map((opt) => (
                <div
                  key={opt.id}
                  className="flex items-center justify-between border rounded px-3 py-2">
                  <Badge>{opt.nom}</Badge>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(opt.id)}>
                      <Trash className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                placeholder="Nouvelle option..."
              />
              <Button onClick={handleAddOption}>Ajouter</Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminPage() {
  const [counts, setCounts] = useState({});
  const [activeItem, setActiveItem] = useState(null);

  useEffect(() => {
    async function fetchCounts() {
      const newCounts = {};
      for (const type of optionsTypes) {
        const snapshot = await getDocs(
          collection(db, "utils", type.id, "options")
        );
        newCounts[type.id] = snapshot.size;
      }
      setCounts(newCounts);
    }
    fetchCounts();
  }, []);

  return (
    <div className="p-4 space-y-6">
      {optionsTypes.map(({ id, label, icon: Icon }) => (
        <div
          key={id}
          className="border rounded-2xl shadow-md p-6 bg-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-gray-100 p-3 rounded-full">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-1">{label}</h2>
              <p className="text-sm text-gray-600">
                Vous avez actuellement {counts[id] ?? "..."}{" "}
                {label.toLowerCase()}s
              </p>
            </div>
          </div>
          <Button onClick={() => setActiveItem({ id, label })}>
            Gérer {label.toLowerCase()}
          </Button>
        </div>
      ))}
      {activeItem && (
        <HandleItemDialog
          item={activeItem}
          onClose={() => setActiveItem(null)}
        />
      )}
    </div>
  );
}
