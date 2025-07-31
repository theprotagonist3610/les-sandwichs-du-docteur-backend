import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  Menu,
  PlusCircle,
  Package,
  CalendarClock,
  Timer,
  MapPin,
  Layers,
  ShoppingBag,
} from "lucide-react";
import HeaderNav from "@/components/HeaderNav";
export default function StockManagement() {
  const [stocks, setStocks] = useState([]);
  const [search, setSearch] = useState("");
  const [summary, setSummary] = useState({ total: 0, kiosques: 0 });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "stocks"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ idr: doc.id, ...doc.data() }));
      setStocks(data);

      const kiosques = new Set(data.map((item) => item.emplacement)).size;
      setSummary({ total: data.length, kiosques });
    });
    return () => unsubscribe();
  }, []);

  const getBorderColor = (stock) => {
    if (stock.stock_actuel.valeur <= stock.seuils.critique)
      return "border-red-500";
    if (stock.stock_actuel.valeur <= stock.seuils.alerte)
      return "border-yellow-500";
    return "border-green-500";
  };

  const filteredStocks = stocks.filter((item) =>
    item.denomination.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      {/* Header mobile */}
      <HeaderNav />

      <div className="p-4 space-y-4">
        {/* Résumé */}
        <Card className="shadow-sm bg-white rounded-xl">
          <CardContent className="p-4 space-y-1">
            <h2 className="text-base font-semibold">Résumé des Stocks</h2>
            <p className="text-sm text-gray-700">
              Ingrédients disponibles : {summary.total}
            </p>
            <p className="text-sm text-gray-700">
              Kiosques : {summary.kiosques}
            </p>
          </CardContent>
        </Card>
        <Input
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-32 text-sm"
        />
        {/* Ajout */}
        <Button className="w-full flex items-center gap-2 text-sm bg-[#a41624] text-white rounded-xl">
          <PlusCircle size={16} /> Ajouter un element
        </Button>

        {/* Liste */}
        <div className="grid grid-cols-1 gap-4">
          {filteredStocks.map((stock) => (
            <Link to={`/stocks/${stock.idr}`} key={stock.idr}>
              <Card
                className={`border-2 ${getBorderColor(
                  stock
                )} hover:bg-orange-100/40 transition-colors rounded-xl shadow-sm`}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold capitalize flex items-center gap-2 text-[#a41624]">
                      <ShoppingBag size={18} />
                      {stock.denomination}
                    </h3>
                    {stock.stock_actuel.valeur <= stock.seuils.critique && (
                      <AlertTriangle className="text-red-600" size={20} />
                    )}
                  </div>

                  <div className="text-sm text-gray-700 space-y-1">
                    <p className="flex items-center gap-2">
                      <Layers size={14} />
                      Catégorie : {stock.categorie}
                    </p>
                    <p className="flex items-center gap-2">
                      <Package size={14} />
                      Quantité : {stock.stock_actuel.valeur} {stock.unite}
                    </p>
                    <p className="flex items-center gap-2">
                      <Package size={14} />
                      Conditionnement : {stock.conditionnement?.type} (
                      {stock.conditionnement?.nombre})
                    </p>
                    <p className="flex items-center gap-2">
                      <CalendarClock size={14} />
                      Péremption : {stock.etat_peremption}
                    </p>
                    <p className="flex items-center gap-2">
                      <Timer size={14} />
                      Rupture prévue :{" "}
                      {stock.rotation?.prevision_rup
                        ?.toDate?.()
                        .toLocaleDateString() ?? "N/A"}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin size={14} />
                      Emplacement : {stock.emplacement}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/*
{
  "id": "piment_001",
  "denomination": "piment",
  "categorie": "épices",
  "unite": "g",
  "emplacement": {"entrepot": "A12", "etagere": "B3"},
  "stock_actuel": {"valeur": 10, "unite": "g", "date_maj": "2024-03-20"},
  "seuils": {"critique": 20, "alerte": 50, "optimal": 100},
  "historique": [
    {
      "type": "achat",
      "quantite": 10,
      "prix_unitaire": 200,
      "prix_total": 2000,
      "date": "2024-03-10T14:30:00Z",
      "fournisseur": "EpicesSA",
      "batch": "LOT-2024-03"
    }
  ],
  "cout": {"moyen_achat": 200, "prix_vente": 300, "devise": "XOF"},
  "date_expiration": "2024-12-31"
}
*/

/*
{
  "id": "piment_001",
  "denomination": "piment",
  "categorie": "épices",
  "unite": "g",
  "stock_actuel": { "valeur": 10, "unite": "g", "date_maj": "2024-03-20" },
  "seuils": { "critique": 20, "alerte": 50, "optimal": 100 },
  "cout": { "moyen_achat": 200, "prix_vente": 300, "devise": "XOF" },
  "date_expiration": "2024-12-31",
  "etat_peremption": "proche" | "ok" | "expiré",
  "rotation": {
    "vitesse": "rapide" | "moyenne" | "lente",
    "consommation_moyenne_hebdo": 1200,
    "prevision_rup": "2025-07-12"
  },
  "emplacement": "Entrepot A15",
  "historique": [...],
  "conditionnement": { "type": "sachet", "contenance": 1000, "nombre": 3 }
}

*/
