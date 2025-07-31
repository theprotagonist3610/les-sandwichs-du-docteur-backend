import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import HeaderNav from "@/components/HeaderNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  History,
  ArrowLeft,
  Package,
  Timer,
  MapPin,
  CalendarClock,
  Layers,
  BadgeDollarSign,
  PlusCircle,
} from "lucide-react";
import StockHistoryModal from "@/components/StockHistoryModal";
import EditableItem from "@/components/EditableItem"; // nouveau composant pour les champs éditables

export default function StockDetail() {
  const id = useLocation().pathname.split("/")[2];
  const navigate = useNavigate();
  const [stock, setStock] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchStock = async () => {
      const docRef = doc(db, "stocks", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setStock({ idr: docSnap.id, ...docSnap.data() });
      }
    };
    fetchStock();
  }, [id]);

  if (!stock) return <div className="p-4 text-center">Chargement...</div>;

  return (
    <div className="min-h-screen">
      <HeaderNav />

      {/* Toolbar */}
      <div className="flex justify-between items-center px-4 py-2 bg-white shadow-sm">
        <Button
          variant="ghost"
          onClick={() => navigate("/stocks")}
          className="!text-xs">
          <ArrowLeft size={16} className="mr-2" /> Retour
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowHistory(true)}
            className="!text-xs">
            <History size={16} className="mr-2" /> Historique
          </Button>
          <Button className="bg-[#a41624] text-white !text-xs">
            <PlusCircle size={16} className="mr-2" /> Ajouter
          </Button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="p-4 space-y-4">
        <Card className="rounded-xl shadow-md">
          <CardContent className="p-4 space-y-2">
            <h2 className="text-lg font-bold text-[#a41624]">
              Détails de l'ingrédient
            </h2>
            <EditableItem
              docId={stock.idr}
              path="denomination"
              icon={Package}
              label="Nom"
              value={stock.denomination}
            />
            <EditableItem
              docId={stock.idr}
              path="categorie"
              icon={Layers}
              label="Catégorie"
              value={stock.categorie}
            />
            <EditableItem
              docId={stock.idr}
              path="cout.moyen_achat"
              icon={BadgeDollarSign}
              label="Coût moyen (XOF)"
              value={stock.cout?.moyen_achat}
            />
            <EditableItem
              docId={stock.idr}
              path="stock_actuel.valeur"
              icon={Timer}
              label="Quantité actuelle"
              value={stock.stock_actuel.valeur}
              unit={stock.unite}
            />
            <EditableItem
              docId={stock.idr}
              path="etat_peremption"
              icon={CalendarClock}
              label="Péremption"
              value={stock.etat_peremption}
            />
            <EditableItem
              docId={stock.idr}
              path="emplacement"
              icon={MapPin}
              label="Emplacement"
              value={stock.emplacement}
            />
            <EditableItem
              docId={stock.idr}
              path="rotation.prevision_rup"
              icon={Timer}
              label="Rupture prévue"
              value={
                stock.rotation?.prevision_rup
                  ?.toDate?.()
                  .toLocaleDateString() || "N/A"
              }
            />
            <EditableItem
              docId={stock.idr}
              path="conditionnement.type"
              icon={Layers}
              label="Conditionnement"
              value={stock.conditionnement?.type}
            />
            <EditableItem
              docId={stock.idr}
              path="conditionnement.nombre"
              icon={Layers}
              label="Nombre de conditionnements"
              value={stock.conditionnement?.nombre}
            />
          </CardContent>
        </Card>
      </div>

      {/* Modale historique */}
      <StockHistoryModal
        open={showHistory}
        onClose={() => setShowHistory(false)}
        historique={stock.historique || []}
      />
    </div>
  );
}
