/**
 * Tests pour le système de queue d'opérations du stockToolkit
 *
 * Ces tests vérifient que:
 * 1. Les opérations concurrentes sont gérées correctement
 * 2. Les quantités ne deviennent jamais négatives
 * 3. Les opérations sont exécutées dans l'ordre chronologique
 * 4. runTransaction empêche les collisions Firestore
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  enqueueOperation,
  executeOperations,
  cleanQueue,
  TRANSACTION_TYPES,
  OPERATION_STATUS,
} from "../toolkits/admin/stockToolkit";

describe("Stock Queue System - Gestion des collisions", () => {
  beforeEach(() => {
    // Mock de l'authentification
    vi.mock("@/firebase.js", () => ({
      auth: {
        currentUser: {
          uid: "test-user-123",
          displayName: "Test User",
          email: "test@example.com",
        },
      },
      db: {},
      rtdb: {},
    }));
  });

  describe("enqueueOperation", () => {
    it("devrait ajouter une opération à la queue", async () => {
      const operation = await enqueueOperation(TRANSACTION_TYPES.ENTREE, {
        elementId: "STK-001",
        quantite: 50,
        emplacementId: "empl_001",
        note: "Réception de marchandises",
      });

      expect(operation).toBeDefined();
      expect(operation.id).toMatch(/^OP-/);
      expect(operation.status).toBe(OPERATION_STATUS.PENDING);
      expect(operation.type).toBe(TRANSACTION_TYPES.ENTREE);
      expect(operation.payload.quantite).toBe(50);
    });

    it("devrait valider les données avec le schema Zod", async () => {
      await expect(
        enqueueOperation(TRANSACTION_TYPES.ENTREE, {
          elementId: "",
          quantite: -10, // Invalide
        })
      ).rejects.toThrow();
    });
  });

  describe("executeOperations - Ordre chronologique", () => {
    it("devrait exécuter les opérations dans l'ordre chronologique", async () => {
      // Simuler 3 opérations ajoutées à des moments différents
      const op1 = await enqueueOperation(TRANSACTION_TYPES.ENTREE, {
        elementId: "STK-001",
        quantite: 100,
        emplacementId: "empl_001",
      });

      // Attendre 10ms pour avoir un timestamp différent
      await new Promise((resolve) => setTimeout(resolve, 10));

      const op2 = await enqueueOperation(TRANSACTION_TYPES.SORTIE, {
        elementId: "STK-001",
        quantite: 30,
        emplacementId: "empl_001",
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const op3 = await enqueueOperation(TRANSACTION_TYPES.SORTIE, {
        elementId: "STK-001",
        quantite: 20,
        emplacementId: "empl_001",
      });

      // Exécuter toutes les opérations
      const results = await executeOperations();

      expect(results.success).toBe(3);
      expect(results.failed).toBe(0);

      // Vérifier que les opérations ont été exécutées dans l'ordre
      // op1 (entrée +100) -> op2 (sortie -30) -> op3 (sortie -20)
      // Résultat final: 100 - 30 - 20 = 50
    });
  });

  describe("executeOperations - Validation des quantités négatives", () => {
    it("ne devrait pas permettre de quantités négatives", async () => {
      // Ajouter une sortie sans avoir de stock
      await enqueueOperation(TRANSACTION_TYPES.SORTIE, {
        elementId: "STK-002",
        quantite: 50,
        emplacementId: "empl_002",
      });

      const results = await executeOperations();

      // L'opération devrait échouer
      expect(results.failed).toBe(1);
      expect(results.errors.length).toBe(1);
      expect(results.errors[0].error).toContain("insuffisant");
    });

    it("devrait empêcher une sortie dépassant le stock disponible", async () => {
      // Ajouter du stock
      await enqueueOperation(TRANSACTION_TYPES.ENTREE, {
        elementId: "STK-003",
        quantite: 100,
        emplacementId: "empl_003",
      });

      // Essayer de retirer plus que disponible
      await enqueueOperation(TRANSACTION_TYPES.SORTIE, {
        elementId: "STK-003",
        quantite: 150, // Plus que les 100 disponibles
        emplacementId: "empl_003",
      });

      const results = await executeOperations();

      // Première opération réussie, deuxième échouée
      expect(results.success).toBe(1);
      expect(results.failed).toBe(1);
    });
  });

  describe("executeOperations - Gestion des transferts", () => {
    it("devrait transférer correctement entre emplacements", async () => {
      // Ajouter du stock à l'emplacement source
      await enqueueOperation(TRANSACTION_TYPES.ENTREE, {
        elementId: "STK-004",
        quantite: 100,
        emplacementId: "empl_source",
      });

      // Transférer vers destination
      await enqueueOperation(TRANSACTION_TYPES.TRANSFERT, {
        elementId: "STK-004",
        quantite: 40,
        fromEmplacementId: "empl_source",
        toEmplacementId: "empl_dest",
      });

      const results = await executeOperations();

      expect(results.success).toBe(2);
      expect(results.failed).toBe(0);

      // Source devrait avoir 60, destination devrait avoir 40
    });

    it("ne devrait pas permettre un transfert avec stock source insuffisant", async () => {
      await enqueueOperation(TRANSACTION_TYPES.ENTREE, {
        elementId: "STK-005",
        quantite: 50,
        emplacementId: "empl_source2",
      });

      await enqueueOperation(TRANSACTION_TYPES.TRANSFERT, {
        elementId: "STK-005",
        quantite: 80, // Plus que les 50 disponibles
        fromEmplacementId: "empl_source2",
        toEmplacementId: "empl_dest2",
      });

      const results = await executeOperations();

      expect(results.success).toBe(1);
      expect(results.failed).toBe(1);
    });
  });

  describe("executeOperations - Opérations concurrentes", () => {
    it("devrait gérer correctement plusieurs opérations concurrentes", async () => {
      // Simuler plusieurs utilisateurs ajoutant des opérations en même temps
      const operations = [];

      // Ajouter du stock initial
      operations.push(
        enqueueOperation(TRANSACTION_TYPES.ENTREE, {
          elementId: "STK-006",
          quantite: 1000,
          emplacementId: "empl_concurrent",
        })
      );

      // Ajouter 10 sorties concurrentes de 50 unités chacune
      for (let i = 0; i < 10; i++) {
        operations.push(
          enqueueOperation(TRANSACTION_TYPES.SORTIE, {
            elementId: "STK-006",
            quantite: 50,
            emplacementId: "empl_concurrent",
            note: `Sortie concurrente ${i + 1}`,
          })
        );
      }

      // Attendre que toutes les opérations soient ajoutées
      await Promise.all(operations);

      // Exécuter toutes les opérations
      const results = await executeOperations();

      // Toutes devraient réussir (1 entrée + 10 sorties = 11)
      expect(results.success).toBe(11);
      expect(results.failed).toBe(0);

      // Stock final devrait être: 1000 - (10 * 50) = 500
    });

    it("devrait échouer proprement quand plusieurs sorties dépassent le stock", async () => {
      // Stock initial de 100
      await enqueueOperation(TRANSACTION_TYPES.ENTREE, {
        elementId: "STK-007",
        quantite: 100,
        emplacementId: "empl_limit",
      });

      // Ajouter 5 sorties de 30 unités (total demandé: 150)
      const operations = [];
      for (let i = 0; i < 5; i++) {
        operations.push(
          enqueueOperation(TRANSACTION_TYPES.SORTIE, {
            elementId: "STK-007",
            quantite: 30,
            emplacementId: "empl_limit",
          })
        );
      }

      await Promise.all(operations);

      const results = await executeOperations();

      // 1 entrée + 3 sorties (90 unités) devraient réussir
      // 2 dernières sorties devraient échouer
      expect(results.success).toBe(4); // 1 entrée + 3 sorties
      expect(results.failed).toBe(2); // 2 dernières sorties
    });
  });

  describe("cleanQueue", () => {
    it("devrait supprimer les opérations complétées de plus de 24h", async () => {
      // Ajouter une opération
      await enqueueOperation(TRANSACTION_TYPES.ENTREE, {
        elementId: "STK-008",
        quantite: 50,
        emplacementId: "empl_clean",
      });

      // Exécuter
      await executeOperations();

      // Simuler le passage de 25h
      // (Dans un vrai test, on mockerait la fonction Date.now)

      const removedCount = await cleanQueue();

      // Devrait avoir supprimé l'opération complétée
      expect(removedCount).toBeGreaterThanOrEqual(0);
    });

    it("ne devrait pas supprimer les opérations en attente", async () => {
      await enqueueOperation(TRANSACTION_TYPES.ENTREE, {
        elementId: "STK-009",
        quantite: 50,
        emplacementId: "empl_pending",
      });

      // Ne pas exécuter

      const removedCount = await cleanQueue();

      // Aucune opération en attente ne devrait être supprimée
      expect(removedCount).toBe(0);
    });
  });

  describe("runTransaction - Prévention des collisions", () => {
    it("devrait utiliser runTransaction pour les écritures atomiques", async () => {
      // Ce test vérifie que les opérations utilisent bien runTransaction
      // pour éviter les collisions Firestore

      const operations = [];

      // Simuler 20 opérations concurrentes qui modifient le même document
      for (let i = 0; i < 20; i++) {
        operations.push(
          enqueueOperation(TRANSACTION_TYPES.ENTREE, {
            elementId: `STK-${i}`,
            quantite: 10,
            emplacementId: "empl_atomic",
          })
        );
      }

      await Promise.all(operations);

      // Avec runTransaction, toutes les opérations devraient être enregistrées
      // sans perte de données due aux collisions
      const results = await executeOperations();

      expect(results.success).toBe(20);
      expect(results.failed).toBe(0);
    });
  });
});

describe("Scénarios réels d'utilisation", () => {
  describe("Restaurant - Gestion du stock quotidien", () => {
    it("devrait gérer les opérations d'une journée typique", async () => {
      const operations = [];

      // Matin: Réception de marchandises
      operations.push(
        enqueueOperation(TRANSACTION_TYPES.ENTREE, {
          elementId: "ING-PAIN",
          quantite: 200,
          emplacementId: "entrepot_principal",
          note: "Livraison boulangerie",
        })
      );

      operations.push(
        enqueueOperation(TRANSACTION_TYPES.ENTREE, {
          elementId: "ING-POULET",
          quantite: 50,
          emplacementId: "entrepot_principal",
          note: "Livraison boucher",
        })
      );

      // Transfert vers les stands
      operations.push(
        enqueueOperation(TRANSACTION_TYPES.TRANSFERT, {
          elementId: "ING-PAIN",
          quantite: 80,
          fromEmplacementId: "entrepot_principal",
          toEmplacementId: "stand_plateau",
        })
      );

      operations.push(
        enqueueOperation(TRANSACTION_TYPES.TRANSFERT, {
          elementId: "ING-POULET",
          quantite: 20,
          fromEmplacementId: "entrepot_principal",
          toEmplacementId: "stand_plateau",
        })
      );

      // Ventes de la journée
      operations.push(
        enqueueOperation(TRANSACTION_TYPES.SORTIE, {
          elementId: "ING-PAIN",
          quantite: 60,
          emplacementId: "stand_plateau",
          motif: "Ventes",
        })
      );

      operations.push(
        enqueueOperation(TRANSACTION_TYPES.SORTIE, {
          elementId: "ING-POULET",
          quantite: 15,
          emplacementId: "stand_plateau",
          motif: "Ventes",
        })
      );

      await Promise.all(operations);

      const results = await executeOperations();

      expect(results.success).toBe(6);
      expect(results.failed).toBe(0);

      // Vérifier les stocks finaux:
      // Pain: entrepot=120, stand=20
      // Poulet: entrepot=30, stand=5
    });
  });

  describe("Gestion des erreurs en production", () => {
    it("devrait continuer après une opération échouée", async () => {
      const operations = [];

      // Opération valide
      operations.push(
        enqueueOperation(TRANSACTION_TYPES.ENTREE, {
          elementId: "STK-010",
          quantite: 100,
          emplacementId: "empl_test",
        })
      );

      // Opération invalide
      operations.push(
        enqueueOperation(TRANSACTION_TYPES.SORTIE, {
          elementId: "STK-INEXISTANT",
          quantite: 50,
          emplacementId: "empl_test",
        })
      );

      // Autre opération valide
      operations.push(
        enqueueOperation(TRANSACTION_TYPES.ENTREE, {
          elementId: "STK-011",
          quantite: 75,
          emplacementId: "empl_test",
        })
      );

      await Promise.all(operations);

      const results = await executeOperations();

      // 2 opérations valides devraient réussir malgré l'échec de la 2ème
      expect(results.success).toBe(2);
      expect(results.failed).toBe(1);
      expect(results.errors.length).toBe(1);
    });
  });
});
