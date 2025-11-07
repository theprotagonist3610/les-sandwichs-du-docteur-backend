import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

/**
 * Composant Skeleton pour l'état de chargement de la page trésorerie
 * Affiche une version squelette de la page pendant le chargement des données
 */
const TresorerieSkeleton = () => {
  return (
    <div className="container mx-auto p-8 space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      <Separator />

      {/* Résumé global Skeleton */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-12 w-48" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions rapides Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 border rounded-lg p-4 flex flex-col items-center justify-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 text-center w-full">
                  <Skeleton className="h-5 w-32 mx-auto" />
                  <Skeleton className="h-3 w-24 mx-auto" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Grille des comptes Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between mb-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-48" />
              </div>
              <Separator />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TresorerieSkeleton;
