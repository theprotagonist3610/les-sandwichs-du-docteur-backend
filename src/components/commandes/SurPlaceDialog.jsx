import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Phone, Venus, Tag, Smartphone } from "lucide-react";
import PaiementSelector from "./PaiementSelector";
const SurPlaceDialog = ({ open, onClose, onValider }) => {
  const form = useForm({
    defaultValues: {
      nom: "",
      numero: "",
      sexe: "H",
      typeCommande: "P",
      type_appel: "direct",
    },
  });

  const sexe = form.watch("sexe");
  const typeCommande = form.watch("typeCommande");
  const numero = form.watch("numero");
  const typeAppel = form.watch("type_appel");

  const onSubmit = (data) => {
    onValider(data);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[95vw] max-h-[90vh] p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>Commande sur place</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] px-4 pt-2">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 pb-4">
              {/* Nom */}
              <FormField
                control={form.control}
                name="nom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <User className="inline w-4 h-4 mr-1" />
                      Nom du client
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nom du client (optionnel)"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Numéro */}
              <FormField
                control={form.control}
                name="numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Phone className="inline w-4 h-4 mr-1" />
                      Numéro du client
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Numéro du client (optionnel)"
                        type="tel"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Type d'appel si numéro */}
              {numero && (
                <div>
                  <FormLabel>
                    <Smartphone className="inline w-4 h-4 mr-1" />
                    Type d'appel
                  </FormLabel>
                  <div className="flex gap-2 mt-1">
                    {["direct", "whatsapp"].map((mode) => (
                      <Button
                        key={mode}
                        type="button"
                        size="sm"
                        variant={typeAppel === mode ? "default" : "outline"}
                        onClick={() => form.setValue("type_appel", mode)}>
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sexe */}
              <div>
                <FormLabel>
                  <Venus className="inline w-4 h-4 mr-1" />
                  Sexe
                </FormLabel>
                <div className="flex gap-2 mt-1">
                  {["H", "F"].map((value) => (
                    <Button
                      key={value}
                      type="button"
                      size="sm"
                      variant={sexe === value ? "default" : "outline"}
                      onClick={() => form.setValue("sexe", value)}>
                      {value === "H" ? "Homme" : "Femme"}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Type de commande */}
              <div>
                <FormLabel>
                  <Tag className="inline w-4 h-4 mr-1" />
                  Type de commande
                </FormLabel>
                <div className="flex gap-2 flex-wrap mt-1">
                  {[
                    { v: "P", l: "Personnel" },
                    { v: "C", l: "Cadeau" },
                    { v: "G", l: "Bonus entreprise" },
                  ].map((opt) => (
                    <Button
                      key={opt.v}
                      type="button"
                      size="sm"
                      variant={typeCommande === opt.v ? "default" : "outline"}
                      onClick={() => form.setValue("typeCommande", opt.v)}>
                      {opt.l}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Paiement à insérer */}
              <div>
                <FormLabel>Moyen de paiement</FormLabel>
                <PaiementSelector />
              </div>

              <DialogFooter>
                <Button type="submit" className="w-full mt-2">
                  Valider la commande
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default SurPlaceDialog;
