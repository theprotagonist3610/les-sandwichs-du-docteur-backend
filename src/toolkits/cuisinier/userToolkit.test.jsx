// ============================================================================
// cuisinier/userToolkit.test.jsx - Tests unitaires pour userToolkit cuisinier
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
  mockCurrentUser: { uid: "test-cuisinier-id" },
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

describe("cuisinier/userToolkit", () => {
  describe("userSchema()", () => {
    it("devrait valider un cuisinier avec role='cuisinier'", () => {
      const user = {
        id: "cui-123",
        nom: "Dossou",
        prenoms: ["Pierre"],
        email: "pierre@example.com",
        contact: "2290187654321",
        sexe: "m",
        date_naissance: 631152000000,
        role: "cuisinier",
      };
      expect(userToolkit.userSchemaComplet.safeParse(user).success).toBe(true);
    });

    it("devrait rejeter un role différent de 'cuisinier'", () => {
      const user = {
        id: "cui-123",
        nom: "Dossou",
        prenoms: ["Pierre"],
        email: "pierre@example.com",
        contact: "2290187654321",
        sexe: "m",
        date_naissance: 631152000000,
        role: "superviseur",
      };
      expect(userToolkit.userSchemaComplet.safeParse(user).success).toBe(false);
    });
  });

  describe("createUser()", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mockCreateUserWithEmailAndPassword.mockResolvedValue({
        user: { uid: "new-cuisinier-id" },
      });
      mockSetDoc.mockResolvedValue(undefined);
      mockSet.mockResolvedValue(undefined);
      mockSignInWithEmailAndPassword.mockResolvedValue({
        user: { uid: "new-cuisinier-id" },
      });
    });

    it("devrait créer un cuisinier avec role='cuisinier'", async () => {
      const userData = {
        nom: "Dossou",
        prenoms: ["Pierre"],
        email: "pierre@example.com",
        password: "password123",
        contact: "2290187654321",
        sexe: "m",
        date_naissance: 631152000000,
      };

      const result = await userToolkit.createUser(userData);

      expect(result.success).toBe(true);
      expect(result.user.role).toBe("cuisinier");
      expect(result.message).toContain("Cuisinier");
    });
  });

  describe("loginUser()", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("devrait rediriger vers /production par défaut", async () => {
      mockSignInWithEmailAndPassword.mockResolvedValue({
        user: { uid: "cui-123" },
      });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          id: "cui-123",
          nom: "Dossou",
          prenoms: ["Pierre"],
          role: "cuisinier",
        }),
      });

      mockGet.mockResolvedValue({
        exists: () => true,
        val: () => ({
          id: "cui-123",
          nom: "Dossou",
          prenoms: ["Pierre"],
          role: "cuisinier",
          connectedAt: Date.now(),
        }),
      });

      mockUpdate.mockResolvedValue(undefined);

      const navigate = vi.fn();

      await userToolkit.loginUser("pierre@example.com", "password123", navigate);

      expect(navigate).toHaveBeenCalledWith("/production");
    });

    it("devrait rejeter si le role n'est pas 'cuisinier'", async () => {
      mockSignInWithEmailAndPassword.mockResolvedValue({
        user: { uid: "user-123" },
      });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          id: "user-123",
          nom: "Test",
          role: "livreur",
        }),
      });

      mockSignOut.mockResolvedValue(undefined);

      const navigate = vi.fn();

      await expect(
        userToolkit.loginUser("test@example.com", "password123", navigate)
      ).rejects.toThrow("ce compte n'est pas un compte cuisinier");

      expect(mockSignOut).toHaveBeenCalledOnce();
    });
  });

  describe("setUserPresence()", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("devrait forcer le role à 'cuisinier'", async () => {
      mockGet.mockResolvedValue({
        exists: () => false,
      });

      mockUpdate.mockResolvedValue(undefined);

      await userToolkit.setUserPresence("cui-123", {
        nom: "Dossou",
        prenoms: ["Pierre"],
        role: "admin", // Tentative d'un autre role
        connectedAt: Date.now(),
      });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          role: "cuisinier",
        })
      );
    });
  });
});
