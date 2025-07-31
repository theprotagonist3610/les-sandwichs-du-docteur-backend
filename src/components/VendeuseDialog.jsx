import React, { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader,
  BadgeCheck,
  UserCircle,
  Mail,
  Phone,
  ShoppingBag,
  Store,
} from "lucide-react";

const FONCTION = "Vendeuse";

export default function VendeuseDialog({
  open,
  mode = "add", // "add", "edit", "details"
  vendeuse = null,
  onClose,
  onSubmit,
  disabled = false,
  pointsDeVente = [],
}) {
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    point_vente: "",
    fonction: FONCTION,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setErrors({});
      setSubmitting(false);
      if (vendeuse) {
        setForm({
          nom: vendeuse.nom || "",
          prenom: vendeuse.prenom || "",
          email: vendeuse.email || "",
          telephone: vendeuse.telephone || "",
          point_vente: vendeuse.point_vente || "",
          fonction: FONCTION,
        });
      } else {
        setForm({
          nom: "",
          prenom: "",
          email: "",
          telephone: "",
          point_vente: "",
          fonction: FONCTION,
        });
      }
      setTimeout(() => {
        if (firstInputRef.current) firstInputRef.current.focus();
      }, 200);
    }
  }, [open, vendeuse]);

  // Validation
  const validate = () => {
    let errs = {};
    if (!form.prenom) errs.prenom = "Prénom obligatoire";
    if (!form.nom) errs.nom = "Nom obligatoire";
    if (!form.email || !form.email.includes("@"))
      errs.email = "Email valide obligatoire";
    if (!form.telephone || form.telephone.length < 6)
      errs.telephone = "Téléphone valide obligatoire";
    if (!form.point_vente) errs.point_vente = "Point de vente obligatoire";
    return errs;
  };

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (disabled || submitting) return;
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSubmitting(true);
    await onSubmit({ ...form, fonction: FONCTION });
    setSubmitting(false);
  };

  const isReadOnly = mode === "details";
  const dialogTitle =
    mode === "add"
      ? "Créer une vendeuse"
      : mode === "edit"
      ? "Modifier la vendeuse"
      : "Détails de la vendeuse";

  return (
    <Dialog open={open} onOpenChange={() => !submitting && onClose()}>
      <DialogContent
        className="max-w-md w-full mx-auto"
        style={{ maxHeight: "90vh" }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-blue-600" /> {dialogTitle}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Remplis tous les champs pour ajouter une vendeuse."
              : mode === "edit"
              ? "Modifie les informations puis sauvegarde."
              : "Voici les informations de la vendeuse."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div>
            <label className="flex items-center gap-1 text-sm font-semibold mb-1">
              <UserCircle className="w-4 h-4" />
              Prénom <span className="text-red-500">*</span>
            </label>
            <Input
              ref={firstInputRef}
              name="prenom"
              value={form.prenom}
              onChange={handleChange}
              disabled={submitting || isReadOnly}
              placeholder="Prénom"
              autoComplete="off"
              required
            />
            {errors.prenom && (
              <div className="text-xs text-red-600">{errors.prenom}</div>
            )}
          </div>
          <div>
            <label className="flex items-center gap-1 text-sm font-semibold mb-1">
              <UserCircle className="w-4 h-4" />
              Nom <span className="text-red-500">*</span>
            </label>
            <Input
              name="nom"
              value={form.nom}
              onChange={handleChange}
              disabled={submitting || isReadOnly}
              placeholder="Nom"
              autoComplete="off"
              required
            />
            {errors.nom && (
              <div className="text-xs text-red-600">{errors.nom}</div>
            )}
          </div>
          <div>
            <label className="flex items-center gap-1 text-sm font-semibold mb-1">
              <Mail className="w-4 h-4" />
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              disabled={submitting || isReadOnly}
              placeholder="exemple@email.com"
              autoComplete="off"
              required
            />
            {errors.email && (
              <div className="text-xs text-red-600">{errors.email}</div>
            )}
          </div>
          <div>
            <label className="flex items-center gap-1 text-sm font-semibold mb-1">
              <Phone className="w-4 h-4" />
              Téléphone <span className="text-red-500">*</span>
            </label>
            <Input
              name="telephone"
              value={form.telephone}
              onChange={handleChange}
              disabled={submitting || isReadOnly}
              placeholder="Numéro"
              autoComplete="off"
              required
            />
            {errors.telephone && (
              <div className="text-xs text-red-600">{errors.telephone}</div>
            )}
          </div>
          {/* --- Select Point de Vente dynamique --- */}
          <div>
            <label className="flex items-center gap-1 text-sm font-semibold mb-1">
              <Store className="w-4 h-4" />
              Point de vente <span className="text-red-500">*</span>
            </label>
            <select
              name="point_vente"
              value={form.point_vente}
              onChange={handleChange}
              disabled={submitting || isReadOnly}
              className="block w-full border rounded px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              required>
              <option value="">Sélectionner un point de vente</option>
              {pointsDeVente.map((pv) => (
                <option key={pv.id} value={pv.nom || pv.id}>
                  {pv.nom || pv.id}
                </option>
              ))}
            </select>
            {errors.point_vente && (
              <div className="text-xs text-red-600">{errors.point_vente}</div>
            )}
          </div>
          <div>
            <label className="flex items-center gap-1 text-sm font-semibold mb-1">
              <BadgeCheck className="w-4 h-4" />
              Fonction
            </label>
            <Input
              name="fonction"
              value={form.fonction}
              disabled
              className="font-bold"
              readOnly
            />
          </div>
          <DialogFooter className="mt-3 flex flex-row gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}>
              Annuler
            </Button>
            {mode !== "details" && (
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  "Enregistrer"
                )}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
