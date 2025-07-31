import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Dashboard from "./pages/Dashboard";
import Commandes from "./pages/Commandes";
import Stocks from "./pages/Stocks";
import StockDetail from "./pages/StockDetail";
import MenuDetail from "./pages/MenuDetail";
import UserDetail from "./pages/UserDetail";
import LivreurDetail from "./pages/LivreurDetail";
import Production from "./pages/Production";
import Statistiques from "./pages/Statistiques";
import Todos from "./pages/Todos";
import VendeuseDetail from "./pages/VendeuseDetail";
import CuisinierDetail from "./pages/CuisinierDetail";
import PointDeVenteDetail from "./pages/PointDeVenteDetail";
import TypeNumeroDetail from "./pages/TypeNumeroDetail";
import CommandeRapide from "./pages/CommandeRapide";
import CommandPage from "./pages/CommandPage";
import Notifications from "./pages/Notifications";
import Account from "./pages/Account";
import Menu from "./pages/Menu";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import PrivateRoute from "./components/PrivateRoute";
import AdresseDetail from "./pages/AdresseDetail";
import MoyenPaiementDetail from "./pages/MoyenPaiementDetail";
import { CommandeProvider } from "./context/CommandContext";
function App() {
  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <PrivateRoute requiredFonction={["superviseur"]}>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/commandes"
          element={
            <PrivateRoute requiredFonction={["superviseur"]}>
              <Commandes />
            </PrivateRoute>
          }
        />
        <Route
          path="/menu"
          element={
            <PrivateRoute requiredFonction={["superviseur"]}>
              <Menu />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <PrivateRoute requiredFonction={["superviseur"]}>
              <Admin />
            </PrivateRoute>
          }
        />
        <Route
          path="/stocks"
          element={
            <PrivateRoute requiredFonction={["superviseur"]}>
              <Stocks />
            </PrivateRoute>
          }
        />
        <Route
          path="/todos"
          element={
            <PrivateRoute requiredFonction={["superviseur"]}>
              <Todos />
            </PrivateRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <PrivateRoute requiredFonction={["superviseur"]}>
              <Notifications />
            </PrivateRoute>
          }
        />
        <Route
          path="/account"
          element={
            <PrivateRoute requiredFonction={["superviseur"]}>
              <Account />
            </PrivateRoute>
          }
        />
        <Route
          path="/commande-rapide"
          element={
            <PrivateRoute requiredFonction={["superviseur"]}>
              <CommandeProvider>
                <CommandPage />
              </CommandeProvider>
            </PrivateRoute>
          }
        />
        <Route
          path="/stocks/:stockId"
          element={
            <PrivateRoute requiredFonction={["superviseur"]}>
              <StockDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/menu/:menuId"
          element={
            <PrivateRoute requiredFonction={["superviseur"]}>
              <MenuDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/utilisateurs"
          element={
            <PrivateRoute requiredFonction={["superviseur"]}>
              <UserDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/paiements"
          element={
            <PrivateRoute requiredFonction={["superviseur"]}>
              <MoyenPaiementDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/adresses"
          element={
            <PrivateRoute requiredFonction={["superviseur"]}>
              <AdresseDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/types-numeros"
          element={
            <PrivateRoute requiredFonction={["superviseur"]}>
              <TypeNumeroDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/livreurs"
          element={
            <PrivateRoute requiredFonction={["superviseur"]}>
              <LivreurDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/points-de-vente"
          element={
            <PrivateRoute requiredFonction={["superviseur"]}>
              <PointDeVenteDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/vendeuses"
          element={
            <PrivateRoute requiredFonction={["superviseur"]}>
              <VendeuseDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/cuisinieres"
          element={
            <PrivateRoute requiredFonction={["superviseur"]}>
              <CuisinierDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/production"
          element={
            <PrivateRoute requiredFonction={["superviseur"]}>
              <Production />
            </PrivateRoute>
          }
        />
        <Route
          path="/statistiques"
          element={
            <PrivateRoute requiredFonction={["superviseur"]}>
              <Statistiques />
            </PrivateRoute>
          }
        />
        <Route path="/login" element={<Login />} />
      </Routes>
      <Toaster richColors position="top-right" closeButton />
    </>
  );
}

export default App;

// {
//   adresse:"Littoral-Cotonou-Akpakpa",
//   code_commande:"",
//   cout_total:"",
//   date_livraison:"",
//   heure_livraison:"",
//   indication_adresse:"",
//   livreur:"",
//   details_commande:"",
//   paiement:"",
//   client:"",
//   telephone_client:"",
//   numero_client:"",
//   numero_a_livrer:"",
//   prenom_a_livrer:"",
//   type_appel:"",
//   prix_livraison:"",
//   statut_livraison:"",
//   incident_livraison:"",
//   point_de_vente:"",
//   createdAt:"",
//   vendeur:"",
//   paiement:"",
//   moyen_paiement:""
// }
