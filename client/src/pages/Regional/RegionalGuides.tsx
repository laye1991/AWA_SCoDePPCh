import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { HuntingGuide } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  Eye, 
  Loader2, 
  MapPin, 
  Phone
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function RegionalGuidesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  // Récupération des guides de chasse de la région de l'agent
  const { data: guides = [], isLoading } = useQuery<HuntingGuide[]>({
    queryKey: ["/api/guides"],
    enabled: user?.role === "agent" || user?.role === "sub-agent",
  });

  // Filtrer les guides en fonction du terme de recherche
  const filteredGuides = guides.filter((guide) => {
    const searchValue = searchTerm.toLowerCase();
    return (
      guide.firstName.toLowerCase().includes(searchValue) ||
      guide.lastName.toLowerCase().includes(searchValue) ||
      guide.phone.includes(searchValue) ||
      guide.zone.toLowerCase().includes(searchValue) ||
      guide.idNumber.includes(searchValue)
    );
  });

  // Visualiser les détails d'un guide
  const viewGuideDetails = (guide: HuntingGuide) => {
    toast({
      title: `${guide.firstName} ${guide.lastName}`,
      description: `Téléphone: ${guide.phone} | Zone: ${guide.zone} | ID: ${guide.idNumber}`,
    });
    // Note: Cette fonction peut être améliorée pour afficher un modal avec plus de détails
  };

  // Rendu du tableau de guides
  const renderGuidesTable = (guides: HuntingGuide[]) => {
    return (
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Zone</TableHead>
              <TableHead>N° pièce d'identité</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {guides.map((guide) => (
              <TableRow key={guide.id}>
                <TableCell>
                  <span className="font-medium">{guide.lastName}</span> {guide.firstName}
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-1 text-muted-foreground" />
                    {guide.phone}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                    {guide.zone}
                  </div>
                </TableCell>
                <TableCell>{guide.idNumber}</TableCell>
                <TableCell>
                  <Badge
                    variant={guide.isActive ? "outline" : "destructive"}
                    className={guide.isActive ? "bg-green-50 text-green-700 hover:bg-green-50" : ""}
                  >
                    {guide.isActive ? "Actif" : "Inactif"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => viewGuideDetails(guide)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {guides.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Aucun résultat trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  if (!user || (user.role !== "agent" && user.role !== "sub-agent")) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Accès non autorisé</h2>
        <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Guides de Chasse Régionaux
          </h2>
          {user?.region && (
            <p className="text-muted-foreground">Région: {user.region}</p>
          )}
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex justify-between">
          <TabsList>
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="active">Actifs</TabsTrigger>
            <TabsTrigger value="inactive">Inactifs</TabsTrigger>
          </TabsList>
          
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un guide..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Tous les guides de la région</CardTitle>
              <CardDescription>
                Liste complète des guides de chasse opérant dans votre région
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredGuides.length > 0 ? (
                renderGuidesTable(filteredGuides)
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground">Aucun guide de chasse trouvé dans votre région</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Guides actifs</CardTitle>
              <CardDescription>
                Guides de chasse actuellement actifs dans votre région
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredGuides.filter(g => g.isActive).length > 0 ? (
                renderGuidesTable(filteredGuides.filter(g => g.isActive))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground">Aucun guide de chasse actif trouvé dans votre région</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="inactive" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Guides inactifs</CardTitle>
              <CardDescription>
                Guides de chasse actuellement inactifs dans votre région
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredGuides.filter(g => !g.isActive).length > 0 ? (
                renderGuidesTable(filteredGuides.filter(g => !g.isActive))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground">Aucun guide de chasse inactif trouvé dans votre région</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}