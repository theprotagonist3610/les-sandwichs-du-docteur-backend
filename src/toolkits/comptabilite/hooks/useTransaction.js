// ==========================================
// 📄 toolkits/comptabilite/hooks/useTransaction.js
// ==========================================
import { useState, useEffect } from "react";
export const useTransaction = (transactionId) => {
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const charger = async () => {
      if (!transactionId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await TransactionService.getTransaction(transactionId);
        setTransaction(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error("Erreur chargement transaction:", err);
      } finally {
        setLoading(false);
      }
    };

    charger();
  }, [transactionId]);

  return { transaction, loading, error };
};
