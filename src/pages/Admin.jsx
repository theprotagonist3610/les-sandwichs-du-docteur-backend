import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import {
  UserCog,
  Truck,
  ShoppingBag,
  ChefHat,
  Store,
  Phone,
  MapPin,
  CreditCard,
} from "lucide-react";
import HeaderNav from "@/components/HeaderNav";
const adminItems = [
  { label: "Utilisateurs", icon: UserCog, path: "/admin/utilisateurs" },
  { label: "Livreurs", icon: Truck, path: "/admin/livreurs" },
  { label: "Vendeuses", icon: ShoppingBag, path: "/admin/vendeuses" },
  { label: "Cuisinières", icon: ChefHat, path: "/admin/cuisinieres" },
  { label: "Points de vente", icon: Store, path: "/admin/points-de-vente" },
  { label: "Types de numéros", icon: Phone, path: "/admin/types-numeros" },
  { label: "Adresses livraison", icon: MapPin, path: "/admin/adresses" },
  { label: "Moyens de paiement", icon: CreditCard, path: "/admin/paiements" },
];
export default function AdminPage() {
  return (
    <div className="space-y-6">
      <HeaderNav />
      <div className="p-4">
        <h1 className="text-2xl font-bold text-center">
          Panneau d'administration
        </h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {adminItems.map(({ label, icon: Icon, path }) => (
            <Link to={path} key={label}>
              <Card className="hover:shadow-md hover:bg-muted transition">
                <CardContent className="flex flex-col items-center justify-center p-4 gap-2">
                  <Icon className="h-6 w-6 text-primary" />
                  <span className="text-sm text-center font-medium">
                    {label}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
