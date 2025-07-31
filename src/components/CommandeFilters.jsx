const CommandeFilters = ({ filtre, setFiltre }) => {
  return (
    <div className="flex gap-2 flex-wrap p-2">
      <select
        value={filtre.statut}
        onChange={(e) => setFiltre((f) => ({ ...f, statut: e.target.value }))}>
        <option value="">Tous statuts</option>
        <option value="en_attente">En cours</option>
        <option value="livree">Livrée</option>
        <option value="annulee">Annulée</option>
      </select>
      <select
        value={filtre.paiement}
        onChange={(e) =>
          setFiltre((f) => ({ ...f, paiement: e.target.value }))
        }>
        <option value="">Tous paiements</option>
        <option value="especes">Espèces</option>
        <option value="mobile_money">Mobile Money</option>
      </select>
      <select
        value={filtre.livreur}
        onChange={(e) => setFiltre((f) => ({ ...f, livreur: e.target.value }))}>
        <option value="">Tous livreurs</option>
        <option value="SMART Livraison">SMART Livraison</option>
        <option value="BB Express">BB Express</option>
      </select>
    </div>
  );
};

export default CommandeFilters;
