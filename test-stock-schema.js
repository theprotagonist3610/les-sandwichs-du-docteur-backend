import { z } from "zod";

const uniteSchema = z.object({
  nom: z.string().min(1),
  symbol: z.string().min(1),
});

const itemStockSchema = z.object({
  id: z.string().min(1),
  denomination: z.string().min(1),
  unite: uniteSchema,
  quantite_actuelle: z.number().min(0),
  imgURL: z.string().optional().default(""),
  description: z.string().optional().default(""),
  type: z.enum(["ingredient", "consommable", "perissable", "materiel", "emballage"]),
  updatedAt: z.number().optional(),
  updatedBy: z.string().optional(),
});

// Test du schema
const testData = {
  "ING-PAIN-001": {
    id: "ING-PAIN-001",
    denomination: "🥖 Pain baguette",
    unite: { nom: "unité", symbol: "u" },
    quantite_actuelle: 80,
    imgURL: "",
    description: "Pain frais",
    type: "ingredient",
    updatedAt: Date.now(),
    updatedBy: "system"
  }
};

try {
  const stockActuelSchema = z.record(itemStockSchema);
  const result = stockActuelSchema.parse(testData);
  console.log("✅ Validation réussie:", JSON.stringify(result, null, 2));
} catch (error) {
  console.error("❌ Erreur de validation:", error.errors);
}
