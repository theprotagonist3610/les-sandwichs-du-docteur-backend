import { useState } from "react";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/");
    } catch (err) {
      setError("Email ou mot de passe incorrect.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-lg space-y-6">
        <div className="flex justify-center">
          <img
            src="logo.png"
            alt="Logo"
            className="w-20 h-20 rounded-full shadow"
          />
        </div>
        <h2 className="text-xl font-semibold text-bordeaux text-center">
          Bienvenue chez Les Sandwichs du Docteur
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Adresse email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-secondary"
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-secondary"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center bg-primary text-white py-3 rounded-lg hover:bg-accent transition-colors">
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : isRegister ? (
              "S'inscrire"
            ) : (
              "Se connecter"
            )}
          </button>
        </form>

        <p
          className="text-center text-sm text-gray-600 cursor-pointer hover:text-primary"
          onClick={() => setIsRegister(!isRegister)}>
          {isRegister
            ? "Déjà inscrit ? Se connecter"
            : "Pas encore de compte ? S'inscrire"}
        </p>
      </div>
    </div>
  );
}
