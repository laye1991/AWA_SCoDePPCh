import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { FileBadge, Calendar, Clock } from 'lucide-react';

export default function MyRequests() {
  const { user } = useAuth();

  useEffect(() => {
    document.title = 'Mes Demandes | SCoDePP_Ch';
  }, []);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['/api/permit-requests', user?.id],
    queryFn: async () => {
      // Dans une version réelle, on ferait un appel API ici
      return [];
    },
    enabled: !!user,
  });

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Mes Demandes de Permis</h1>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/mypermits">
            Nouvelle demande
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Aucune demande en cours</CardTitle>
            <CardDescription>
              Vous n'avez aucune demande de permis en cours.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Pour demander un nouveau permis de chasse, cliquez sur le bouton "Nouvelle demande".
            </p>
            <Button variant="outline" asChild>
              <Link href="/mypermits">
                Demander un permis
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Le contenu des demandes irait ici */}
        </div>
      )}
    </div>
  );
}
