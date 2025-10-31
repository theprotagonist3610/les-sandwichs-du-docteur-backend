/*
- tous les routes quand le user n'est pas connecte dans errorLayout
- not found et not authorized dans error layout
 */
import Layout from "@/layouts/layout";
import Home from "@/pages/global/Home";
import Login from "@/pages/global/Login";
import Register from "@/pages/global/Register";
import NotFound from "@/pages/global/NotFound";
import NotAuthorized from "@/pages/global/NotAuthorized";
import ProtectedRoute from "@/components/global/ProtectedRoute";

const globalRoutes = {
  path: "/",
  element: <Layout error={true} />,
  children: [
    {
      index: true,
      element: <Home />,
    },
    {
      path: "login",
      element: (
        <ProtectedRoute requireAuth={false}>
          <Login />
        </ProtectedRoute>
      ),
    },
    {
      path: "register",
      element: (
        <ProtectedRoute requireAuth={false}>
          <Register />
        </ProtectedRoute>
      ),
    },
    {
      path: "not-authorized",
      element: <NotAuthorized />,
    },
    {
      path: "*",
      element: <NotFound />,
    },
  ],
};

export default globalRoutes;
