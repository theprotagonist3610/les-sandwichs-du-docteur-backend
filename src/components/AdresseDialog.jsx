import React, { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader, MapPin, Pencil } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export default function AdresseDialog({
  open,
  mode = "add",
  adresse = null,
  onClose,
  onSubmit,
  disabled = false,
  livreurs = [],
  pointsDeVente = [],
}) {
  const [form, setForm] = useState({
    departement: "",
    ville: "",
    quartier: "",
    tarifs: [],
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [tarifForm, setTarifForm] = useState({
    livreur_id: "",
    depart_id: "",
    tarif: "",
  });
  const [editingTarifIdx, setEditingTarifIdx] = useState(null);
  const [editTarifDialogOpen, setEditTarifDialogOpen] = useState(false);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setErrors({});
      setSubmitting(false);
      setTarifForm({ livreur_id: "", depart_id: "", tarif: "" });
      setEditingTarifIdx(null);
      setEditTarifDialogOpen(false);
      if (adresse) {
        setForm({
          departement: adresse.departement || "",
          ville: adresse.ville || "",
          quartier: adresse.quartier || "",
          tarifs: Array.isArray(adresse.tarifs) ? adresse.tarifs : [],
        });
      } else {
        setForm({ departement: "", ville: "", quartier: "", tarifs: [] });
      }
      setTimeout(() => {
        if (firstInputRef.current) firstInputRef.current.focus();
      }, 200);
    }
  }, [open, adresse]);

  // Validation
  const validate = () => {
    let errs = {};
    if (!form.departement) errs.departement = "Département obligatoire";
    if (!form.ville) errs.ville = "Ville obligatoire";
    if (!form.quartier) errs.quartier = "Quartier obligatoire";
    return errs;
  };

  // Handlers
  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  // Ajout d'un tarif
  const handleAddTarif = () => {
    if (!tarifForm.livreur_id || !tarifForm.depart_id || !tarifForm.tarif)
      return;
    const livreur = livreurs.find((l) => l.id === tarifForm.livreur_id);
    const depart = pointsDeVente.find((pv) => pv.id === tarifForm.depart_id);
    const newTarif = {
      livreur_id: tarifForm.livreur_id,
      livreur_nom: livreur
        ? `${livreur.prenom} ${livreur.nom}`
        : tarifForm.livreur_id,
      depart_id: tarifForm.depart_id,
      depart_nom: depart ? depart.denomination : tarifForm.depart_id,
      tarif: Number(tarifForm.tarif),
    };
    setForm((prev) => ({
      ...prev,
      tarifs: [...prev.tarifs, newTarif],
    }));
    setTarifForm({ livreur_id: "", depart_id: "", tarif: "" });
  };

  // Edition d'un tarif
  const openEditTarifDialog = (idx) => {
    setEditingTarifIdx(idx);
    const t = form.tarifs[idx];
    setTarifForm({
      livreur_id: t.livreur_id,
      depart_id: t.depart_id,
      tarif: t.tarif,
    });
    setEditTarifDialogOpen(true);
  };
  const handleEditTarif = () => {
    if (editingTarifIdx === null) return;
    const livreur = livreurs.find((l) => l.id === tarifForm.livreur_id);
    const depart = pointsDeVente.find((pv) => pv.id === tarifForm.depart_id);
    const newTarif = {
      livreur_id: tarifForm.livreur_id,
      livreur_nom: livreur
        ? `${livreur.prenom} ${livreur.nom}`
        : tarifForm.livreur_id,
      depart_id: tarifForm.depart_id,
      depart_nom: depart ? depart.denomination : tarifForm.depart_id,
      tarif: Number(tarifForm.tarif),
    };
    setForm((prev) => ({
      ...prev,
      tarifs: prev.tarifs.map((t, idx) =>
        idx === editingTarifIdx ? newTarif : t
      ),
    }));
    setEditTarifDialogOpen(false);
    setEditingTarifIdx(null);
    setTarifForm({ livreur_id: "", depart_id: "", tarif: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (disabled || submitting) return;
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSubmitting(true);
    await onSubmit(form);
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => !submitting && onClose()}>
      <DialogContent
        className="max-w-md w-full mx-auto p-0"
        style={{ maxHeight: "90vh" }}>
        <DialogHeader className="p-4">
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />{" "}
            {mode === "add" ? "Ajouter une adresse" : "Modifier l'adresse"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Remplis les champs pour ajouter une nouvelle adresse de livraison."
              : "Modifie les informations puis sauvegarde."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          <ScrollArea className="max-h-[62vh] p-4">
            <div>
              <label className="block text-sm font-semibold mb-1">
                Département *
              </label>
              <Input
                ref={firstInputRef}
                name="departement"
                value={form.departement}
                onChange={handleChange}
                disabled={submitting}
                placeholder="Département"
                required
              />
              {errors.departement && (
                <div className="text-xs text-red-600">{errors.departement}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">
                Ville *
              </label>
              <Input
                name="ville"
                value={form.ville}
                onChange={handleChange}
                disabled={submitting}
                placeholder="Ville"
                required
              />
              {errors.ville && (
                <div className="text-xs text-red-600">{errors.ville}</div>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">
                Quartier *
              </label>
              <Input
                name="quartier"
                value={form.quartier}
                onChange={handleChange}
                disabled={submitting}
                placeholder="Quartier"
                required
              />
              {errors.quartier && (
                <div className="text-xs text-red-600">{errors.quartier}</div>
              )}
            </div>
            {/* Zone des tarifs */}
            <div className="mt-4">
              <div className="font-semibold mb-2">
                Ajouter un tarif (optionnel)
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                <select
                  className="px-2 py-1 border rounded text-sm"
                  value={tarifForm.livreur_id}
                  onChange={(e) =>
                    setTarifForm((tf) => ({
                      ...tf,
                      livreur_id: e.target.value,
                    }))
                  }
                  disabled={submitting}>
                  <option value="">Sélectionner livreur</option>
                  {livreurs.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.prenom} {l.nom}
                    </option>
                  ))}
                </select>
                <select
                  className="px-2 py-1 border rounded text-sm"
                  value={tarifForm.depart_id}
                  onChange={(e) =>
                    setTarifForm((tf) => ({ ...tf, depart_id: e.target.value }))
                  }
                  disabled={submitting}>
                  <option value="">Départ</option>
                  {pointsDeVente.map((pv) => (
                    <option key={pv.id} value={pv.id}>
                      {pv.denomination}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  className="w-28"
                  placeholder="Tarif (FCFA)"
                  value={tarifForm.tarif}
                  onChange={(e) =>
                    setTarifForm((tf) => ({ ...tf, tarif: e.target.value }))
                  }
                  disabled={submitting}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddTarif}
                  disabled={
                    !tarifForm.livreur_id ||
                    !tarifForm.depart_id ||
                    !tarifForm.tarif ||
                    submitting
                  }>
                  Ajouter
                </Button>
              </div>
              {/* Tableau des tarifs */}
              <table className="w-full text-xs border mb-2">
                <thead>
                  <tr>
                    <th>Livreur</th>
                    <th>Départ</th>
                    <th>Tarif</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {form.tarifs.map((t, idx) => (
                    <tr key={idx} className="border-t">
                      <td>{t.livreur_nom}</td>
                      <td>{t.depart_nom}</td>
                      <td>{t.tarif} FCFA</td>
                      <td>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditTarifDialog(idx)}>
                          <Pencil className="w-4 h-4 text-blue-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollArea>
          <DialogFooter className="flex flex-row gap-2 justify-end mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                "Enregistrer"
              )}
            </Button>
          </DialogFooter>
        </form>

        {/* Dialog d'édition de tarif */}
        <AlertDialog
          open={editTarifDialogOpen}
          onOpenChange={setEditTarifDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Modifier le tarif</AlertDialogTitle>
              <AlertDialogDescription>
                Modifier le tarif du livreur pour le point de départ
                sélectionné.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex flex-col gap-2">
              <select
                className="px-2 py-1 border rounded text-sm"
                value={tarifForm.livreur_id}
                onChange={(e) =>
                  setTarifForm((tf) => ({ ...tf, livreur_id: e.target.value }))
                }>
                <option value="">Sélectionner livreur</option>
                {livreurs.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.prenom} {l.nom}
                  </option>
                ))}
              </select>
              <select
                className="px-2 py-1 border rounded text-sm"
                value={tarifForm.depart_id}
                onChange={(e) =>
                  setTarifForm((tf) => ({ ...tf, depart_id: e.target.value }))
                }>
                <option value="">Départ</option>
                {pointsDeVente.map((pv) => (
                  <option key={pv.id} value={pv.id}>
                    {pv.denomination}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                className="w-32"
                placeholder="Tarif (FCFA)"
                value={tarifForm.tarif}
                onChange={(e) =>
                  setTarifForm((tf) => ({ ...tf, tarif: e.target.value }))
                }
              />
            </div>
            <AlertDialogFooter className="mt-2 flex gap-2">
              <AlertDialogCancel asChild>
                <Button
                  variant="outline"
                  onClick={() => setEditTarifDialogOpen(false)}>
                  Annuler
                </Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button onClick={handleEditTarif}>Enregistrer</Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
