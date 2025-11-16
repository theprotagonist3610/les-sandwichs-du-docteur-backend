// ============================================================================
// setup.js - Configuration globale pour les tests Vitest
// ============================================================================

import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Nettoyage automatique après chaque test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Configuration globale des mocks pour les console logs
global.console = {
  ...console,
  // Désactiver les logs pendant les tests (optionnel)
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};
