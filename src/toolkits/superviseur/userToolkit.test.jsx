// ============================================================================
// superviseur/userToolkit.test.jsx - Tests unitaires pour userToolkit superviseur
// ============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as userToolkit from "./userToolkit.jsx";

// ============================================================================
// MOCKS - Configuration des mocks pour Firebase
// ============================================================================

// Utiliser vi.hoisted pour que les variables soient disponibles dans les mocks
const {
  mockCreateUserWithEmailAndPassword,
  mockSignInWithEmailAndPassword,
  mockSignOut,
  mockCurrentUser,
  mockGetDoc,
  mockSetDoc,
  mockUpdateDoc,
  mockDoc,
  mockGet,
  mockSet,
  mockUpdate,
  mockRef,
} = vi.hoisted(() => ({
  // Mock Firebase Auth
  mockCreateUserWithEmailAndPassword: vi.fn(),
  mockSignInWithEmailAndPassword: vi.fn(),
  mockSignOut: vi.fn(),
  mockCurrentUser: { uid: "test-superviseur-id" },

  // Mock Firestore
  mockGetDoc: vi.fn(),
  mockSetDoc: vi.fn(),
  mockUpdateDoc: vi.fn(),
  mockDoc: vi.fn((_db, collection, id) => ({ collection, id })),

  // Mock Realtime Database
  mockGet: vi.fn(),
  mockSet: vi.fn(),
  mockUpdate: vi.fn(),
  mockRef: vi.fn((_db, path) => ({ path })),
}));

vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: (...args) =>
    mockCreateUserWithEmailAndPassword(...args),
  signInWithEmailAndPassword: (...args) =>
    mockSignInWithEmailAndPassword(...args),
  signOut: (...args) => mockSignOut(...args),
}));

vi.mock("firebase/firestore", () => ({
  doc: (...args) => mockDoc(...args),
  getDoc: (...args) => mockGetDoc(...args),
  setDoc: (...args) => mockSetDoc(...args),
  updateDoc: (...args) => mockUpdateDoc(...args),
  serverTimestamp: () => Date.now(),
}));

vi.mock("firebase/database", () => ({
  ref: (...args) => mockRef(...args),
  set: (...args) => mockSet(...args),
  get: (...args) => mockGet(...args),
  update: (...args) => mockUpdate(...args),
}));

vi.mock("../../firebase.js", () => ({
  auth: { currentUser: mockCurrentUser },
  db: {},
  rtdb: {},
}));

// ============================================================================
// 1. TESTS DES SCHEMAS - userSchema()
// ============================================================================

