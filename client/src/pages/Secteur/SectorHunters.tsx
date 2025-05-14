import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Printer, 
  Search, 
  Eye,
  MailIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHunters, useHuntersByZone } from "@/lib/hooks/useHunters";
import HunterDetails from "@/components/hunters/HunterDetails";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

// Type pour les chasseurs (simplifié pour l'exemple)
interface Hunter {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  idNumber: string;
  address: string;
  region?: string;
  zone?: string;
  category: string;
  profession: string;
  experience: number;
}

export default function SectorHunters() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("zone");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedHunterId, setSelectedHunterId] = useState<number | null>(null);
  const [location, navigate] = useLocation();
  
  // Vérifier si un onglet spécifique est demandé via l'URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.split("?")[1]);
    const tab = searchParams.get("tab");
    if (tab === "all") {
      setActiveTab("all");
    }
  }, [location]);
  
  // Récupérer les chasseurs en fonction du rôle
  const { hunters: allHunters, isLoading: isLoadingAll, error: errorAll } = useHunters();
  const { hunters: zoneHunters, isLoading: isLoadingZone, error: errorZone } = 
    useHuntersByZone(user?.zone || null);
    
  // Déterminer quels chasseurs afficher en fonction de l'onglet actif
  const hunters = activeTab === "all" ? allHunters : zoneHunters;
  const isLoading = activeTab === "all" ? isLoadingAll : isLoadingZone;
  const error = activeTab === "all" ? errorAll : errorZone;

  // Filtrer les chasseurs par terme de recherche
  const filteredHunters = hunters ? hunters.filter((hunter: Hunter) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      hunter.firstName?.toLowerCase().includes(searchLower) ||
      hunter.lastName?.toLowerCase().includes(searchLower) ||
      hunter.idNumber?.toLowerCase().includes(searchLower) ||
      hunter.phone?.includes(searchTerm)
    );
  }) : [];

  // Fonction pour envoyer un SMS à un chasseur
  const sendSmsToHunter = (hunterId: number) => {
    // Stocker l'id du chasseur dans le localStorage pour le récupérer dans la page SMS
    localStorage.setItem('smsRecipientId', hunterId.toString());
    navigate("/sms");
  };

  // Fonction pour exporter la liste des chasseurs
  const exportHuntersList = () => {
    toast({
      title: "Export en cours",
      description: "La liste des chasseurs est en cours d'exportation au format PDF.",
    });
    
    // Logique d'export à implémenter
    setTimeout(() => {
      toast({
        title: "Export terminé",
        description: "La liste des chasseurs a été exportée avec succès.",
      });
    }, 1500);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Chasseurs</h1>
          <p className="text-muted-foreground">
            {activeTab === "zone" 
              ? "Consultez et gérez les chasseurs dans votre secteur" 
              : "Consultez la liste nationale des chasseurs"}
          </p>
        </div>
      </div>

      <Tabs defaultValue="zone" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger 
            value="zone" 
            onClick={() => {
              setActiveTab("zone");
              // Lien vers la même page pour rester sur l'onglet "Chasseurs du Secteur"
              navigate("/sector-hunters");
            }}
          >
            Chasseurs du Secteur
          </TabsTrigger>
          <TabsTrigger 
            value="all" 
            onClick={() => {
              setActiveTab("all");
              // Lien avec la barre latérale "Gestion Chasseurs"
              navigate("/sector-hunters?tab=all");
            }}
          >
            Liste Nationale
          </TabsTrigger>
        </TabsList>

        <TabsContent value="zone" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <CardTitle>Chasseurs de votre Secteur ({user?.zone || "Non défini"})</CardTitle>
                <div className="flex space-x-2 mt-2 md:mt-0">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un chasseur..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" onClick={exportHuntersList}>
                    <Printer className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingZone ? (
                <div className="flex justify-center items-center h-32">
                  <p>Chargement des chasseurs...</p>
                </div>
              ) : errorZone ? (
                <div className="flex justify-center items-center h-32">
                  <p className="text-destructive">
                    Erreur lors du chargement des chasseurs. Veuillez réessayer.
                  </p>
                </div>
              ) : filteredHunters.length === 0 ? (
                <div className="flex justify-center items-center h-32">
                  <p>Aucun chasseur trouvé dans votre secteur.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">ID</th>
                        <th className="text-left py-2 px-2">Nom</th>
                        <th className="text-left py-2 px-2">Prénom</th>
                        <th className="text-left py-2 px-2">N° d'identification</th>
                        <th className="text-left py-2 px-2">Téléphone</th>
                        <th className="text-left py-2 px-2">Catégorie</th>
                        <th className="text-left py-2 px-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHunters.map((hunter) => (
                        <tr key={hunter.id} className="border-b">
                          <td className="py-2 px-2">{hunter.id}</td>
                          <td className="py-2 px-2">{hunter.lastName}</td>
                          <td className="py-2 px-2">{hunter.firstName}</td>
                          <td className="py-2 px-2">{hunter.idNumber}</td>
                          <td className="py-2 px-2">{hunter.phone}</td>
                          <td className="py-2 px-2">
                            <Badge variant={
                              hunter.category === 'resident' ? 'default' :
                              hunter.category === 'coutumier' ? 'secondary' :
                              hunter.category === 'touristique' ? 'destructive' : 'outline'
                            }>
                              {hunter.category === 'resident' ? 'Résident' :
                               hunter.category === 'coutumier' ? 'Coutumier' :
                               hunter.category === 'touristique' ? 'Touristique' : hunter.category}
                            </Badge>
                          </td>
                          <td className="py-2 px-2">
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setSelectedHunterId(hunter.id)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Voir
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => sendSmsToHunter(hunter.id)}
                              >
                                <MailIcon className="h-4 w-4 mr-1" />
                                SMS
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <CardTitle>Liste Nationale des Chasseurs</CardTitle>
                <div className="flex space-x-2 mt-2 md:mt-0">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un chasseur..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" onClick={exportHuntersList}>
                    <Printer className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingAll ? (
                <div className="flex justify-center items-center h-32">
                  <p>Chargement des chasseurs...</p>
                </div>
              ) : errorAll ? (
                <div className="flex justify-center items-center h-32">
                  <p className="text-destructive">
                    Erreur lors du chargement des chasseurs. Veuillez réessayer.
                  </p>
                </div>
              ) : filteredHunters.length === 0 ? (
                <div className="flex justify-center items-center h-32">
                  <p>Aucun chasseur trouvé.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">ID</th>
                        <th className="text-left py-2 px-2">Nom</th>
                        <th className="text-left py-2 px-2">Prénom</th>
                        <th className="text-left py-2 px-2">N° d'identification</th>
                        <th className="text-left py-2 px-2">Téléphone</th>
                        <th className="text-left py-2 px-2">Région</th>
                        <th className="text-left py-2 px-2">Zone</th>
                        <th className="text-left py-2 px-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHunters.map((hunter) => (
                        <tr key={hunter.id} className="border-b">
                          <td className="py-2 px-2">{hunter.id}</td>
                          <td className="py-2 px-2">{hunter.lastName}</td>
                          <td className="py-2 px-2">{hunter.firstName}</td>
                          <td className="py-2 px-2">{hunter.idNumber}</td>
                          <td className="py-2 px-2">{hunter.phone}</td>
                          <td className="py-2 px-2">{hunter.region || "Non définie"}</td>
                          <td className="py-2 px-2">{hunter.zone || "Non définie"}</td>
                          <td className="py-2 px-2">
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setSelectedHunterId(hunter.id)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Voir
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedHunterId && (
        <HunterDetails
          hunterId={selectedHunterId}
          open={!!selectedHunterId}
          onClose={() => setSelectedHunterId(null)}
        />
      )}
    </div>
  );
}