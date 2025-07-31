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
import { Hash } from "lucide-react";

export default function TypeNumeroDialog({
  open,
  mode = "add", // "add", "edit", "details"
  typeNumero = null,
  onClose,
  onSubmit,
  disabled = false,
}) {
  const [form, setForm] = useState({
    type: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setErrors({});
      setSubmitting(false);
      if (typeNumero) {
        setForm({
          type: typeNumero.type || "",
        });
      } else {
        setForm({
          type: "",
        });
      }
      setTimeout(() => {
        if (firstInputRef.current) firstInputRef.current.focus();
      }, 200);
    }
  }, [open, typeNumero]);

  const validate = () => {
    let errs = {};
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
      ? "Créer un type de numéro"
      : mode === "edit"
      ? "Modifier le type de numéro"
      : "Détails du type de numéro";

  return (
    <Dialog open={open} onOpenChange={() => !submitting && onClose()}>
      <DialogContent
        className="max-w-md w-full mx-auto"
        style={{ maxHeight: "90vh" }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="w-6 h-6 text-teal-600" /> {dialogTitle}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Ajoute un nouveau type de numéro."
              : mode === "edit"
              ? "Modifie le type de numéro puis sauvegarde."
              : "Voici le type de numéro."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div>
            <label className="flex items-center gap-1 text-sm font-semibold mb-1">
              <Hash className="w-4 h-4" />
              Type <span className="text-red-500">*</span>
            </label>
            <Input
              ref={firstInputRef}
              name="type"
              value={form.type}
              onChange={handleChange}
              disabled={submitting || isReadOnly}
              placeholder="Ex: Moov, MTN, Orange..."
              autoComplete="off"
              required
            />
            {errors.type && (
              <div className="text-xs text-red-600">{errors.type}</div>
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
