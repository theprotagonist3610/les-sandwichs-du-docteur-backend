/**
 * ComptesSkeleton.jsx
 * Skeleton de chargement pour les comptes comptables
 */

import React from "react";
import { Skeleton } from "../../../../components/ui/skeleton";
import { Card, CardContent, CardHeader } from "../../../../components/ui/card";

const ComptesSkeleton = () => {
  return (
    <div className="space-y-6 p-6">
      {/* Header avec résumé */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-40 mb-2" />
            <Skeleton className="h-4 w-24" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-40 mb-2" />
            <Skeleton className="h-4 w-24" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-40 mb-2" />
            <Skeleton className="h-4 w-24" />
          </CardContent>
        </Card>
      </div>

      {/* Liste des comptes */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-32" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ComptesSkeleton;
