// components/Users.jsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useBreakpoint from "@/hooks/useBreakpoint";
import { useUsers } from "@/toolkits/userToolkit";
import {
  User,
  Users as UsersIcon,
  Calendar,
  Filter,
  ChevronRight,
  Shield,
  UserCheck,
} from "lucide-react";

/**
 * Composant de carte utilisateur pour la version desktop
 */
const UserCard = ({ user, onClick }) => {
  const formatDate = (timestamp) => {
    // Gérer les Timestamps Firestore
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Générer les initiales des prénoms
  const getInitials = (prenoms) => {
    if (!prenoms || !Array.isArray(prenoms)) return "";
    return prenoms.map((prenom) => prenom.charAt(0).toUpperCase()).join("");
  };

  // Icône selon le level
  const getLevelIcon = () => {
    return user.level === "admin" ? (
      <Shield className="h-4 w-4 text-blue-500" />
    ) : (
      <UserCheck className="h-4 w-4 text-green-500" />
    );
  };

  return (
    <div
      onClick={onClick}
      className="
        p-4 bg-card border border-border rounded-lg cursor-pointer
        hover:shadow-md hover:bg-accent/50 transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-ring
      "
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div
            className="
            w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center
          ">
            <User className="h-5 w-5 text-primary" />
          </div>

          <div className="flex-1">
            <h3 className="font-medium text-foreground">
              {getInitials(user.prenoms)} {user.nom}
            </h3>
            <p className="text-sm text-muted-foreground capitalize">
              {user.role}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {getLevelIcon()}
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 mr-1" />
          <span>Créé le {formatDate(user.createdAt)}</span>
        </div>

        <span
          className={`
          text-xs px-2 py-1 rounded-full font-medium
          ${
            user.level === "admin"
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
          }
        `}>
          {user.level === "admin" ? "Administrateur" : "Utilisateur"}
        </span>
      </div>
    </div>
  );
};

/**
 * Composant d'élément de liste pour la version mobile
 */
const UserListItem = ({ user, onClick }) => {
  const formatDate = (timestamp) => {
    // Gérer les Timestamps Firestore
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Générer les initiales des prénoms
  const getInitials = (prenoms) => {
    if (!prenoms || !Array.isArray(prenoms)) return "";
    return prenoms.map((prenom) => prenom.charAt(0).toUpperCase()).join(". ");
  };

  // Icône selon le level
  const getLevelIcon = () => {
    return user.level === "admin" ? (
      <Shield className="h-4 w-4 text-blue-500" />
    ) : (
      <UserCheck className="h-4 w-4 text-green-500" />
    );
  };

  return (
    <div
      onClick={onClick}
      className="
        p-4 border-b border-border cursor-pointer
        hover:bg-accent/50 transition-colors duration-200
        focus:outline-none focus:bg-accent/50
      "
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-foreground">
              {getInitials(user.prenoms)}. {user.nom}
            </h3>
            {getLevelIcon()}
          </div>

          <div className="mt-1 space-y-1">
            <p className="text-sm text-muted-foreground capitalize">
              {user.role}
            </p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDate(user.createdAt)}
              </p>
              <span
                className={`
                text-xs px-2 py-1 rounded-full font-medium
                ${
                  user.level === "admin"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                }
              `}>
                {user.level === "admin" ? "Admin" : "User"}
              </span>
            </div>
          </div>
        </div>

        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </div>
  );
};

/**
 * Composant de filtrage des utilisateurs
 */
const UserFilter = ({ selectedRole, onRoleChange, className = "" }) => {
  const roleOptions = [
    { value: "tous", label: "Tous les utilisateurs" },
    { value: "superviseur", label: "Superviseurs" },
    { value: "vendeuse", label: "Vendeuses" },
    { value: "livreur", label: "Livreurs" },
    { value: "cuisiniere", label: "Cuisinières" },
  ];

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-foreground flex items-center space-x-2">
        <Filter className="h-4 w-4" />
        <span>Filtrer par rôle</span>
      </label>

      <select
        value={selectedRole}
        onChange={(e) => onRoleChange(e.target.value)}
        className="
          w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground
          focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
          transition-all duration-200
        ">
        {roleOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

/**
 * Version mobile du composant Users
 */
const UsersMobile = ({ users, selectedRole, onRoleChange, onUserClick }) => {
  return (
    <div className="h-screen flex flex-col">
      {/* Header avec filtrage */}
      <div className="p-4 border-b border-border bg-background">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <UsersIcon className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Utilisateurs</h1>
          </div>

          <UserFilter selectedRole={selectedRole} onRoleChange={onRoleChange} />
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <ScrollArea className="flex-1">
        <div className="divide-y divide-border">
          {users.length === 0 ? (
            <div className="p-8 text-center">
              <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
            </div>
          ) : (
            users.map((user) => (
              <UserListItem
                key={user.uid}
                user={user}
                onClick={() => onUserClick(user)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

/**
 * Version desktop du composant Users
 */
const UsersDesktop = ({ users, selectedRole, onRoleChange, onUserClick }) => {
  // Séparer les administrateurs et utilisateurs standard
  const { adminUsers, standardUsers } = useMemo(() => {
    return {
      adminUsers: users.filter((user) => user.level === "admin"),
      standardUsers: users.filter((user) => user.level === "user"),
    };
  }, [users]);

  // Nom du rôle pour les tabs
  const getRoleName = () => {
    switch (selectedRole) {
      case "superviseur":
        return "superviseurs";
      case "vendeuse":
        return "vendeuses";
      case "livreur":
        return "livreurs";
      case "cuisiniere":
        return "cuisinières";
      default:
        return "utilisateurs";
    }
  };

  const renderUserGrid = (userList) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
      {userList.length === 0 ? (
        <div className="col-span-full flex flex-col items-center justify-center py-12">
          <UsersIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Aucun utilisateur dans cette catégorie
          </p>
        </div>
      ) : (
        userList.map((user) => (
          <UserCard
            key={user.app_id}
            user={user}
            onClick={() => onUserClick(user)}
          />
        ))
      )}
    </div>
  );

  return (
    <div className="h-screen flex flex-col">
      {/* Header avec filtrage */}
      <div className="p-6 border-b border-border bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <UsersIcon className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">
              Gestion des utilisateurs
            </h1>
          </div>

          <div className="w-64">
            <UserFilter
              selectedRole={selectedRole}
              onRoleChange={onRoleChange}
            />
          </div>
        </div>
      </div>

      {/* Tabs avec utilisateurs */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="tous" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mx-6 mt-6">
            <TabsTrigger value="tous" className="flex items-center space-x-2">
              <UsersIcon className="h-4 w-4" />
              <span>Tous les {getRoleName()}</span>
              <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                {users.length}
              </span>
            </TabsTrigger>

            <TabsTrigger value="admins" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Administrateurs</span>
              <span className="bg-blue-500/20 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                {adminUsers.length}
              </span>
            </TabsTrigger>

            <TabsTrigger value="users" className="flex items-center space-x-2">
              <UserCheck className="h-4 w-4" />
              <span>Utilisateurs</span>
              <span className="bg-green-500/20 text-green-600 text-xs px-2 py-0.5 rounded-full">
                {standardUsers.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="tous" className="h-full">
              <ScrollArea className="h-full">
                {renderUserGrid(users)}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="admins" className="h-full">
              <ScrollArea className="h-full">
                {renderUserGrid(adminUsers)}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="users" className="h-full">
              <ScrollArea className="h-full">
                {renderUserGrid(standardUsers)}
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

/**
 * Composant principal Users
 */
const Users = ({ className = "" }) => {
  const { isMobile } = useBreakpoint(1024);
  const navigate = useNavigate();

  // État pour le filtre de rôle
  const [selectedRole, setSelectedRole] = useState("tous");

  // Charger les utilisateurs avec le hook
  const { users: allUsers, loading, error } = useUsers();

  // Filtrer les utilisateurs par rôle
  const filteredUsers = useMemo(() => {
    if (!allUsers) return [];

    let filtered =
      selectedRole === "tous"
        ? allUsers
        : allUsers.filter((user) => user.role === selectedRole);

    // Trier par ancienneté (date de création) - du plus ancien au plus récent
    return filtered.sort((a, b) => {
      const dateA = a.createdAt?.toDate
        ? a.createdAt.toDate()
        : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate
        ? b.createdAt.toDate()
        : new Date(b.createdAt);
      return dateA - dateB;
    });
  }, [allUsers, selectedRole]);

  // Gérer le clic sur un utilisateur
  const handleUserClick = (user) => {
    navigate(`/admin/users/users/:${user.uid}`);
  };

  // Gérer le changement de rôle
  const handleRoleChange = (role) => {
    setSelectedRole(role);
  };

  // Gestion des états de chargement et d'erreur
  if (loading) {
    return (
      <div className={`flex items-center justify-center h-screen ${className}`}>
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">
            Chargement des utilisateurs...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-screen ${className}`}>
        <div className="text-center space-y-4">
          <XCircle className="h-12 w-12 text-red-500 mx-auto" />
          <div>
            <p className="text-foreground font-medium">Erreur de chargement</p>
            <p className="text-muted-foreground text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Rendu conditionnel selon la taille d'écran
  return (
    <div className={className}>
      {isMobile ? (
        <UsersMobile
          users={filteredUsers}
          selectedRole={selectedRole}
          onRoleChange={handleRoleChange}
          onUserClick={handleUserClick}
        />
      ) : (
        <UsersDesktop
          users={filteredUsers}
          selectedRole={selectedRole}
          onRoleChange={handleRoleChange}
          onUserClick={handleUserClick}
        />
      )}
    </div>
  );
};

export default Users;
