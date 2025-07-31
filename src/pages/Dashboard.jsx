import HeaderNav from "@/components/HeaderNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import {
  User2,
  PlusCircle,
  PackagePlus,
  FileText,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import { db } from "@/firebase";

export default function Dashboard() {
  const [stats, setStats] = useState({
    ca: 0,
    caSemaine: 0,
    caJourPrecedent: 0,
    caSemainePrecedente: 0,
    commandesJour: 0,
    commandesTotal: 0,
    commandesJourPrecedent: 0,
    stockCritique: 0,
    benefice: 0,
  });

  const [ventes, setVentes] = useState([]);
  const [couts, setCouts] = useState([
    { type: "Sandwich", cout: 0 },
    { type: "Box Sandwich", cout: 0 },
  ]);

  useEffect(() => {
    async function fetchData() {
      const commandesSnapshot = await getDocs(collection(db, "commandes"));
      const statsSnapshot = await getDocs(collection(db, "statistiques"));

      const commandesDocs = commandesSnapshot.docs;
      const commandesJour = commandesDocs.filter(
        (doc) =>
          doc.data().date === new Date().toISOString().split("T")[0] &&
          doc.data().statut === "en attente"
      ).length;

      setStats({
        ca: statsSnapshot.docs[0]?.data().ca_jour || 0,
        caSemaine: statsSnapshot.docs[0]?.data().ca_semaine || 0,
        caJourPrecedent: statsSnapshot.docs[0]?.data().ca_jour_prec || 0,
        caSemainePrecedente: statsSnapshot.docs[0]?.data().ca_semaine_prec || 0,
        commandesJour,
        commandesTotal: commandesDocs.filter(
          (doc) => doc.data().statut === "en attente"
        ).length,
        commandesJourPrecedent: 8,
        stockCritique: 2,
        benefice: statsSnapshot.docs[0]?.data().benefice || 0,
      });

      const ventesData = statsSnapshot.docs.map((doc) => ({
        name: doc.data().date,
        ventes: doc.data().ca_total,
      }));
      setVentes(ventesData.slice(-7));
    }

    fetchData();
  }, []);

  const variation = (current, previous) => {
    if (previous === 0) return { percent: 0, direction: null };
    const diff = current - previous;
    const percent = Math.abs((diff / previous) * 100).toFixed(1);
    return {
      percent,
      direction: diff >= 0 ? "up" : "down",
    };
  };

  const caJourVariation = variation(stats.ca, stats.caJourPrecedent);
  const caSemaineVariation = variation(
    stats.caSemaine,
    stats.caSemainePrecedente
  );
  const commandesVariation = variation(
    stats.commandesJour,
    stats.commandesJourPrecedent
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderNav />

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <h2 className="text-base font-semibold mb-2">
                Chiffre d'affaires
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Aujourd'hui</p>
                  <p className="text-xl font-bold text-orange-600">
                    {stats.ca} FCFA
                  </p>
                  {caJourVariation.direction && (
                    <p
                      className={`text-sm flex items-center gap-1 ${
                        caJourVariation.direction === "up"
                          ? "text-green-600"
                          : "text-red-500"
                      }`}>
                      {caJourVariation.direction === "up" ? (
                        <ArrowUpRight size={14} />
                      ) : (
                        <ArrowDownRight size={14} />
                      )}
                      {caJourVariation.percent}%
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cette semaine</p>
                  <p className="text-xl font-bold text-orange-600">
                    {stats.caSemaine} FCFA
                  </p>
                  {caSemaineVariation.direction && (
                    <p
                      className={`text-sm flex items-center gap-1 ${
                        caSemaineVariation.direction === "up"
                          ? "text-green-600"
                          : "text-red-500"
                      }`}>
                      {caSemaineVariation.direction === "up" ? (
                        <ArrowUpRight size={14} />
                      ) : (
                        <ArrowDownRight size={14} />
                      )}
                      {caSemaineVariation.percent}%
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4">
              <h2 className="text-base font-semibold mb-2">
                Commandes en attente
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Aujourd'hui</p>
                  <p className="text-xl font-bold">{stats.commandesJour}</p>
                  {commandesVariation.direction && (
                    <p
                      className={`text-sm flex items-center gap-1 ${
                        commandesVariation.direction === "up"
                          ? "text-green-600"
                          : "text-red-500"
                      }`}>
                      {commandesVariation.direction === "up" ? (
                        <ArrowUpRight size={14} />
                      ) : (
                        <ArrowDownRight size={14} />
                      )}
                      {commandesVariation.percent}%
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-xl font-bold">{stats.commandesTotal}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4">
              <h2 className="text-base font-semibold">Bénéfice</h2>
              <p className="text-xl font-bold text-green-600">
                {stats.benefice} FCFA
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-4">
              <h2 className="text-base font-semibold">Stock Critique</h2>
              <p className="text-xl font-bold text-red-500">
                {stats.stockCritique}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <h2 className="text-base font-semibold mb-2">
              Ventes (7 derniers jours)
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={ventes}>
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="ventes"
                  stroke="#d9571d"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-4">
            <h2 className="text-base font-semibold mb-2">
              Coût moyen de production
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={couts}>
                <XAxis dataKey="type" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="cout" fill="#ffb564" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="flex items-center gap-2 text-sm">
            <PlusCircle size={16} /> Nouvelle Vente
          </Button>
          <Button variant="outline" className="flex items-center gap-2 text-sm">
            <PackagePlus size={16} /> Ajouter Stock
          </Button>
          <Button variant="outline" className="flex items-center gap-2 text-sm">
            <FileText size={16} /> Rapport
          </Button>
          <Button variant="outline" className="flex items-center gap-2 text-sm">
            <PlusCircle size={16} /> Nouvelle Dépense
          </Button>
        </div>
      </div>
    </div>
  );
}
