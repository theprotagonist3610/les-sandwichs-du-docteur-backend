const Livreur = ({ livreur }) => {
  return (
    <div className="space-y-4">
      {livreur ? (
        <div>
          <p className="mb-2 p-2 border-1 rounded-md bg-red-400 text-white italic text-xs">
            {`Le livreur assigne a cette course est : `}
          </p>
        </div>
      ) : (
        <div>
          <p className="mb-2 p-2 border-1 rounded-md bg-red-400 text-white italic text-xs">
            {`Vous n'avez assigné cette course à aucun livreur`}
          </p>
        </div>
      )}
    </div>
  );
};

export default Livreur;
