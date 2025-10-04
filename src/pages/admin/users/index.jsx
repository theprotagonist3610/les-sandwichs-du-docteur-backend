import GenericCards from "@/components/GenericCards";
import { UserRoundPlus, Users } from "lucide-react";
const liste = [
  {
    nom: "Ajouter",
    description:
      "Créer un nouvel utilisateur afin qu'il intègre notre dynamique équipe",
    to: "/admin/users/ajouter/",
    icon: <UserRoundPlus />,
  },
  {
    nom: "Gérer",
    description: "Gérer les utilisateurs",
    to: "/admin/users/users/",
    icon: <Users />,
  },
];
const index = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Admin/Utilisateurs</h1>
      <GenericCards liste={liste} />
    </div>
  );
};

export default index;
