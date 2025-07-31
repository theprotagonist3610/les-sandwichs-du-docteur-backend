import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function StockHistoryModal({ open, onClose, historique }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [tab, setTab] = useState("tableau");

  const typeColors = {
    achat: "bg-green-100 text-green-700",
    perte: "bg-red-100 text-red-700",
    vente: "bg-yellow-100 text-yellow-800",
    production: "bg-blue-100 text-blue-800",
  };

  const operationStats = historique.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {});

  const prixData = historique
    .filter((item) => item.type === "achat")
    .map((item, index) => ({
      name: `Lot ${index + 1}`,
      prix: item.prix_unitaire || 0,
    }));

  const formatDate = (date) => {
    if (typeof date?.toDate === "function") {
      return date.toDate().toLocaleDateString();
    } else if (typeof date === "string" || typeof date === "number") {
      return new Date(date).toLocaleDateString();
    } else {
      return "N/A";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-[#a41624]">
          Historique des opérations
        </h2>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="mb-4 flex justify-start">
            <TabsTrigger value="tableau">Vue Tableau</TabsTrigger>
            <TabsTrigger value="graphes">Vue Graphique</TabsTrigger>
          </TabsList>

          {/* Vue Tableau */}
          <TabsContent value="tableau">
            <div className="border rounded-lg overflow-hidden shadow-sm">
              <Table className="text-sm">
                <TableHeader className="bg-[#f5f5f5]">
                  <TableRow>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Quantité</TableHead>
                    <TableHead className="font-semibold">
                      Prix Unitaire
                    </TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold text-right">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historique.map((item, index) => (
                    <TableRow
                      key={index}
                      className={`hover:bg-gray-100 ${
                        typeColors[item.type]
                      } transition-colors`}>
                      <TableCell className="capitalize font-medium">
                        {item.type}
                      </TableCell>
                      <TableCell>{item.quantite}</TableCell>
                      <TableCell>
                        {item.prix_unitaire ? `${item.prix_unitaire} XOF` : "-"}
                      </TableCell>
                      <TableCell>{formatDate(item.date)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setSelectedItem({ ...item, index })}>
                          <Pencil size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Vue Graphique */}
          <TabsContent value="graphes">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Répartition des types d'opération */}
              <div>
                <h3 className="font-semibold mb-2">
                  Répartition des opérations
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={Object.entries(operationStats).map(([k, v]) => ({
                      type: k,
                      nombre: v,
                    }))}>
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="nombre" fill="#d9571d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Graphique prix d'achat */}
              <div>
                <h3 className="font-semibold mb-2">
                  Évolution des prix d'achat
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={prixData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="prix" fill="#a41624" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialog modification d'une ligne */}
        {selectedItem && (
          <Dialog open={true} onOpenChange={() => setSelectedItem(null)}>
            <DialogContent>
              <h3 className="text-lg font-semibold mb-2">
                Modifier l'opération
              </h3>
              {/* Formulaire d'édition à implémenter */}
              <p className="text-sm text-gray-600">Fonctionnalité à venir</p>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
