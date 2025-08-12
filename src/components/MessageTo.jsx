import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Send,
  ListChecks,
  CheckCircle2,
  Gift,
  PartyPopper,
  Soup,
  ChevronRight,
  MessageSquareText,
} from "lucide-react";

/**
 * MessageTo
 * A flexible WhatsApp message launcher for Client/Livreur presets.
 *
 * Props:
 * - mode: 'client' | 'livreur' (default 'client')
 * - numero: string (recipient phone; any format, will be normalized)
 * - commande: object { paiement:{ total:number, ussd_code?:string }, details_commande:[{prix,quantite,nom?,type?}] }
 * - brand: string (default "🥪 Les Sandwichs du docteur 🥪")
 * - defaultCountryCode: string (default '229')
 * - promotionText?: string (optional override for Promotion card)
 * - cadeauText?: string (optional override for Cadeau card)
 */

const BRAND_DEFAULT = `🥪 Les Sandwichs du docteur 🥪`;
const NBSP = `\u00A0`; // espace insécable
const NNBSP = `\u202F`; // espace fine insécable

const formatCFA = (n) => {
  if (!Number.isFinite(n)) return `0 F CFA`;
  const parts = Math.round(n).toString().split("");
  for (let i = parts.length - 3; i > 0; i -= 3) parts.splice(i, 0, NNBSP);
  return `${parts.join("")}${NBSP}F${NBSP}CFA`;
};

const normalizePhoneForWaMe = (raw, defaultCountryCode = "229") => {
  if (!raw) return "";
  let digits = String(raw).replace(/\D+/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = defaultCountryCode + digits.slice(1);
  if (!digits.startsWith(defaultCountryCode) && digits.length <= 10)
    digits = defaultCountryCode + digits;
  return digits;
};

const lineItems = (details) => {
  if (!Array.isArray(details) || details.length === 0)
    return `• (aucun article)`;
  return details
    .map((d) => {
      const libelle =
        d?.nom?.trim?.() ||
        (d?.type ? String(d.type).toUpperCase() : `Article`);
      const totalLigne = (d?.prix || 0) * (d?.quantite || 0);
      return `• ${d?.quantite ?? 0} × ${libelle} — ${formatCFA(totalLigne)}`;
    })
    .join("\n");
};

const buildMessages = ({ kind, brand, commande }) => {
  const BRAND = brand || BRAND_DEFAULT;
  const ussd = commande?.paiement?.ussd_code?.trim?.() || `************`;
  const total = formatCFA(commande?.paiement?.total || 0);
  const items = lineItems(commande?.details_commande || []);

  const base = {
    reception: `${BRAND}\nNous avons reçu votre commande. Patientez quelques secondes pour le traitement de votre commande.`,
    confirmation: `${BRAND}\nVotre commande a été confirmée. Merci pour votre confiance.`,
    commande_traitee: `${BRAND}\nVotre commande a été traitée. Détails de la commande\n${items}\n*Total : ${total}*\nVeuillez procéder au paiement en tapant ce code USSD : ${ussd} et envoyez-nous la capture d'écran du paiement. Merci`,
    bon_appetit: `${BRAND}\nNous vous souhaitons un bon appétit et espérons recevoir de vos nouvelles bientôt.`,
    promotion: `${BRAND}\n🎉 *Promotion du jour* 🎉\n2 menus achetés = 1 boisson offerte ! Offre valable aujourd'hui uniquement. Répondez à ce message pour commander.`,
    cadeau: `${BRAND}\n🎁 *Cadeau fidélité* 🎁\nMerci pour votre fidélité ! Sur votre prochaine commande, profitez d'une *réduction de 10%*. Dites simplement « Cadeau » à ce message.`,
  };

  const livreur = {
    liste_commande: `${BRAND}\n🧾 *Liste commande*\n${items}\n*Total : ${total}*`,
    commande_appretee: `${BRAND}\n✅ *Commande apprêtée*\nPrête pour départ. USSD client: ${ussd}`,
  };

  return kind in base ? base[kind] : livreur[kind] || `${BRAND}`;
};

const buildWhatsAppUrl = ({ numero, text, defaultCountryCode = "229" }) => {
  const normalized = normalizePhoneForWaMe(numero, defaultCountryCode);
  if (!normalized) throw new Error("Numéro WhatsApp invalide ou manquant.");
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
};

const gridVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      when: "beforeChildren",
      staggerChildren: 0.06,
    },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25 } },
  hover: { y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" },
};

const mini = (title, key, Icon, accent = "") => ({ title, key, Icon, accent });

const CLIENT_CARDS = [
  mini(
    "Réception commande",
    "reception",
    MessageSquareText,
    "bg-emerald-50 dark:bg-emerald-900/30"
  ),
  mini(
    "Confirmation commande",
    "confirmation",
    CheckCircle2,
    "bg-blue-50 dark:bg-blue-900/30"
  ),
  mini(
    "Commande traitée",
    "commande_traitee",
    ListChecks,
    "bg-amber-50 dark:bg-amber-900/30"
  ),
  mini("Bon appétit", "bon_appetit", Soup, "bg-rose-50 dark:bg-rose-900/30"),
  mini(
    "Promotion",
    "promotion",
    PartyPopper,
    "bg-purple-50 dark:bg-purple-900/30"
  ),
  mini("Cadeau", "cadeau", Gift, "bg-pink-50 dark:bg-pink-900/30"),
];

