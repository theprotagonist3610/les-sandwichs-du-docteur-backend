/**
 * Step2SelectElement.jsx
 * Étape 2: Sélection de l'élément de stock
 */

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useOperationStockStore, selectSelectedElement, selectOperationType } from "@/stores/operationStockStore";
import { useStockElements, STOCK_TYPES, TRANSACTION_TYPES } from "@/toolkits/admin/stockToolkit";
import { cn } from "@/lib/utils";

const typeLabels = {
  [STOCK_TYPES.INGREDIENT]: "Ingrédient",
  [STOCK_TYPES.CONSOMMABLE]: "Consommable",
  [STOCK_TYPES.PERISSABLE]: "Périssable",
  [STOCK_TYPES.MATERIEL]: "Matériel",
  [STOCK_TYPES.EMBALLAGE]: "Emballage",
};

const Step2SelectElement = () => {
  const selectedElement = useOperationStockStore(selectSelectedElement);
  const operationType = useOperationStockStore(selectOperationType);
  const setSelectedElement = useOperationStockStore((state) => state.setSelectedElement);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Récupérer tous les éléments de stock
  const { elements, loading, error } = useStockElements({ status: true });

  // Filtrer les éléments
  const filteredElements = useMemo(() => {
    let filtered = elements;

    // Pour les sorties et transferts, montrer uniquement les articles avec stock > 0
    if (operationType === TRANSACTION_TYPES.SORTIE || operationType === TRANSACTION_TYPES.TRANSFERT) {
      filtered = filtered.filter((el) => (el.quantite_actuelle || 0) > 0);
    }

    // Filtre par type
    if (typeFilter !== "all") {
      filtered = filtered.filter((el) => el.type === typeFilter);
    }

    // Filtre par recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (el) =>
          el.denomination.toLowerCase().includes(searchLower) ||
          el.id.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [elements, typeFilter, searchTerm, operationType]);

  const handleSelectElement = (element) => {
    setSelectedElement(element);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Package className="h-12 w-12 animate-pulse mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Chargement des éléments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Erreur lors du chargement des éléments: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Sélection de l'article</h2>
        <p className="text-muted-foreground">
          Choisissez l'article concerné par l'opération
        </p>
      </div>

      {/* Filtres */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Type d'article" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {Object.entries(typeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Info pour sortie/transfert */}
      {(operationType === TRANSACTION_TYPES.SORTIE || operationType === TRANSACTION_TYPES.TRANSFERT) && (
        <Alert>
          <AlertDescription>
            Seuls les articles avec stock disponible sont affichés
          </AlertDescription>
        </Alert>
      )}

      {/* Liste des éléments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2">
        {filteredElements.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Aucun article trouvé</p>
          </div>
        ) : (
          filteredElements.map((element) => {
            const isSelected = selectedElement?.id === element.id;
            const quantite = element.quantite_actuelle || 0;
            const seuil = element.seuil_alerte || 0;
            const isEnAlerte = seuil > 0 && quantite <= seuil && quantite > 0;
            const isEnRupture = quantite === 0;

            return (
              <Card
                key={element.id}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-md",
                  isSelected
                    ? "ring-2 ring-primary ring-offset-2"
                    : "hover:border-primary"
                )}
                onClick={() => handleSelectElement(element)}
              >
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {/* Image */}
                    <div className="relative w-full h-24 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                      {element.imgURL ? (
                        <img
                          src={element.imgURL}
                          alt={element.denomination}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <Package className="h-10 w-10 text-muted-foreground" />
                      )}
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle2 className="h-6 w-6 text-green-600 fill-white" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div>
                      <h3 className="font-semibold text-sm line-clamp-2">
                        {element.denomination}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {typeLabels[element.type]}
                      </p>
                    </div>

                    {/* Stock */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-semibold">{quantite}</span>{" "}
                        <span className="text-muted-foreground">
                          {element.unite?.symbol || "unités"}
                        </span>
                      </div>

                      {isEnRupture ? (
                        <Badge variant="destructive" className="text-xs">
                          <XCircle className="h-3 w-3 mr-1" />
                          Rupture
                        </Badge>
                      ) : isEnAlerte ? (
                        <Badge variant="warning" className="text-xs bg-orange-100 text-orange-800">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Alerte
                        </Badge>
                      ) : (
                        <Badge variant="success" className="text-xs bg-green-100 text-green-800">
                          OK
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {selectedElement && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-900">
                {selectedElement.denomination}
              </p>
              <p className="text-xs text-blue-700">
                Stock actuel: {selectedElement.quantite_actuelle || 0}{" "}
                {selectedElement.unite?.symbol}
              </p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Step2SelectElement;
