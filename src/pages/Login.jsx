import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser, loginWithEmail } from "@/components/userToolkit";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState(""); // ✅ Nouveau champ
  const [adminCode, setAdminCode] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const input =
    "w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-secondary";

  const getErrorMessage = (error) => {
    const code = error.code;

    if (!code) return "Une erreur inconnue s'est produite.";

    switch (code) {
      case "auth/user-not-found":
        return "Aucun compte n'existe avec cet email.";
      case "auth/wrong-password":
        return "Mot de passe incorrect.";
      case "auth/email-already-in-use":
        return "Cet email est déjà utilisé.";
      case "auth/invalid-email":
        return "Adresse email invalide.";
      case "auth/weak-password":
        return "Le mot de passe est trop faible.";
      case "auth/too-many-requests":
        return "Trop de tentatives. Réessayez plus tard.";
      default:
        return "Erreur : " + code.replace("auth/", "").replaceAll("-", " ");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isRegister) {
        const registerPromise = await registerUser(
          email,
          password,
          telephone,
          nom,
          prenom,
          adminCode
        );
        toast.promise(registerPromise, {
          loading: "Inscription en cours ...",
          success: (data) => {
            return `Votre compte à été crée avec succès. Vous pouvez vous connecter avec vos identifiants`;
          },
          error: "Un probleme est survenu lors de la création de votre compte",
        });
        let timeout = setTimeout(() => clearTimeout(timeout), 2000);
        navigate("/login");
        setIsRegister(false);
      } else {
        const userData = await loginWithEmail(email, password);
        if (!userData) throw new Error("Compte inactif ou inexistant.");
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
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
            className={input}
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={input}
          />

          {isRegister && (
            <>
              <input
                type="text"
                placeholder="Nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                required
                className={input}
              />
              <input
                type="text"
                placeholder="Prénom"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                required
                className={input}
              />
              <input
                type="tel"
                placeholder="Téléphone"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                required
                className={input}
              />
              <input
                type="text"
                placeholder="Code admin (optionnel)"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                className={input}
              />
            </>
          )}

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
          onClick={() => {
            setIsRegister(!isRegister);
            setError("");
            setNom("");
            setPrenom("");
            setTelephone(""); // ✅ Reset champ
            setAdminCode("");
            setPassword("");
          }}>
          {isRegister
            ? "Déjà inscrit ? Se connecter"
            : "Pas encore de compte ? S'inscrire"}
        </p>
      </div>
    </div>
  );
}
