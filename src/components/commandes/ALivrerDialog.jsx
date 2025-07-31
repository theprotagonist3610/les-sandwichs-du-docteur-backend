import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from "@/components/ui/form";
import { useCommande } from "@/context/CommandContext";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
  CommandEmpty,
} from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";

const ALivrerDialog = ({ open, onClose, onValider }) => {
  const { adresses } = useCommande();
  const [alertOpen, setAlertOpen] = useState(false);
  const [pendingInfos, setPendingInfos] = useState(null);

  const form = useForm({
    defaultValues: {
      nom: "",
      numero: "",
      sexe: "H",
      typeCommande: "P",
      adresse: "",
      indication: "",
      numeroLivraison: "",
      dateLivraison: new Date(),
      heureLivraison: "",
    },
  });

  const watchFields = form.watch();

  const handleSubmitForm = (data) => {
    if (!data.adresse || !data.numeroLivraison || !data.heureLivraison) {
      setPendingInfos(data);
      setAlertOpen(true);
      return;
    }
    onValider(data);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm w-[95vw]">
        <DialogHeader>
          <DialogTitle>Commande à livrer</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-2">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmitForm)}
              className="space-y-3 py-2">
              <FormField
                control={form.control}
                name="nom"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Nom du client (optionnel)"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numero"
                render={({ field }) => (
                  <FormItem>
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

              {/* Sexe */}
              <div>
                <FormLabel>Sexe</FormLabel>
                <div className="flex gap-2 mt-1">
                  {[
                    { label: "Homme", value: "H" },
                    { label: "Femme", value: "F" },
                  ].map((opt) => (
                    <Button
                      type="button"
                      key={opt.value}
                      variant={
                        watchFields.sexe === opt.value ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => form.setValue("sexe", opt.value)}>
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Type commande */}
              <div>
                <FormLabel>Type de commande</FormLabel>
                <div className="flex gap-2 flex-wrap mt-1">
                  {[
                    { v: "P", l: "Personnel" },
                    { v: "C", l: "Cadeau" },
                    { v: "G", l: "Bonus entreprise" },
                  ].map((opt) => (
                    <Button
                      type="button"
                      key={opt.v}
                      variant={
                        watchFields.typeCommande === opt.v
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => form.setValue("typeCommande", opt.v)}>
                      {opt.l}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Adresse */}
              <FormField
                control={form.control}
                name="adresse"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start">
                            {field.value
                              ? adresses.find((a) => a.id === field.value)
                                  ?.departement +
                                " - " +
                                adresses.find((a) => a.id === field.value)
                                  ?.ville +
                                " - " +
                                adresses.find((a) => a.id === field.value)
                                  ?.quartier
                              : "Choisir une adresse"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Rechercher..." />
                            <CommandList>
                              <CommandEmpty>
                                Aucune adresse trouvée.
                              </CommandEmpty>
                              {adresses.map((a, i) => (
                                <CommandItem
                                  key={i}
                                  onSelect={() =>
                                    form.setValue("adresse", a.id)
                                  }>
                                  {`${a.departement} - ${a.ville} - ${a.quartier}`}
                                </CommandItem>
                              ))}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="indication"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Indication d'adresse (optionnel)"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateLivraison"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de livraison</FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start">
                            {field.value?.toLocaleDateString("fr-FR") ||
                              "Choisir une date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) =>
                              form.setValue("dateLivraison", date)
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="heureLivraison"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* PaiementSelector */}
              <div>
                <FormLabel>Moyen de paiement</FormLabel>
                <div className="text-sm italic text-gray-400 mt-1">
                  (Sélecteur de paiement à insérer ici)
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" className="w-full">
                  Valider la commande
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>

        {/* Alerte champs requis */}
        <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Champs requis manquants</AlertDialogTitle>
              <AlertDialogDescription>
                Merci de remplir l'adresse, l'heure et le numéro de livraison
                pour finaliser la commande.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Retour</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (pendingInfos) {
                    onValider(pendingInfos);
                    setPendingInfos(null);
                    setAlertOpen(false);
                    onClose();
                  }
                }}>
                Valider quand même
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};

export default ALivrerDialog;