describe("userSchema()", () => {
  describe("userSchemaMinimal", () => {
    it("devrait valider un utilisateur superviseur minimal valide", () => {
      const validUser = {
        nom: "Martin",
        prenoms: ["Sophie", "Marie"],
        email: "sophie.martin@example.com",
        contact: "2290187654321",
        sexe: "f",
        date_naissance: 631152000000,
      };

      const result = userToolkit.userSchemaMinimal.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un email invalide", () => {
      const invalidUser = {
        nom: "Martin",
        prenoms: ["Sophie"],
        email: "email-invalide",
        contact: "2290187654321",
        sexe: "f",
        date_naissance: 631152000000,
      };

      const result = userToolkit.userSchemaMinimal.safeParse(invalidUser);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorString = JSON.stringify(result.error);
        expect(errorString).toContain("email");
      }
    });

    it("devrait rejeter un contact invalide", () => {
      const invalidUser = {
        nom: "Martin",
        prenoms: ["Sophie"],
        email: "sophie@example.com",
        contact: "123456",
        sexe: "f",
        date_naissance: 631152000000,
      };

      const result = userToolkit.userSchemaMinimal.safeParse(invalidUser);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorString = JSON.stringify(result.error);
        expect(errorString).toContain("contact");
      }
    });

    it("devrait rejeter un sexe invalide", () => {
      const invalidUser = {
        nom: "Martin",
        prenoms: ["Sophie"],
        email: "sophie@example.com",
        contact: "2290187654321",
        sexe: "x",
        date_naissance: 631152000000,
      };

      const result = userToolkit.userSchemaMinimal.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it("devrait rejeter un tableau de prénoms vide", () => {
      const invalidUser = {
        nom: "Martin",
        prenoms: [],
        email: "sophie@example.com",
        contact: "2290187654321",
        sexe: "f",
        date_naissance: 631152000000,
      };

      const result = userToolkit.userSchemaMinimal.safeParse(invalidUser);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorString = JSON.stringify(result.error);
        expect(errorString).toContain("prenoms");
      }
    });
  });

  describe("userSchemaComplet", () => {
    it("devrait valider un utilisateur superviseur complet", () => {
      const validUser = {
        id: "sup-123",
        nom: "Martin",
        prenoms: ["Sophie"],
        email: "sophie@example.com",
        contact: "2290187654321",
        sexe: "f",
        date_naissance: 631152000000,
        role: "superviseur",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = userToolkit.userSchemaComplet.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un role différent de 'superviseur'", () => {
      const invalidUser = {
        id: "sup-123",
        nom: "Martin",
        prenoms: ["Sophie"],
        email: "sophie@example.com",
        contact: "2290187654321",
        sexe: "f",
        date_naissance: 631152000000,
        role: "admin",
      };

      const result = userToolkit.userSchemaComplet.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });
  });

  describe("presenceSchema", () => {
    it("devrait valider une présence superviseur valide", () => {
      const validPresence = {
        id: "sup-123",
        nom: "Martin",
        prenoms: ["Sophie"],
        role: "superviseur",
        connectedAt: Date.now(),
      };

      const result = userToolkit.presenceSchema.safeParse(validPresence);
      expect(result.success).toBe(true);
    });

    it("devrait rejeter un role différent de 'superviseur'", () => {
      const invalidPresence = {
        id: "sup-123",
        nom: "Martin",
        prenoms: ["Sophie"],
        role: "user",
        connectedAt: Date.now(),
      };

      const result = userToolkit.presenceSchema.safeParse(invalidPresence);
      expect(result.success).toBe(false);
    });

    it("devrait accepter disconnectedAt comme optionnel", () => {
      const presence = {
        id: "sup-123",
        nom: "Martin",
        prenoms: ["Sophie"],
        role: "superviseur",
        connectedAt: Date.now(),
        disconnectedAt: Date.now(),
      };

      const result = userToolkit.presenceSchema.safeParse(presence);
      expect(result.success).toBe(true);
    });
  });

  describe("userSchema factory", () => {
    it("devrait retourner le schéma minimal par défaut", () => {
      const schema = userToolkit.userSchema();
      expect(schema).toBe(userToolkit.userSchemaMinimal);
    });

    it("devrait retourner le schéma complet", () => {
      const schema = userToolkit.userSchema("complet");
      expect(schema).toBe(userToolkit.userSchemaComplet);
    });

    it("devrait retourner le schéma de présence", () => {
      const schema = userToolkit.userSchema("presence");
      expect(schema).toBe(userToolkit.presenceSchema);
    });
  });
});

// ============================================================================
// 2. TESTS DE createUser()
// ============================================================================

