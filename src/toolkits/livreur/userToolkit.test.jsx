// ============================================================================
// livreur/userToolkit.test.jsx - Tests unitaires pour userToolkit livreur
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
  mockCurrentUser: { uid: "test-livreur-id" },
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

describe("livreur/userToolkit", () => {
  describe("userSchema()", () => {
    it("devrait valider un livreur avec role='livreur'", () => {
      const user = {
        id: "liv-123",
        nom: "Kouassi",
        prenoms: ["Jean"],
        email: "jean@example.com",
        contact: "2290187654321",
        sexe: "m",
        date_naissance: 631152000000,
        role: "livreur",
      };
      expect(userToolkit.userSchemaComplet.safeParse(user).success).toBe(true);
    });

    it("devrait rejeter un role différent de 'livreur'", () => {
      const user = {
        id: "liv-123",
        nom: "Kouassi",
        prenoms: ["Jean"],
        email: "jean@example.com",
        contact: "2290187654321",
        sexe: "m",
        date_naissance: 631152000000,
        role: "vendeur",
      };
      expect(userToolkit.userSchemaComplet.safeParse(user).success).toBe(false);
    });
  });

  describe("createUser()", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mockCreateUserWithEmailAndPassword.mockResolvedValue({
        user: { uid: "new-livreur-id" },
      });
      mockSetDoc.mockResolvedValue(undefined);
      mockSet.mockResolvedValue(undefined);
      mockSignInWithEmailAndPassword.mockResolvedValue({
        user: { uid: "new-livreur-id" },
      });
    });

    it("devrait créer un livreur avec role='livreur'", async () => {
      const userData = {
        nom: "Kouassi",
        prenoms: ["Jean"],
        email: "jean@example.com",
        password: "password123",
        contact: "2290187654321",
        sexe: "m",
        date_naissance: 631152000000,
      };

      const result = await userToolkit.createUser(userData);

      expect(result.success).toBe(true);
      expect(result.user.role).toBe("livreur");
      expect(result.message).toContain("Livreur");
    });
  });

  describe("loginUser()", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("devrait rediriger vers /livraisons par défaut", async () => {
      mockSignInWithEmailAndPassword.mockResolvedValue({
        user: { uid: "liv-123" },
      });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          id: "liv-123",
          nom: "Kouassi",
          prenoms: ["Jean"],
          role: "livreur",
        }),
      });

      mockGet.mockResolvedValue({
        exists: () => true,
        val: () => ({
          id: "liv-123",
          nom: "Kouassi",
          prenoms: ["Jean"],
          role: "livreur",
          connectedAt: Date.now(),
        }),
      });

      mockUpdate.mockResolvedValue(undefined);

      const navigate = vi.fn();

      await userToolkit.loginUser("jean@example.com", "password123", navigate);

      expect(navigate).toHaveBeenCalledWith("/livraisons");
    });

    it("devrait rejeter si le role n'est pas 'livreur'", async () => {
      mockSignInWithEmailAndPassword.mockResolvedValue({
        user: { uid: "user-123" },
      });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          id: "user-123",
          nom: "Test",
          role: "vendeur",
        }),
      });

      mockSignOut.mockResolvedValue(undefined);

      const navigate = vi.fn();

      await expect(
        userToolkit.loginUser("test@example.com", "password123", navigate)
      ).rejects.toThrow("ce compte n'est pas un compte livreur");

      expect(mockSignOut).toHaveBeenCalledOnce();
    });
  });

  describe("setUserPresence()", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("devrait forcer le role à 'livreur'", async () => {
      mockGet.mockResolvedValue({
        exists: () => false,
      });

      mockUpdate.mockResolvedValue(undefined);

      await userToolkit.setUserPresence("liv-123", {
        nom: "Kouassi",
        prenoms: ["Jean"],
        role: "admin", // Tentative d'un autre role
        connectedAt: Date.now(),
      });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          role: "livreur",
        })
      );
    });
  });
});
