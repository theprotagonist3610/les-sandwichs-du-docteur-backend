// ==========================================
// 📄 toolkits/comptabilite/utils/validators.js
// ==========================================

import comptes from "../liste";
import { CHARGES_FIXES_CODES } from "../constants";

export const validators = {
  findCompteByCode(code_lsd) {
    for (const groupe of comptes) {
      const compte = groupe.liste.find((c) => c.code_lsd === code_lsd);
      if (compte) {
        return { ...compte, groupe: groupe.groupe };
      }
    }
    return null;
  },

  isChargeFixe(compte) {
    return CHARGES_FIXES_CODES.includes(compte.code_lsd);
  },

  validateTransaction(transaction) {
    const compte = this.findCompteByCode(transaction.compte_lsd);
    if (!compte) {
      throw new Error(`Compte ${transaction.compte_lsd} non trouvé`);
    }
    return compte;
  },
};
