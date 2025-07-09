// 📁 src/components/KPIIndicators.jsx
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Truck, Smile, AlertTriangle, DollarSign } from "lucide-react";

export default function KPIIndicators({ data }) {
  const {
    caJournalier,
    commandesEnAttente,
    livraisons,
    satisfaction,
    stockCritique
  } = data;

  const kpis = [
    { icon: <DollarSign className="text-bordeaux" />, label: "CA Journalier", value: `${caJournalier} FCFA` },
    { icon: <ShoppingCart className="text-orangeclair" />, label: "Commandes", value: commandesEnAttente },
    { icon: <Truck className="text-orangedark" />, label: "Livraisons", value: livraisons },
    { icon: <Smile className="text-bordeaux" />, label: "Satisfaction", value: `${satisfaction} %` },
    { icon: <AlertTriangle className="text-red-600" />, label: "Stock Critique", value: stockCritique },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {kpis.map((kpi, index) => (
        <Card key={index} className="rounded-2xl shadow-md">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-3 bg-beige rounded-full">
              {kpi.icon}
            </div>
            <div>
              <p className="text-sm text-gray-500">{kpi.label}</p>
              <p className="text-lg font-semibold">{kpi.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


// 📁 src/components/QuickActions.jsx
import { Button } from "@/components/ui/button";
import { PlusCircle, PackagePlus, ClipboardList, FileText } from "lucide-react";

export default function QuickActions() {
  const actions = [
    { icon: <PlusCircle />, label: "Nouvelle Commande" },
    { icon: <PackagePlus />, label: "Ajouter Stock" },
    { icon: <ClipboardList />, label: "Nouvelle Production" },
    { icon: <FileText />, label: "Rapport Journalier" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {actions.map((action, index) => (
        <Button key={index} className="rounded-2xl bg-bordeaux hover:bg-orangedark text-white flex flex-col items-center gap-1 p-4">
          {action.icon}
          <span className="text-sm">{action.label}</span>
        </Button>
      ))}
    </div>
  );
}


// 📁 src/components/Graphs.jsx
import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, Legend } from "recharts";

export function SalesGraph({ data }) {
  return (
    <Card className="rounded-2xl shadow-md">
      <CardContent>
        <h3 className="text-lg font-semibold mb-2">Ventes Hebdomadaires</h3>
        <LineChart width={300} height={200} data={data}>
          <Line type="monotone" dataKey="ventes" stroke="#a41624" />
          <CartesianGrid stroke="#ccc" />
          <XAxis dataKey="jour" />
          <YAxis />
          <Tooltip />
        </LineChart>
      </CardContent>
    </Card>
  );
}

export function ProductionForecast({ data }) {
  return (
    <Card className="rounded-2xl shadow-md">
      <CardContent>
        <h3 className="text-lg font-semibold mb-2">Prévision Production</h3>
        <LineChart width={300} height={200} data={data}>
          <Line type="monotone" dataKey="production" stroke="#d9571d" />
          <CartesianGrid stroke="#ccc" />
          <XAxis dataKey="jour" />
          <YAxis />
          <Tooltip />
        </LineChart>
      </CardContent>
    </Card>
  );
}

export function EmployeePerformance({ data }) {
  return (
    <Card className="rounded-2xl shadow-md">
      <CardContent>
        <h3 className="text-lg font-semibold mb-2">Performance Employés</h3>
        <BarChart width={300} height={200} data={data}>
          <Bar dataKey="commandes" fill="#ffb564" />
          <XAxis dataKey="employe" />
          <YAxis />
          <Tooltip />
          <Legend />
        </BarChart>
      </CardContent>
    </Card>
  );
}


// 📁 src/components/RecentLists.jsx
import { Card, CardContent } from "@/components/ui/card";

export function RecentDeliveries({ deliveries }) {
  return (
    <Card className="rounded-2xl shadow-md">
      <CardContent>
        <h3 className="text-lg font-semibold mb-2">Dernières Livraisons</h3>
        <ul className="text-sm space-y-2">
          {deliveries.map((item, idx) => (
            <li key={idx} className="border-b pb-1">{item}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function RecentProductions({ productions }) {
  return (
    <Card className="rounded-2xl shadow-md">
      <CardContent>
        <h3 className="text-lg font-semibold mb-2">Dernières Productions</h3>
        <ul className="text-sm space-y-2">
          {productions.map((item, idx) => (
            <li key={idx} className="border-b pb-1">{item}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}


// 📁 src/components/PerformanceSummary.jsx
import { Card, CardContent } from "@/components/ui/card";

export default function PerformanceSummary({ daily, weekly, monthly }) {
  return (
    <Card className="rounded-2xl shadow-md">
      <CardContent>
        <h3 className="text-lg font-semibold mb-2">Résumé de Performance</h3>
        <ul className="text-sm space-y-2">
          <li>Journalier : {daily}</li>
          <li>Hebdomadaire : {weekly}</li>
          <li>Mensuel : {monthly}</li>
        </ul>
      </CardContent>
    </Card>
  );
}


// 📁 src/components/BottomNav.jsx
import { Home, ClipboardList, Box, BarChart3, Cog } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function BottomNav() {
  const { pathname } = useLocation();

  const tabs = [
    { to: "/", icon: <Home />, label: "Accueil" },
    { to: "/commandes", icon: <ClipboardList />, label: "Commandes" },
    { to: "/stocks", icon: <Box />, label: "Stocks" },
    { to: "/statistiques", icon: <BarChart3 />, label: "Stats" },
    { to: "/production", icon: <Cog />, label: "Production" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-lg flex justify-around py-2">
      {tabs.map((tab, index) => (
        <Link key={index} to={tab.to} className={pathname === tab.to ? "text-bordeaux" : "text-gray-500"}>
          <div className="flex flex-col items-center">
            {tab.icon}
            <span className="text-xs">{tab.label}</span>
          </div>
        </Link>
      ))}
    </nav>
  );
}


// 📁 src/pages/Dashboard.jsx
import KPIIndicators from "../components/KPIIndicators";
import QuickActions from "../components/QuickActions";
import { SalesGraph, ProductionForecast, EmployeePerformance } from "../components/Graphs";
import { RecentDeliveries, RecentProductions } from "../components/RecentLists";
import PerformanceSummary from "../components/PerformanceSummary";
import BottomNav from "../components/BottomNav";

export default function Dashboard() {
  const dummyData = {
    caJournalier: 45000,
    commandesEnAttente: 5,
    livraisons: 8,
    satisfaction: 92,
    stockCritique: 2,
  };

  const ventes = [
    { jour: 'Lun', ventes: 5 },
    { jour: 'Mar', ventes: 8 },
    { jour: 'Mer', ventes: 4 },
    { jour: 'Jeu', ventes: 7 },
    { jour: 'Ven', ventes: 6 },
    { jour: 'Sam', ventes: 9 },
    { jour: 'Dim', ventes: 3 },
  ];

  const prevision = ventes.map(v => ({ jour: v.jour, production: v.ventes + 1 }));

  const performances = [
    { employe: 'Anna', commandes: 10 },
    { employe: 'John', commandes: 8 },
    { employe: 'Léa', commandes: 12 },
  ];

  return (
    <div className="p-4 pb-20 space-y-6">
      <KPIIndicators data={dummyData} />
      <QuickActions />
      <SalesGraph data={ventes} />
      <ProductionForecast data={prevision} />
      <EmployeePerformance data={performances} />
      <RecentDeliveries deliveries={["Cmd #001", "Cmd #002", "Cmd #003"]} />
      <RecentProductions productions={["Prod #001", "Prod #002"]} />
      <PerformanceSummary daily="45 000 FCFA" weekly="315 000 FCFA" monthly="1 350 000 FCFA" />
      <BottomNav />
    </div>
  );
} 
