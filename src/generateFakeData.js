// 📁 scripts/generateFakeData.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { faker } from "@faker-js/faker";

// 🔑 Config Firebase
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ➕ Générer 200 commandes
async function generateCommandes() {
  const commandesRef = collection(db, "commandes");
  for (let i = 1; i <= 200; i++) {
    const sexe = faker.helpers.arrayElement(["H", "F"]);
    const suffix = faker.helpers.arrayElement(["-P", "-C", "-G"]);
    const code_commande = `2025${sexe}${String(i).padStart(3, "0")}${suffix}`;

    await addDoc(commandesRef, {
      code_commande,
      prenom_client: faker.name.firstName(),
      telephone: faker.phone.number("01########"),
      type_appel: faker.helpers.arrayElement(["direct", "whatsapp"]),
      adresse: faker.address.city(),
      indication_adresse: faker.address.streetAddress(),
      date_livraison: faker.date.future().toISOString().split("T")[0],
      heure_livraison: `${faker.number.int({ min: 8, max: 20 })}:00`,
      paiement: faker.helpers.arrayElement(["especes", "mobile-money"]),
      cout_total: faker.number.int({ min: 5000, max: 30000 }),
      livreur: faker.helpers.arrayElement(["SMART Livraison", "BB Express"]),
      nombre_box_poisson: faker.number.int(3),
      nombre_box_viande: faker.number.int(3),
      nombre_yaourt_banane: faker.number.int(2),
      nombre_yaourt_mangue: faker.number.int(2),
      nombre_yaourt_nature: faker.number.int(2),
      nombre_sandwich_viande_unique: faker.number.int(2),
      nombre_sandwich_poisson_unique: faker.number.int(2),
      nombre_yaourt_nature_unique: faker.number.int(2),
      nombre_yaourt_mangue_unique: faker.number.int(2),
      nombre_yaourt_banane_unique: faker.number.int(2),
    });
  }
}

// ➕ Générer 200 livraisons
async function generateLivraisons() {
  const livraisonsRef = collection(db, "livraisons");
  for (let i = 1; i <= 200; i++) {
    await addDoc(livraisonsRef, {
      code_commande: `2025H${String(i).padStart(3, "0")}-P`,
      livreur: faker.helpers.arrayElement(["SMART Transport", "BB Express"]),
      statut: faker.helpers.arrayElement([
        "en cours",
        "livree",
        "annulee",
        "en attente",
      ]),
      heure_prevue: `${faker.number.int({ min: 8, max: 20 })}:00`,
      heure_reelle: `${faker.number.int({
        min: 8,
        max: 20,
      })}:${faker.number.int({ min: 0, max: 59 })}`,
      zone_prevue: faker.address.city(),
      zone_reelle: faker.address.city(),
    });
  }
}

// ➕ Générer 200 productions
async function generateProductions() {
  const prodRef = collection(db, "productions");
  for (let i = 1; i <= 200; i++) {
    await addDoc(prodRef, {
      code_production: "yaourt",
      date: faker.date.past().toISOString().split("T")[0],
      cout_total: faker.number.int({ min: 30000, max: 80000 }),
      resultat: {
        yaourt_banane: faker.number.int(50),
        yaourt_mangue: faker.number.int(50),
        yaourt_nature: faker.number.int(100),
      },
    });
  }
}

// ➕ Générer 200 employés
async function generateEmployes() {
  const employesRef = collection(db, "employes");
  for (let i = 1; i <= 200; i++) {
    await addDoc(employesRef, {
      nom: faker.person.lastName(),
      prenom: faker.person.firstName(),
      email: faker.internet.email(),
      role: faker.helpers.arrayElement(["superviseur", "livreur", "admin"]),
    });
  }
}

// ➕ Générer 200 stocks
async function generateStocks() {
  const stocksRef = collection(db, "stocks");
  const produits = ["yaourt", "sandwich", "boisson", "pain"];
  for (let i = 1; i <= 200; i++) {
    await addDoc(stocksRef, {
      element: faker.helpers.arrayElement(produits),
      quantite: faker.number.int(100),
      seuil_critique: faker.number.int({ min: 10, max: 30 }),
      unite: "Unite",
    });
  }
}

// ➕ Générer 200 statistiques CA
async function generateStatistiques() {
  const statsRef = collection(db, "statistiques");
  for (let i = 1; i <= 200; i++) {
    await addDoc(statsRef, {
      date: faker.date.past().toISOString().split("T")[0],
      ca_total: faker.number.int({ min: 20000, max: 150000 }),
      satisfaction: faker.number.int({ min: 80, max: 100 }),
      heures_pointe: ["12:00", "13:00", "19:00"],
      performance_mensuelle: {
        commandes: faker.number.int(100),
        livraisons: faker.number.int(100),
      },
    });
  }
}

// 🏁 Exécution
async function main() {
  await generateCommandes();
  await generateLivraisons();
  await generateProductions();
  await generateEmployes();
  await generateStocks();
  await generateStatistiques();
  console.log("✅ Données générées avec succès");
}
