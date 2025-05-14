import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ChevronDownIcon, Trash2, RefreshCw, UserCog, Check, AlertTriangle, Edit, UserPlus, Search, Filter, Printer, FileText, Download, FileDown, MapPin, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { regionEnum } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import AddAgentForm from "@/components/agents/AddAgentForm";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import AgentForm from "@/components/agents/AgentForm";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";

// Types
interface Agent {
  id: number;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  matricule: string | null;
  serviceLocation: string | null;
  assignmentPost: string | null;
  region: string | null;
  role: 'agent';
  isSuspended?: boolean;
  isActive?: boolean;
}

export default function AgentsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filterRegion, setFilterRegion] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Récupérer tous les agents
  const { data: agents = [], isLoading } = useQuery<Agent[]>({
    queryKey: ["/api/users/agents"],
    queryFn: () => apiRequest({
      url: "/api/users/agents",
      method: "GET"
    }),
    refetchOnWindowFocus: false,
  });

  // Filtrer les agents en fonction de la région et de la recherche
  const filteredAgents = agents.filter(agent => {
    const matchesRegion = filterRegion === "all" || agent.region === filterRegion;
    const matchesSearch = 
      searchQuery === "" || 
      agent.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.matricule?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesRegion && matchesSearch;
  });

  // Obtenir la liste des régions uniques parmi les agents
  const uniqueRegionsSet = new Set();
  agents.forEach(agent => {
    if (agent.region) {
      uniqueRegionsSet.add(agent.region);
    }
  });
  const uniqueRegions = Array.from(uniqueRegionsSet) as string[];

  // Mutation pour supprimer définitivement un agent
  const deleteAgentMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest({
        url: `/api/users/${id}`,
        method: "DELETE"
      }),
    onSuccess: () => {
      toast({
        title: "Agent supprimé",
        description: "Le compte de l'agent a été supprimé définitivement.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/agents"] });
      setShowDetails(false);
      setIsDeleteDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression du compte.",
        variant: "destructive",
      });
      setIsDeleteDialogOpen(false);
    }
  });

  // Mutation pour activer/désactiver un agent
  const toggleAgentStatusMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => 
      apiRequest({
        url: `/api/users/${id}/${active ? 'activate' : 'deactivate'}`,
        method: "PATCH"
      }),
    onSuccess: () => {
      toast({
        title: "Statut mis à jour",
        description: "Le statut de l'agent a été mis à jour avec succès.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/agents"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du statut.",
        variant: "destructive",
      });
    }
  });

  const getAgentRegionName = (regionCode: string) => {
    const region = regionEnum.find((r: { value: string; label: string }) => r.value === regionCode);
    return region ? region.label : regionCode;
  };

  const viewAgentDetails = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowDetails(true);
  };

  const refreshAgents = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/users/agents"] });
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestion des Agents</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chefs de Division Gestion de la Faune</CardTitle>
          <CardDescription>
            Gestion des différents profils d'utilisateurs du système
          </CardDescription>

          <Tabs defaultValue="agents" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="agents">Agents Régionaux ({filteredAgents.length})</TabsTrigger>
              <TabsTrigger value="subagents">Agents Secteur (0)</TabsTrigger>
            </TabsList>

            <TabsContent value="agents" className="space-y-4 pt-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-1/3">
                  <Input
                    placeholder="Rechercher par nom, email, matricule..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="w-full sm:w-1/3">
                  <Select value={filterRegion} onValueChange={setFilterRegion}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrer par région" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les régions</SelectItem>
                      <SelectItem value="dakar">DAKAR</SelectItem>
                      <SelectItem value="thies">THIÈS</SelectItem>
                      <SelectItem value="saint-louis">SAINT-LOUIS</SelectItem>
                      <SelectItem value="kolda">KOLDA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-1/3 flex justify-end space-x-2">
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Imprimer
                  </Button>
                  <Button variant="outline">
                    <FileDown className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                </div>
              </div>
              
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">ID</TableHead>
                      <TableHead>Nom d'utilisateur</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Prénom</TableHead>
                      <TableHead>Région</TableHead>
                      <TableHead>Matricule</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAgents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center">
                          Aucun agent trouvé
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAgents.map((agent) => (
                        <TableRow key={agent.id}>
                          <TableCell>{agent.id}</TableCell>
                          <TableCell className="font-medium">{agent.username}</TableCell>
                          <TableCell>{agent.lastName || "Non défini"}</TableCell>
                          <TableCell>{agent.firstName || "Non défini"}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <MapPin className="mr-1 h-4 w-4 text-muted-foreground" />
                              {agent.region ? agent.region.toUpperCase() : "NON DÉFINI"}
                            </div>
                          </TableCell>
                          <TableCell>{agent.matricule || "Non défini"}</TableCell>
                          <TableCell>
                            <Badge variant={agent.isSuspended ? "destructive" : "default"}>
                              {agent.isSuspended ? "Inactif" : "Actif"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => viewAgentDetails(agent)}
                              title="Voir les détails"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="subagents" className="space-y-4 pt-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-1/3">
                  <Input
                    placeholder="Rechercher un agent de secteur..."
                  />
                </div>
                <div className="w-full sm:w-1/3">
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrer par secteur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les secteurs</SelectItem>
                      <SelectItem value="inspection">INSPECTION</SelectItem>
                      <SelectItem value="inspection-dakar">INSPECTION DE DAKAR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-1/3 flex justify-end space-x-2">
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Imprimer
                  </Button>
                  <Button variant="outline">
                    <FileDown className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                </div>
              </div>
              
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">ID</TableHead>
                      <TableHead>Nom d'utilisateur</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Prénom</TableHead>
                      <TableHead>Secteur</TableHead>
                      <TableHead>Matricule</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">
                        Aucun agent de secteur trouvé
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>

      {/* Modal pour afficher les détails de l'agent */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Détails de l'agent</DialogTitle>
            <DialogDescription>
              Informations complètes et gestion de l'agent
            </DialogDescription>
          </DialogHeader>
          
          {selectedAgent && (
            <Tabs defaultValue="info">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Informations</TabsTrigger>
                <TabsTrigger value="activity">Activité</TabsTrigger>
                <TabsTrigger value="settings">Gestion</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Nom d'utilisateur</h3>
                    <p className="mt-1">{selectedAgent.username}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <p className="mt-1">{selectedAgent.email}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Nom</h3>
                    <p className="mt-1">{selectedAgent.lastName || "Non défini"}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Prénom</h3>
                    <p className="mt-1">{selectedAgent.firstName || "Non défini"}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Téléphone</h3>
                    <p className="mt-1">{selectedAgent.phone || "Non défini"}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Matricule</h3>
                    <p className="mt-1">{selectedAgent.matricule || "Non défini"}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Région</h3>
                    <p className="mt-1">{selectedAgent.region ? selectedAgent.region.toUpperCase() : "NON DÉFINI"}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Lieu de service</h3>
                    <p className="mt-1">{selectedAgent.serviceLocation || "Non défini"}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Poste d'affectation</h3>
                    <p className="mt-1">{selectedAgent.assignmentPost || "Non défini"}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Statut</h3>
                    <p className="mt-1">
                      <Badge variant={selectedAgent.isActive ? "default" : "destructive"}>
                        {selectedAgent.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="activity">
                <div className="space-y-4">
                  <div className="rounded-md bg-muted p-4">
                    <div className="flex items-center">
                      <UserCog className="h-6 w-6 mr-2 text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">Statistiques d'activité</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Cette fonctionnalité sera disponible prochainement
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="settings">
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-md bg-muted p-4">
                    <div className="flex items-center">
                      {selectedAgent.isActive ? (
                        <AlertTriangle className="h-6 w-6 mr-2 text-amber-500" />
                      ) : (
                        <Check className="h-6 w-6 mr-2 text-green-500" />
                      )}
                      <div>
                        <h3 className="font-medium">
                          {selectedAgent.isActive ? "Désactiver" : "Activer"} l'agent
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedAgent.isActive 
                            ? "L'agent ne pourra plus se connecter à la plateforme" 
                            : "L'agent pourra à nouveau se connecter à la plateforme"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={selectedAgent.isActive ? "destructive" : "outline"}
                      onClick={() => toggleAgentStatusMutation.mutate({
                        id: selectedAgent.id,
                        active: !selectedAgent.isActive
                      })}
                      disabled={toggleAgentStatusMutation.isPending}
                    >
                      {toggleAgentStatusMutation.isPending 
                        ? "En cours..." 
                        : selectedAgent.isActive ? "Désactiver" : "Activer"}
                    </Button>
                  </div>
                  
                  <div className="rounded-md bg-muted p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Modifier le profil</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Modifier les informations de l'agent
                        </p>
                      </div>
                      <Button variant="outline">
                        Modifier
                      </Button>
                    </div>
                  </div>
                  
                  <div className="rounded-md bg-muted p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Réinitialiser le mot de passe</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Génère un nouveau mot de passe temporaire
                        </p>
                      </div>
                      <Button variant="outline">
                        Réinitialiser
                      </Button>
                    </div>
                  </div>
                  
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-red-600">Supprimer définitivement</h3>
                        <p className="text-sm text-red-500 mt-1">
                          Cette action est irréversible et supprimera toutes les données de l'agent
                        </p>
                      </div>
                      <Button 
                        variant="destructive"
                        onClick={() => setIsDeleteDialogOpen(true)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Boîte de dialogue de confirmation pour la suppression définitive */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer définitivement l'agent</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer définitivement le compte de {selectedAgent?.firstName} {selectedAgent?.lastName} ({selectedAgent?.username}) ? Cette action est irréversible et supprimera toutes les données associées à cet agent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => selectedAgent && deleteAgentMutation.mutate(selectedAgent.id)}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteAgentMutation.isPending}
            >
              {deleteAgentMutation.isPending ? "Suppression en cours..." : "Supprimer définitivement"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}