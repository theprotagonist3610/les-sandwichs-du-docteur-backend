import React, { useEffect, useRef, useState } from "react";
import { db } from "@/firebase";
import { collection, onSnapshot } from "firebase/firestore";
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
  MapPin,
  Truck,
} from "lucide-react";

const FONCTION = "Livreur";

export default function LivreurDialog({
  open,
  mode = "add", // "add", "edit", "details"
  livreur = null,
  onClose,
  onSubmit,
  disabled = false,
}) {
  const [zonesDispo, setZonesDispo] = useState([]);
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    zones: [],
    fonction: FONCTION,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const firstInputRef = useRef(null);

  // Charger dynamiquement les zones de la sous-collection
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "utils", "options", "zones_geographiques"),
      (snap) => {
        setZonesDispo(snap.docs.map((d) => d.data().nom || d.id).sort());
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (open) {
      setErrors({});
      setSubmitting(false);
      // Pré-remplir en mode edit/details
      if (livreur) {
        setForm({
          nom: livreur.nom || "",
          prenom: livreur.prenom || "",
          email: livreur.email || "",
          telephone: livreur.telephone || "",
          zones: livreur.zones || [],
          fonction: FONCTION,
        });
      } else {
        setForm({
          nom: "",
          prenom: "",
          email: "",
          telephone: "",
          zones: [],
          fonction: FONCTION,
        });
      }
      setTimeout(() => {
        if (firstInputRef.current) firstInputRef.current.focus();
      }, 200);
    }
  }, [open, livreur]);

  // Validation simple (tous sauf zones sont requis)
  const validate = () => {
    let errs = {};
    if (!form.prenom) errs.prenom = "Prénom obligatoire";
    if (!form.nom) errs.nom = "Nom obligatoire";
    if (!form.email || !form.email.includes("@"))
      errs.email = "Email valide obligatoire";
    if (!form.telephone || form.telephone.length < 6)
      errs.telephone = "Téléphone valide obligatoire";
    return errs;
  };

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  };

  const handleZoneToggle = (zone) => {
    setForm((prev) => ({
      ...prev,
      zones: prev.zones.includes(zone)
        ? prev.zones.filter((z) => z !== zone)
        : [...prev.zones, zone],
    }));
    setErrors((prev) => ({ ...prev, zones: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (disabled || submitting) return;
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSubmitting(true);
    onSubmit({ ...form, fonction: FONCTION });
    setSubmitting(false);
  };

  const isReadOnly = mode === "details";
  const dialogTitle =
    mode === "add"
      ? "Créer un livreur"
      : mode === "edit"
      ? "Modifier le livreur"
      : "Détails du livreur";

  return (
    <Dialog open={open} onOpenChange={() => !submitting && onClose()}>
      <DialogContent
        className="max-w-md w-full mx-auto"
        style={{ maxHeight: "90vh" }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-6 h-6 text-green-600" /> {dialogTitle}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Remplis tous les champs pour ajouter un livreur."
              : mode === "edit"
              ? "Modifie les informations puis sauvegarde."
              : "Voici les informations du livreur."}
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
          <div>
            <label className="flex items-center gap-1 text-sm font-semibold mb-1">
              <MapPin className="w-4 h-4" />
              Zones de livraison
            </label>
            <div className="flex flex-wrap gap-2">
              {zonesDispo.length === 0 ? (
                <span className="text-gray-400 text-xs">Aucune zone</span>
              ) : (
                zonesDispo.map((zone) => (
                  <label
                    key={zone}
                    className={`flex items-center space-x-1 rounded px-2 py-1 border border-gray-200 text-sm cursor-pointer
                      ${
                        form.zones.includes(zone)
                          ? "bg-green-200 font-bold border-green-400"
                          : "bg-gray-50"
                      }
                    `}>
                    <input
                      type="checkbox"
                      value={zone}
                      checked={form.zones.includes(zone)}
                      disabled={submitting || isReadOnly}
                      onChange={() => handleZoneToggle(zone)}
                      className="accent-green-600"
                    />
                    <span>{zone}</span>
                  </label>
                ))
              )}
            </div>
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
