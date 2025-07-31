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
import { Store, MapPin, Building, Home, ShoppingBag } from "lucide-react";

const TYPES = [
  { value: "boutique", label: "Boutique", icon: Building },
  { value: "kiosque", label: "Kiosque", icon: ShoppingBag },
  { value: "maison", label: "Maison", icon: Home },
];

export default function PointDeVenteDialog({
  open,
  mode = "add", // "add", "edit", "details"
  pointDeVente = null,
  onClose,
  onSubmit,
  disabled = false,
}) {
  const [form, setForm] = useState({
    denomination: "",
    adresse: "",
    type: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setErrors({});
      setSubmitting(false);
      if (pointDeVente) {
        setForm({
          denomination: pointDeVente.denomination || "",
          adresse: pointDeVente.adresse || "",
          type: pointDeVente.type || "",
        });
      } else {
        setForm({
          denomination: "",
          adresse: "",
          type: "",
        });
      }
      setTimeout(() => {
        if (firstInputRef.current) firstInputRef.current.focus();
      }, 200);
    }
  }, [open, pointDeVente]);

  const validate = () => {
    let errs = {};
    if (!form.denomination) errs.denomination = "Dénomination obligatoire";
    if (!form.adresse) errs.adresse = "Adresse obligatoire";
    if (!form.type) errs.type = "Type obligatoire";
    return errs;
  };

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  const handleTypeSelect = (type) => {
    setForm((prev) => ({ ...prev, type }));
    setErrors((prev) => ({ ...prev, type: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (disabled || submitting) return;
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSubmitting(true);
    await onSubmit({ ...form });
    setSubmitting(false);
  };

  const isReadOnly = mode === "details";
  const dialogTitle =
    mode === "add"
      ? "Créer un point de vente"
      : mode === "edit"
      ? "Modifier le point de vente"
      : "Détails du point de vente";

  return (
    <Dialog open={open} onOpenChange={() => !submitting && onClose()}>
      <DialogContent
        className="max-w-md w-full mx-auto"
        style={{ maxHeight: "90vh" }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="w-6 h-6 text-blue-600" /> {dialogTitle}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Remplis tous les champs pour ajouter un point de vente."
              : mode === "edit"
              ? "Modifie les informations puis sauvegarde."
              : "Voici les informations du point de vente."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div>
            <label className="flex items-center gap-1 text-sm font-semibold mb-1">
              <Store className="w-4 h-4" />
              Dénomination <span className="text-red-500">*</span>
            </label>
            <Input
              ref={firstInputRef}
              name="denomination"
              value={form.denomination}
              onChange={handleChange}
              disabled={submitting || isReadOnly}
              placeholder="Ex: Point Akpakpa"
              autoComplete="off"
              required
            />
            {errors.denomination && (
              <div className="text-xs text-red-600">{errors.denomination}</div>
            )}
          </div>
          <div>
            <label className="flex items-center gap-1 text-sm font-semibold mb-1">
              <MapPin className="w-4 h-4" />
              Adresse <span className="text-red-500">*</span>
            </label>
            <Input
              name="adresse"
              value={form.adresse}
              onChange={handleChange}
              disabled={submitting || isReadOnly}
              placeholder="Adresse précise"
              autoComplete="off"
              required
            />
            {errors.adresse && (
              <div className="text-xs text-red-600">{errors.adresse}</div>
            )}
          </div>
          <div>
            <div className="text-sm font-semibold mb-1">Type *</div>
            <div className="flex gap-2">
              {TYPES.map((t) => {
                const Icon = t.icon;
                return (
                  <Button
                    key={t.value}
                    type="button"
                    variant={form.type === t.value ? "default" : "outline"}
                    className="flex items-center gap-1"
                    onClick={() => handleTypeSelect(t.value)}
                    disabled={isReadOnly}>
                    <Icon className="w-4 h-4" /> {t.label}
                  </Button>
                );
              })}
            </div>
            {errors.type && (
              <div className="text-xs text-red-600 mt-1">{errors.type}</div>
            )}
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
                {submitting ? "..." : "Enregistrer"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
