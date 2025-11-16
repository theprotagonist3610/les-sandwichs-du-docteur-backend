import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/toolkits/global/userToolkit";
import SmallLoader from "@/components/global/SmallLoader";

const Home = () => {
  const { user, loading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    }
  }, [user, loading, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <SmallLoader text="Redirection en cours" />
    </div>
  );
};

export default Home;