describe("createUser()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateUserWithEmailAndPassword.mockResolvedValue({
      user: { uid: "new-superviseur-id" },
    });
    mockSetDoc.mockResolvedValue(undefined);
    mockSet.mockResolvedValue(undefined);
    mockSignInWithEmailAndPassword.mockResolvedValue({
      user: { uid: "new-superviseur-id" },
    });
    mockSignOut.mockResolvedValue(undefined);
  });

  it("devrait créer un superviseur avec succès (autoLogin: true)", async () => {
    const userData = {
      nom: "Martin",
      prenoms: ["Sophie", "Marie"],
      email: "sophie@example.com",
      password: "password123",
      contact: "2290187654321",
      sexe: "f",
      date_naissance: 631152000000,
    };

    const result = await userToolkit.createUser(userData);

    expect(result.success).toBe(true);
    expect(result.user.id).toBe("new-superviseur-id");
    expect(result.user.role).toBe("superviseur");
    expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledOnce();
    expect(mockSetDoc).toHaveBeenCalledOnce();
    expect(mockSet).toHaveBeenCalledOnce();
    expect(mockSignInWithEmailAndPassword).toHaveBeenCalled();
  });

  it("devrait créer un superviseur sans se connecter (autoLogin: false)", async () => {
    const userData = {
      nom: "Martin",
      prenoms: ["Sophie"],
      email: "sophie@example.com",
      password: "password123",
      contact: "2290187654321",
      sexe: "f",
      date_naissance: 631152000000,
    };

    const result = await userToolkit.createUser(userData, { autoLogin: false });

    expect(result.success).toBe(true);
    expect(result.user.role).toBe("superviseur");
    expect(mockSignOut).toHaveBeenCalledOnce();
    expect(mockSignInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it("devrait rejeter des données invalides (validation Zod)", async () => {
    const invalidUserData = {
      nom: "Martin",
      prenoms: [],
      email: "invalid-email",
      password: "password123",
      contact: "123",
      sexe: "f",
      date_naissance: 631152000000,
    };

    await expect(userToolkit.createUser(invalidUserData)).rejects.toThrow();
    expect(mockCreateUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it("devrait gérer l'erreur email-already-in-use", async () => {
    mockCreateUserWithEmailAndPassword.mockRejectedValue({
      code: "auth/email-already-in-use",
    });

    const userData = {
      nom: "Martin",
      prenoms: ["Sophie"],
      email: "existing@example.com",
      password: "password123",
      contact: "2290187654321",
      sexe: "f",
      date_naissance: 631152000000,
    };

    await expect(userToolkit.createUser(userData)).rejects.toThrow(
      "Cet email est déjà utilisé"
    );
  });

  it("devrait gérer l'erreur weak-password", async () => {
    mockCreateUserWithEmailAndPassword.mockRejectedValue({
      code: "auth/weak-password",
    });

    const userData = {
      nom: "Martin",
      prenoms: ["Sophie"],
      email: "sophie@example.com",
      password: "123",
      contact: "2290187654321",
      sexe: "f",
      date_naissance: 631152000000,
    };

    await expect(userToolkit.createUser(userData)).rejects.toThrow(
      "Le mot de passe est trop faible"
    );
  });
});

// ============================================================================
// 3. TESTS DE updateUser()
// ============================================================================

describe("updateUser()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devrait mettre à jour un superviseur existant", async () => {
    const existingUser = {
      id: "sup-123",
      nom: "Martin",
      prenoms: ["Sophie"],
      email: "sophie@example.com",
      contact: "2290187654321",
      sexe: "f",
      role: "superviseur",
    };

    mockGetDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => existingUser,
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ ...existingUser, nom: "Dubois" }),
      });

    mockUpdateDoc.mockResolvedValue(undefined);

    const result = await userToolkit.updateUser("sup-123", { nom: "Dubois" });

    expect(result.success).toBe(true);
    expect(result.user.nom).toBe("Dubois");
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ nom: "Dubois", updatedAt: expect.any(Number) })
    );
  });

  it("ne devrait pas permettre de modifier id, createdAt, email ou role", async () => {
    const existingUser = {
      id: "sup-123",
      nom: "Martin",
      email: "sophie@example.com",
      role: "superviseur",
      createdAt: 123456789,
    };

    mockGetDoc
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => existingUser,
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => existingUser,
      });

    await userToolkit.updateUser("sup-123", {
      id: "new-id",
      createdAt: Date.now(),
      email: "newemail@example.com",
      role: "admin",
      nom: "Dubois",
    });

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.not.objectContaining({
        id: "new-id",
        createdAt: expect.anything(),
        email: "newemail@example.com",
        role: "admin",
      })
    );
  });

  it("devrait rejeter un contact invalide", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ id: "sup-123", nom: "Martin" }),
    });

    await expect(
      userToolkit.updateUser("sup-123", { contact: "123456" })
    ).rejects.toThrow("Contact invalide");
  });

  it("devrait rejeter un sexe invalide", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ id: "sup-123", nom: "Martin" }),
    });

    await expect(
      userToolkit.updateUser("sup-123", { sexe: "x" })
    ).rejects.toThrow("Le sexe doit être 'f' ou 'm'");
  });

  it("devrait rejeter la mise à jour d'un utilisateur inexistant", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => false,
    });

    await expect(
      userToolkit.updateUser("inexistant", { nom: "Dubois" })
    ).rejects.toThrow("n'existe pas");
  });
});

// ============================================================================
// 4. TESTS DE getUser()
// ============================================================================

describe("getUser()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devrait récupérer un superviseur existant", async () => {
    const userData = {
      id: "sup-123",
      nom: "Martin",
      prenoms: ["Sophie"],
      email: "sophie@example.com",
      role: "superviseur",
    };

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => userData,
    });

    const result = await userToolkit.getUser("sup-123");

    expect(result).toEqual(userData);
    expect(mockGetDoc).toHaveBeenCalledOnce();
  });

  it("devrait retourner null pour un superviseur inexistant", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => false,
    });

    const result = await userToolkit.getUser("inexistant");

    expect(result).toBeNull();
  });

  it("devrait propager les erreurs Firestore", async () => {
    mockGetDoc.mockRejectedValue(new Error("Erreur Firestore"));

    await expect(userToolkit.getUser("sup-123")).rejects.toThrow(
      "Erreur Firestore"
    );
  });
});