const LIVREUR_CARDS = [
  mini(
    "Liste commande",
    "liste_commande",
    ListChecks,
    "bg-slate-50 dark:bg-slate-800/60"
  ),
  mini(
    "Commande apprêtée",
    "commande_appretee",
    CheckCircle2,
    "bg-green-50 dark:bg-green-900/30"
  ),
];

const CardButton = ({ item, onClick }) => (
  <motion.div variants={cardVariants} whileHover="hover">
    <Card className={`rounded-2xl border border-border/60 ${item.accent}`}>
      <button className="w-full text-left" onClick={onClick}>
        <CardHeader className="flex flex-row items-center gap-3 py-4">
          <div className="p-2 rounded-xl bg-background shadow-sm">
            <item.Icon className="h-5 w-5" />
          </div>
          <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
            {item.title}
            <ChevronRight className="h-4 w-4 opacity-50" />
          </CardTitle>
        </CardHeader>
      </button>
    </Card>
  </motion.div>
);

const PreviewDialog = ({
  open,
  onOpenChange,
  title,
  message,
  url,
  onSend,
  allowNumberEdit = false,
  numero,
  setNumero,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="gap-3 sm:max-w-lg rounded-2xl">
      <DialogHeader>
        <DialogTitle className="text-base flex items-center gap-2">
          <Send className="h-4 w-4" /> {title}
        </DialogTitle>
        <DialogDescription className="text-xs">
          Aperçu du message WhatsApp avant envoi.
        </DialogDescription>
      </DialogHeader>

      {allowNumberEdit && (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">
            Numéro destinataire
          </label>
          <Input
            value={numero}
            onChange={(e) => setNumero?.(e.target.value)}
            placeholder="ex: 97 00 00 00"
          />
        </div>
      )}

      <div className="text-sm whitespace-pre-wrap bg-muted/40 p-3 rounded-xl max-h-60 overflow-auto border">
        {message}
      </div>

      <Separator />

      <DialogFooter className="flex items-center justify-between w-full">
        <Badge
          variant="secondary"
          className="font-mono text-[11px] truncate max-w-[60%]">
          {url}
        </Badge>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => navigator.clipboard?.writeText(message)}>
            Copier
          </Button>
          <Button onClick={onSend}>
            <Send className="h-4 w-4 mr-2" /> Envoyer
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const MessageTo = ({
  mode = "client",
  numero = "",
  commande = {},
  brand = BRAND_DEFAULT,
  defaultCountryCode = "229",
  promotionText,
  cadeauText,
}) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null); // key of card
  const [currentNumero, setCurrentNumero] = useState(numero);

  const cards = useMemo(
    () => (mode === "livreur" ? LIVREUR_CARDS : CLIENT_CARDS),
    [mode]
  );

  const messageText = useMemo(() => {
    if (!selected) return "";
    const base = buildMessages({ kind: selected, brand, commande });
    if (selected === "promotion" && promotionText)
      return base.replace(/🎉 \*Promotion du jour\* 🎉[\s\S]*/m, promotionText);
    if (selected === "cadeau" && cadeauText)
      return base.replace(/🎁 \*Cadeau fidélité\* 🎁[\s\S]*/m, cadeauText);
    return base;
  }, [selected, brand, commande, promotionText, cadeauText]);

  const url = useMemo(() => {
    if (!selected) return "";
    try {
      return buildWhatsAppUrl({
        numero: currentNumero || numero,
        text: messageText,
        defaultCountryCode,
      });
    } catch (_e) {
      return "";
    }
  }, [selected, currentNumero, numero, messageText, defaultCountryCode]);

  const gridClass =
    mode === "livreur" ? "grid grid-cols-1 gap-3" : "grid grid-cols-2 gap-3";

  return (
    <div className="w-full">
      <motion.div
        className={gridClass}
        variants={gridVariants}
        initial="hidden"
        animate="visible"
        exit="exit">
        {cards.map((item) => (
          <CardButton
            key={item.key}
            item={item}
            onClick={() => {
              setSelected(item.key);
              setOpen(true);
            }}
          />
        ))}
      </motion.div>

      <AnimatePresence>
        {open && (
          <PreviewDialog
            open={open}
            onOpenChange={setOpen}
            title={
              cards.find((c) => c.key === selected)?.title || "Prévisualisation"
            }
            message={messageText}
            url={url}
            allowNumberEdit={true}
            numero={currentNumero}
            setNumero={setCurrentNumero}
            onSend={() => {
              if (!url) return;
              window.open(url, "_blank", "noopener,noreferrer");
              setOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MessageTo;

// Optional named exports if you want to re-use helpers elsewhere
export { formatCFA, normalizePhoneForWaMe, buildWhatsAppUrl, buildMessages };
