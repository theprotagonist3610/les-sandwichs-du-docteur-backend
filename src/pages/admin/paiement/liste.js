const moyensDePaiement = [
  {
    groupe: "Especes",
    liste: [
      {
        denomination: "Caisse",
        type: "especes",
      },
    ],
  },
  {
    groupe: "Paiement Mobile",
    liste: [
      {
        denomination: "Mobile Money",
        type: "paiement_mobile",
        numero: "0197458271",
      },
      {
        denomination: "Moov Money",
        type: "paiement_mobile",
        numero: "",
      },
      {
        denomination: "Celtiis Cash",
        type: "paiement_mobile",
        numero: "",
        codeUSSD: "",
      },
    ],
  },
  {
    groupe: "Compte bancaire",
    liste: [
      {
        denomination: "Compte Recettes 1",
        type: "compte_bancaire",
        numero: "",
      },
    ],
  },
];

export default moyensDePaiement;