// ============================================================================
// 5. TESTS DE setUserPresence()
// ============================================================================

describe("setUserPresence()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devrait mettre à jour la présence superviseur avec les données fournies", async () => {
    const existingPresence = {
      id: "sup-123",
      nom: "Martin",
      prenoms: ["Sophie"],
      role: "superviseur",
      connectedAt: Date.now(),
    };

    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => existingPresence,
    });

    mockUpdate.mockResolvedValue(undefined);

    const result = await userToolkit.setUserPresence("sup-123", {
      disconnectedAt: Date.now(),
    });

    expect(result.success).toBe(true);
    expect(result.presence.role).toBe("superviseur");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        disconnectedAt: expect.any(Number),
        role: "superviseur",
      })
    );
  });

  it("devrait créer une nouvelle présence superviseur si elle n'existe pas", async () => {
    mockGet.mockResolvedValue({
      exists: () => false,
    });

    mockUpdate.mockResolvedValue(undefined);

    const presenceData = {
      nom: "Martin",
      prenoms: ["Sophie"],
      connectedAt: Date.now(),
    };

    const result = await userToolkit.setUserPresence("sup-123", presenceData);

    expect(result.success).toBe(true);
    expect(result.presence.role).toBe("superviseur");
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("devrait forcer le role à 'superviseur'", async () => {
    mockGet.mockResolvedValue({
      exists: () => false,
    });

    mockUpdate.mockResolvedValue(undefined);

    await userToolkit.setUserPresence("sup-123", {
      nom: "Martin",
      prenoms: ["Sophie"],
      role: "admin", // Tentative de définir un autre role
      connectedAt: Date.now(),
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        role: "superviseur", // Doit être forcé à superviseur
      })
    );
  });

  it("devrait ajouter connectedAt automatiquement si non fourni", async () => {
    mockGet.mockResolvedValue({
      exists: () => false,
    });

    mockUpdate.mockResolvedValue(undefined);

    await userToolkit.setUserPresence("sup-123", {
      nom: "Martin",
      prenoms: ["Sophie"],
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        connectedAt: expect.any(Number),
      })
    );
  });
});

// ============================================================================
// 6. TESTS DE getUserPresence()
// ============================================================================

describe("getUserPresence()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devrait récupérer la présence d'un superviseur", async () => {
    const presenceData = {
      id: "sup-123",
      nom: "Martin",
      prenoms: ["Sophie"],
      role: "superviseur",
      connectedAt: Date.now(),
    };

    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => presenceData,
    });

    const result = await userToolkit.getUserPresence("sup-123");

    expect(result).toEqual(presenceData);
    expect(mockGet).toHaveBeenCalledOnce();
  });

  it("devrait retourner null si la présence n'existe pas", async () => {
    mockGet.mockResolvedValue({
      exists: () => false,
    });

    const result = await userToolkit.getUserPresence("sup-123");

    expect(result).toBeNull();
  });

  it("devrait propager les erreurs RTDB", async () => {
    mockGet.mockRejectedValue(new Error("Erreur RTDB"));

    await expect(userToolkit.getUserPresence("sup-123")).rejects.toThrow(
      "Erreur RTDB"
    );
  });
});

// ============================================================================
// 7. TESTS DE loginUser()
// ============================================================================

