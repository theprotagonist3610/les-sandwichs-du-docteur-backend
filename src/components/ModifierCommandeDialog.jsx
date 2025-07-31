// ModifierCommandeDialog.jsx
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ModifierCommandeDialog = ({ commande, onClose }) => {
  return (
    <Dialog open={!!commande} onOpenChange={onClose}>
      <DialogContent>
        <DialogTitle>Modifier commande</DialogTitle>
        <form className="space-y-3">
          <Input defaultValue={commande.prenom_client} />
          <Input defaultValue={commande.telephone} />
          <Input defaultValue={commande.adresse} />
          <Button type="submit">Enregistrer</Button>
          <Button
            variant="destructive"
            type="button"
            onClick={() => {
              /* supprimer ici */
            }}>
            Supprimer
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ModifierCommandeDialog;
