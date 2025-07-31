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
import { Loader, BadgeCheck } from "lucide-react";

const TYPE_OPTIONS = [
  "mobile money",
  "espèces",
  "chèque",
  "virement bancaire",
  "autre",
];

export default function MoyenPaiementDialog({
  open,
  mode = "add",
  moyen = null,
  onClose,
  onSubmit,
  disabled = false,
}) {
  const [form, setForm] = useState({
    denomination: "",
    type: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setErrors({});
      setSubmitting(false);
      if (moyen) {
        setForm({
          denomination: moyen.denomination || "",
          type: moyen.type || "",
        });
      } else {
        setForm({ denomination: "", type: "" });
      }
      setTimeout(() => {
        if (firstInputRef.current) firstInputRef.current.focus();
      }, 200);
    }
  }, [open, moyen]);

  // Validation simple
  const validate = () => {
    let errs = {};
    if (!form.denomination) errs.denomination = "Dénomination obligatoire";
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

  const handleTypeChange = (value) => {
    setForm((prev) => ({ ...prev, type: value }));
    setErrors((prev) => ({ ...prev, type: undefined }));
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
        className="max-w-md w-full mx-auto"
        style={{ maxHeight: "90vh" }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BadgeCheck className="w-5 h-5 text-green-600" />
            {mode === "add"
              ? "Ajouter un moyen de paiement"
              : "Modifier le moyen de paiement"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Remplis les champs pour ajouter un moyen de paiement."
              : "Modifie les informations puis sauvegarde."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <label className="block text-sm font-semibold mb-1">
              Dénomination <span className="text-red-500">*</span>
            </label>
            <Input
              ref={firstInputRef}
              name="denomination"
              value={form.denomination}
              onChange={handleChange}
              disabled={submitting || mode === "edit"} // non modifiable en édition
              placeholder="ex: MoMo, Espèces, Chèque"
              autoComplete="off"
              required
            />
            {errors.denomination && (
              <div className="text-xs text-red-600">{errors.denomination}</div>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">
              Type <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {TYPE_OPTIONS.map((option) => (
                <Button
                  key={option}
                  type="button"
                  size="sm"
                  variant={form.type === option ? "default" : "outline"}
                  className={form.type === option ? "ring-2 ring-primary" : ""}
                  onClick={() => handleTypeChange(option)}
                  disabled={submitting}>
                  {option}
                </Button>
              ))}
            </div>
            {errors.type && (
              <div className="text-xs text-red-600">{errors.type}</div>
            )}
          </div>
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
      </DialogContent>
    </Dialog>
  );
}
