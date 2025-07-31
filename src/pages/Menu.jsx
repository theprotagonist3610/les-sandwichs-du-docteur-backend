import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import HeaderNav from "@/components/HeaderNav";
import CreerMenu from "@/components/CreerMenu";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import {
  Sandwich,
  Soup,
  IceCream,
  Fish,
  Drumstick,
  Milk,
  CupSoda,
  Loader2,
  Plus,
  Pencil,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const iconMap = {
  Sandwich: Sandwich,
  Poisson: Fish,
  Viande: Drumstick,
  Yaourt: Milk,
  Soda: CupSoda,
  Box: Soup,
  Dessert: IceCream,
};

export default function MenuGrid() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(false);
  const toggleRefresh = () => {
    setLoading(true);
    setRefresh((prev) => !prev);
  };
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const snapshot = await getDocs(collection(db, "menus"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMenus(data);
      } catch (error) {
        console.error("Erreur de chargement des menus:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenus();
  }, [refresh]);

  if (loading) {
    return (
      <>
        <HeaderNav onRefresh={toggleRefresh} />
        <div className="flex items-center justify-center h-40">
          <Loader2 className="animate-spin w-6 h-6 text-orange-500" />
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen relative">
      <HeaderNav onRefresh={toggleRefresh} />
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <AnimatePresence>
          {menus.map((menu, idx) => {
            const Icon = iconMap[menu.icone] || Sandwich;
            return (
              <motion.div
                key={menu.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                transition={{
                  delay: idx * 0.08,
                  duration: 0.4,
                  type: "spring",
                }}>
                <Card className="transition border border-gray-200 rounded-xl shadow-sm bg-white relative overflow-visible">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Icon className="w-6 h-6 text-orange-500" />
                        <h2 className="text-base font-semibold capitalize">
                          {menu.denomination}
                        </h2>
                      </div>
                      <Badge
                        variant={menu.disponible ? "default" : "outline"}
                        className={
                          menu.disponible
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800 border-red-300"
                        }>
                        {menu.disponible ? "Disponible" : "Non disponible"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <CupSoda className="w-4 h-4" /> Prix :{" "}
                      <span className="font-medium">
                        {menu.prix_vente} FCFA
                      </span>
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Soup className="w-4 h-4" />
                      Ingrédients : {menu.ingredients?.length || 0}
                    </p>
                  </CardContent>
                  {/* Bouton modification en bas à droite de la carte */}
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute -bottom-4 right-4 shadow-lg bg-orange-500 hover:bg-orange-600 text-white rounded-full border-2 border-white"
                    title="Modifier ce menu"
                    onClick={() => navigate(`/menu/${menu.id}`)}>
                    <Pencil className="w-5 h-5" />
                  </Button>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {menus.length === 0 && (
          <div className="text-gray-500 text-center col-span-full">
            Aucun élément dans le menu actuellement.
          </div>
        )}
      </div>

      {/* FAB pour créer un menu */}
      <Dialog>
        <DialogTrigger asChild>
          <button
            className="fixed bottom-6 right-6 z-40 bg-[#a41624] hover:bg-[#86111d] text-white rounded-full p-4 shadow-lg transition duration-300"
            aria-label="Créer un menu">
            <Plus className="w-6 h-6" />
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <CreerMenu />
        </DialogContent>
      </Dialog>
    </div>
  );
}
