// ============================================================================
// vendeur/userToolkit.test.jsx - Tests unitaires pour userToolkit vendeur
// ============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as userToolkit from "./userToolkit.jsx";

// ============================================================================
// MOCKS
// ============================================================================

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
  mockCreateUserWithEmailAndPassword: vi.fn(),
  mockSignInWithEmailAndPassword: vi.fn(),
  mockSignOut: vi.fn(),
  mockCurrentUser: { uid: "test-vendeur-id" },
  mockGetDoc: vi.fn(),
  mockSetDoc: vi.fn(),
  mockUpdateDoc: vi.fn(),
  mockDoc: vi.fn((_db, collection, id) => ({ collection, id })),
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
// TESTS
// ============================================================================

describe("vendeur/userToolkit", () => {
  describe("userSchema()", () => {
    it("devrait valider un vendeur avec role='vendeur'", () => {
      const user = {
        id: "ven-123",
        nom: "Adjovi",
        prenoms: ["Marie"],
        email: "marie@example.com",
        contact: "2290187654321",
        sexe: "f",
        date_naissance: 631152000000,
        role: "vendeur",
      };
      expect(userToolkit.userSchemaComplet.safeParse(user).success).toBe(true);
    });

    it("devrait rejeter un role différent de 'vendeur'", () => {
      const user = {
        id: "ven-123",
        nom: "Adjovi",
        prenoms: ["Marie"],
        email: "marie@example.com",
        contact: "2290187654321",
        sexe: "f",
        date_naissance: 631152000000,
        role: "livreur",
      };
      expect(userToolkit.userSchemaComplet.safeParse(user).success).toBe(false);
    });
  });

  describe("createUser()", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mockCreateUserWithEmailAndPassword.mockResolvedValue({
        user: { uid: "new-vendeur-id" },
      });
      mockSetDoc.mockResolvedValue(undefined);
      mockSet.mockResolvedValue(undefined);
      mockSignInWithEmailAndPassword.mockResolvedValue({
        user: { uid: "new-vendeur-id" },
      });
    });

    it("devrait créer un vendeur avec role='vendeur'", async () => {
      const userData = {
        nom: "Adjovi",
        prenoms: ["Marie"],
        email: "marie@example.com",
        password: "password123",
        contact: "2290187654321",
        sexe: "f",
        date_naissance: 631152000000,
      };

      const result = await userToolkit.createUser(userData);

      expect(result.success).toBe(true);
      expect(result.user.role).toBe("vendeur");
      expect(result.message).toContain("Vendeur");
    });
  });

  describe("loginUser()", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("devrait rediriger vers /ventes par défaut", async () => {
      mockSignInWithEmailAndPassword.mockResolvedValue({
        user: { uid: "ven-123" },
      });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          id: "ven-123",
          nom: "Adjovi",
          prenoms: ["Marie"],
          role: "vendeur",
        }),
      });

      mockGet.mockResolvedValue({
        exists: () => true,
        val: () => ({
          id: "ven-123",
          nom: "Adjovi",
          prenoms: ["Marie"],
          role: "vendeur",
          connectedAt: Date.now(),
        }),
      });

      mockUpdate.mockResolvedValue(undefined);

      const navigate = vi.fn();

      await userToolkit.loginUser("marie@example.com", "password123", navigate);

      expect(navigate).toHaveBeenCalledWith("/ventes");
    });

    it("devrait rejeter si le role n'est pas 'vendeur'", async () => {
      mockSignInWithEmailAndPassword.mockResolvedValue({
        user: { uid: "user-123" },
      });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          id: "user-123",
          nom: "Test",
          role: "cuisinier",
        }),
      });

      mockSignOut.mockResolvedValue(undefined);

      const navigate = vi.fn();

      await expect(
        userToolkit.loginUser("test@example.com", "password123", navigate)
      ).rejects.toThrow("ce compte n'est pas un compte vendeur");

      expect(mockSignOut).toHaveBeenCalledOnce();
    });
  });

  describe("setUserPresence()", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("devrait forcer le role à 'vendeur'", async () => {
      mockGet.mockResolvedValue({
        exists: () => false,
      });

      mockUpdate.mockResolvedValue(undefined);

      await userToolkit.setUserPresence("ven-123", {
        nom: "Adjovi",
        prenoms: ["Marie"],
        role: "admin", // Tentative d'un autre role
        connectedAt: Date.now(),
      });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          role: "vendeur",
        })
      );
    });
  });
});
