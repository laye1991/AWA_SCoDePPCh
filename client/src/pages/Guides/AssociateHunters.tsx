import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Search, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";

// Types pour les données
interface Hunter {
  id: number;
  lastName: string;
  firstName: string;
  phone: string;
  idNumber: string;
  region: string | null;
  zone: string | null;
}

interface GuideHunter {
  id: number;
  guideId: number;
  hunterId: number;
  associatedAt: string;
  hunter?: Hunter;
}

export default function AssociateHuntersPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedHunters, setSelectedHunters] = useState<number[]>([]);

  // Vérifier si l'utilisateur est un guide de chasse
  const isHuntingGuide = user?.role === "hunting-guide";

  // Récupérer les informations du guide connecté
  const { data: guideInfo, isLoading: isLoadingGuide } = useQuery({
    queryKey: ["/api/guides/me"],
    queryFn: () => apiRequest({ url: "/api/guides/me", method: "GET" }),
    enabled: !!user && isHuntingGuide,
  });

  // Récupérer les chasseurs déjà associés au guide
  const { data: associatedHunters, isLoading: isLoadingAssociations } = useQuery({
    queryKey: ["/api/guides/hunters"],
    queryFn: () => apiRequest({ url: "/api/guides/hunters", method: "GET" }),
    enabled: !!guideInfo && !!guideInfo.id,
  });

  // Récupérer tous les chasseurs pour la recherche
  const { data: allHunters, isLoading: isLoadingHunters } = useQuery({
    queryKey: ["/api/hunters/all"],
    queryFn: () => apiRequest({ url: "/api/hunters/all", method: "GET" }),
    enabled: !!dialogOpen, // Récupérer les chasseurs seulement quand la boîte de dialogue est ouverte
  });

  // Mutation pour associer de nouveaux chasseurs
  const associateHuntersMutation = useMutation({
    mutationFn: (hunterIds: number[]) => 
      apiRequest({
        url: "/api/guides/associate-hunters",
        method: "POST",
        data: { hunterIds },
      }),
    onSuccess: () => {
      toast({
        title: "Chasseurs associés avec succès",
        description: "Les chasseurs sélectionnés ont été associés à votre compte.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/guides/hunters"] });
      setDialogOpen(false);
      setSelectedHunters([]);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'association des chasseurs.",
        variant: "destructive",
      });
      console.error("Erreur lors de l'association des chasseurs:", error);
    },
  });

  // Mutation pour dissocier un chasseur
  const removeHunterAssociationMutation = useMutation({
    mutationFn: (hunterId: number) => 
      apiRequest({
        url: `/api/guides/remove-hunter/${hunterId}`,
        method: "DELETE",
      }),
    onSuccess: () => {
      toast({
        title: "Chasseur dissocié",
        description: "Le chasseur a été retiré de votre liste.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/guides/hunters"] });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du retrait du chasseur.",
        variant: "destructive",
      });
      console.error("Erreur lors du retrait du chasseur:", error);
    },
  });

  // Gestionnaire pour l'association de nouveaux chasseurs
  const handleAssociateHunters = () => {
    if (selectedHunters.length === 0) {
      toast({
        title: "Aucun chasseur sélectionné",
        description: "Veuillez sélectionner au moins un chasseur à associer.",
        variant: "destructive",
      });
      return;
    }

    associateHuntersMutation.mutate(selectedHunters);
  };

  // Gestionnaire pour la dissociation d'un chasseur
  const handleRemoveHunter = (hunterId: number) => {
    if (confirm("Êtes-vous sûr de vouloir retirer ce chasseur de votre liste ?")) {
      removeHunterAssociationMutation.mutate(hunterId);
    }
  };

  // Filtrer les chasseurs selon le terme de recherche
  const filteredHunters = allHunters
    ? allHunters.filter(
        (hunter: Hunter) =>
          hunter.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          hunter.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          hunter.idNumber.includes(searchTerm) ||
          hunter.phone.includes(searchTerm)
      )
    : [];

  // Vérifier si un chasseur est déjà associé
  const isHunterAssociated = (hunterId: number) => {
    return associatedHunters ? associatedHunters.some((assoc: GuideHunter) => assoc.hunterId === hunterId) : false;
  };

  if (!isHuntingGuide) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Accès non autorisé</CardTitle>
            <CardDescription>
              Cette page est réservée aux guides de chasse.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Vous devez être connecté en tant que guide de chasse pour accéder à cette fonctionnalité.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingGuide || isLoadingAssociations) {
    return (
      <div className="container mx-auto py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Chasseurs Associés</CardTitle>
          <CardDescription>
            En tant que guide de chasse, vous pouvez associer des chasseurs à votre compte pour faciliter le suivi de leurs activités.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {associatedHunters && associatedHunters.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Prénom</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>N° Pièce d'identité</TableHead>
                  <TableHead>Région/Zone</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {associatedHunters.map((assoc: GuideHunter) => (
                  <TableRow key={assoc.id}>
                    <TableCell className="font-medium">{assoc.hunter?.lastName}</TableCell>
                    <TableCell>{assoc.hunter?.firstName}</TableCell>
                    <TableCell>{assoc.hunter?.phone}</TableCell>
                    <TableCell>{assoc.hunter?.idNumber}</TableCell>
                    <TableCell>
                      {assoc.hunter?.region && (
                        <Badge variant="outline" className="mr-1">
                          {assoc.hunter.region}
                        </Badge>
                      )}
                      {assoc.hunter?.zone && (
                        <Badge variant="outline">{assoc.hunter.zone}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveHunter(assoc.hunterId)}
                        disabled={removeHunterAssociationMutation.isPending}
                      >
                        {removeHunterAssociationMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Retirer"
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                Vous n'avez pas encore de chasseurs associés à votre compte.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={() => setDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Associer des chasseurs
          </Button>
        </CardFooter>
      </Card>

      {/* Dialogue pour rechercher et associer des chasseurs */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Associer des Chasseurs</DialogTitle>
            <DialogDescription>
              Recherchez et sélectionnez les chasseurs que vous souhaitez associer à votre compte.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, prénom, téléphone ou N° d'identité..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoadingHunters ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredHunters.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Prénom</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>N° Pièce d'identité</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHunters.map((hunter: Hunter) => {
                    const isAssociated = isHunterAssociated(hunter.id);
                    
                    return (
                      <TableRow key={hunter.id}>
                        <TableCell>
                          <Checkbox
                            checked={isAssociated || selectedHunters.includes(hunter.id)}
                            onCheckedChange={(checked) => {
                              if (isAssociated) return; // Si déjà associé, ne rien faire
                              
                              if (checked) {
                                setSelectedHunters([...selectedHunters, hunter.id]);
                              } else {
                                setSelectedHunters(selectedHunters.filter(id => id !== hunter.id));
                              }
                            }}
                            disabled={isAssociated}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{hunter.lastName}</TableCell>
                        <TableCell>{hunter.firstName}</TableCell>
                        <TableCell>{hunter.phone}</TableCell>
                        <TableCell>{hunter.idNumber}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">
                  Aucun chasseur trouvé. Essayez un autre terme de recherche.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleAssociateHunters}
              disabled={associateHuntersMutation.isPending || selectedHunters.length === 0}
            >
              {associateHuntersMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Association en cours...
                </>
              ) : (
                <>Associer {selectedHunters.length} chasseur(s)</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}