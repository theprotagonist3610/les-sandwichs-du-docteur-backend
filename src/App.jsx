import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Commandes from "./pages/Commandes";
import Stocks from "./pages/Stocks";
import Production from "./pages/Production";
import Statistiques from "./pages/Statistiques";
import Login from "./pages/Login";
import PrivateRoute from "./components/PrivateRoute";
function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/commandes"
        element={
          <PrivateRoute>
            <Commandes />
          </PrivateRoute>
        }
      />
      <Route
        path="/stocks"
        element={
          <PrivateRoute>
            <Stocks />
          </PrivateRoute>
        }
      />
      <Route
        path="/production"
        element={
          <PrivateRoute>
            <Production />
          </PrivateRoute>
        }
      />
      <Route
        path="/statistiques"
        element={
          <PrivateRoute>
            <Statistiques />
          </PrivateRoute>
        }
      />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}

export default App;