describe("loginUser()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devrait connecter un superviseur et le rediriger vers /ventes", async () => {
    const userData = {
      id: "sup-123",
      nom: "Martin",
      prenoms: ["Sophie"],
      role: "superviseur",
    };

    mockSignInWithEmailAndPassword.mockResolvedValue({
      user: { uid: "sup-123" },
    });

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => userData,
    });

    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => ({
        id: "sup-123",
        nom: "Martin",
        prenoms: ["Sophie"],
        role: "superviseur",
        connectedAt: Date.now(),
      }),
    });

    mockUpdate.mockResolvedValue(undefined);

    const navigate = vi.fn();

    const result = await userToolkit.loginUser(
      "sophie@example.com",
      "password123",
      navigate
    );

    expect(result.success).toBe(true);
    expect(result.user).toEqual(userData);
    expect(navigate).toHaveBeenCalledWith("/ventes");
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("devrait utiliser /ventes comme chemin par défaut", async () => {
    mockSignInWithEmailAndPassword.mockResolvedValue({
      user: { uid: "sup-123" },
    });

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        id: "sup-123",
        nom: "Martin",
        prenoms: ["Sophie"],
        role: "superviseur",
      }),
    });

    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => ({
        id: "sup-123",
        nom: "Martin",
        prenoms: ["Sophie"],
        role: "superviseur",
        connectedAt: Date.now(),
      }),
    });

    mockUpdate.mockResolvedValue(undefined);

    const navigate = vi.fn();

    await userToolkit.loginUser("sophie@example.com", "password123", navigate);

    expect(navigate).toHaveBeenCalledWith("/ventes");
  });

  it("devrait rejeter si l'utilisateur n'est pas un superviseur", async () => {
    mockSignInWithEmailAndPassword.mockResolvedValue({
      user: { uid: "user-123" },
    });

    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        id: "user-123",
        nom: "Martin",
        role: "admin", // Pas superviseur
      }),
    });

    mockSignOut.mockResolvedValue(undefined);

    const navigate = vi.fn();

    await expect(
      userToolkit.loginUser("sophie@example.com", "password123", navigate)
    ).rejects.toThrow("ce compte n'est pas un compte superviseur");

    expect(mockSignOut).toHaveBeenCalledOnce();
  });

  it("devrait gérer les identifiants invalides", async () => {
    mockSignInWithEmailAndPassword.mockRejectedValue({
      code: "auth/invalid-credential",
    });

    const navigate = vi.fn();

    await expect(
      userToolkit.loginUser("sophie@example.com", "wrongpassword", navigate)
    ).rejects.toThrow("Email ou mot de passe incorrect");
  });

  it("devrait gérer trop de tentatives de connexion", async () => {
    mockSignInWithEmailAndPassword.mockRejectedValue({
      code: "auth/too-many-requests",
    });

    const navigate = vi.fn();

    await expect(
      userToolkit.loginUser("sophie@example.com", "password123", navigate)
    ).rejects.toThrow("Trop de tentatives");
  });

  it("devrait rejeter si les données utilisateur sont introuvables", async () => {
    mockSignInWithEmailAndPassword.mockResolvedValue({
      user: { uid: "sup-123" },
    });

    mockGetDoc.mockResolvedValue({
      exists: () => false,
    });

    const navigate = vi.fn();

    await expect(
      userToolkit.loginUser("sophie@example.com", "password123", navigate)
    ).rejects.toThrow("Données utilisateur introuvables");
  });
});

// ============================================================================
// 8. TESTS DE logoutUser()
// ============================================================================

describe("logoutUser()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentUser.uid = "sup-123";
  });

  it("devrait déconnecter un superviseur et le rediriger", async () => {
    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => ({
        id: "sup-123",
        nom: "Martin",
        prenoms: ["Sophie"],
        role: "superviseur",
        connectedAt: Date.now(),
      }),
    });

    mockUpdate.mockResolvedValue(undefined);
    mockSignOut.mockResolvedValue(undefined);

    const navigate = vi.fn();

    const result = await userToolkit.logoutUser(navigate, "/login");

    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        disconnectedAt: expect.any(Number),
      })
    );
    expect(mockSignOut).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith("/login");
  });

  it("devrait utiliser le chemin par défaut si non fourni", async () => {
    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => ({
        id: "sup-123",
        nom: "Martin",
        prenoms: ["Sophie"],
        role: "superviseur",
        connectedAt: Date.now(),
      }),
    });

    mockUpdate.mockResolvedValue(undefined);
    mockSignOut.mockResolvedValue(undefined);

    const navigate = vi.fn();

    await userToolkit.logoutUser(navigate);

    expect(navigate).toHaveBeenCalledWith("/login");
  });

  it("devrait gérer l'absence d'utilisateur connecté", async () => {
    const { auth } = await import("../../firebase.js");
    const originalUser = auth.currentUser;
    auth.currentUser = null;

    const navigate = vi.fn();
    const result = await userToolkit.logoutUser(navigate);

    expect(result.success).toBe(false);
    expect(result.message).toContain("Aucun utilisateur connecté");

    auth.currentUser = originalUser;
  });
});
