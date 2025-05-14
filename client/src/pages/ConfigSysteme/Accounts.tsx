import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ChevronDownIcon, Trash2, RefreshCw, UserCog, Check, AlertTriangle, Edit, UserPlus, Search, Filter, Printer, FileText, Download } from "lucide-react";
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

// Types
interface User {
  id: number;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'admin' | 'agent' | 'sub-agent' | 'hunter' | 'guide';
  phone: string | null;
  region?: string | null;
  isSuspended?: boolean;
  matricule?: string | null;
  serviceLocation?: string | null;
  assignmentPost?: string | null;
  guideId?: number;  // ID référençant un guide de chasse
}

interface Guide {
  id: number;
  lastName: string;
  firstName: string;
  phone: string;
  zone?: string | null;
  region?: string | null;
  idNumber: string;
  photo?: string | null;
  userId?: number;  // ID référençant l'utilisateur associé
  username?: string; // Nom d'utilisateur associé
}

export default function Accounts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditAgentDialogOpen, setIsEditAgentDialogOpen] = useState(false);
  const [isDeleteAllHuntersDialogOpen, setIsDeleteAllHuntersDialogOpen] = useState(false);
  const [isDeleteAllGuidesDialogOpen, setIsDeleteAllGuidesDialogOpen] = useState(false);
  const [isSuspensionDialogOpen, setIsSuspensionDialogOpen] = useState(false);
  const [suspensionAction, setSuspensionAction] = useState<'suspend' | 'reactivate'>('suspend');
  const [isAddAgentDialogOpen, setIsAddAgentDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState({ admins: 1, agents: 1, subagents: 1, guides: 1, hunters: 1 });
  const itemsPerPage = 5;

  // Requête pour récupérer tous les utilisateurs
  const { data: users = [], isLoading, refetch: refetchUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await apiRequest({ url: "/api/users" });
      return response || [];
    },
    refetchOnWindowFocus: false,
  });

  // Requête pour récupérer tous les guides de chasse avec leurs infos utilisateur
  const { data: guides = [], isLoading: isLoadingGuides, refetch: refetchGuides } = useQuery<Guide[]>({
    queryKey: ["/api/guides/with-users"],
    queryFn: async () => {
      // Récupérer les guides
      const guidesData = await apiRequest({ url: "/api/guides" });
      
      // Récupérer les utilisateurs de type guide
      const guideUsers = users.filter(user => user.role === 'guide');
      
      // Associer les noms d'utilisateur aux guides
      return guidesData.map((guide: Guide) => {
        const matchingUser = guideUsers.find(user => user.guideId === guide.id);
        return {
          ...guide,
          userId: matchingUser?.id,
          username: matchingUser?.username
        };
      });
    },
    enabled: !isLoading, // Attendre que les utilisateurs soient chargés
    refetchOnWindowFocus: false,
  });

  // Filtrer les utilisateurs par rôle
  const admins = users.filter((user: User) => user.role === "admin");
  const agents = users.filter((user: User) => user.role === "agent");
  const subAgents = users.filter((user: User) => user.role === "sub-agent");
  const hunters = users.filter((user: User) => user.role === "hunter");
  const guideUsers = users.filter((user: User) => user.role === "guide");

  // Filtrage des utilisateurs par recherche
  const filterUsers = (userList: User[]) => {
    const searchLower = searchTerm.toLowerCase();
    return userList.filter(user =>
      user.username.toLowerCase().includes(searchLower) ||
      (user.firstName && user.firstName.toLowerCase().includes(searchLower)) ||
      (user.lastName && user.lastName.toLowerCase().includes(searchLower)) ||
      user.email.toLowerCase().includes(searchLower) ||
      (user.phone && user.phone.toLowerCase().includes(searchLower)) ||
      (user.region && user.region.toLowerCase().includes(searchLower))
    );
  };

  // Filtrage des guides par recherche
  const filteredGuides = guides.filter(guide => {
    const searchLower = searchTerm.toLowerCase();
    return (
      guide.lastName.toLowerCase().includes(searchLower) ||
      guide.firstName.toLowerCase().includes(searchLower) ||
      guide.phone.toLowerCase().includes(searchLower) ||
      (guide.zone && guide.zone.toLowerCase().includes(searchLower)) ||
      (guide.region && guide.region.toLowerCase().includes(searchLower)) ||
      guide.idNumber.toLowerCase().includes(searchLower) ||
      (guide.username && guide.username.toLowerCase().includes(searchLower))
    );
  });

  // Pagination pour chaque onglet
  const getPaginatedData = (data: any[], tab: string) => {
    const startIndex = (currentPage[tab] - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (data: any[]) => Math.ceil(data.length / itemsPerPage);

  // Mutation pour réinitialiser le mot de passe d'un utilisateur
  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest({
        url: `/api/users/${userId}/reset-password`,
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "Mot de passe réinitialisé",
        description: "Le mot de passe a été réinitialisé avec succès.",
      });
      setIsResetPasswordDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de la réinitialisation du mot de passe.",
      });
    },
  });

  // Mutation pour supprimer tous les chasseurs
  const deleteAllHuntersMutation = useMutation({
    mutationFn: async () => {
      const promises = hunters.map(hunter => 
        apiRequest({
          url: `/api/users/${hunter.id}?force=true`,
          method: "DELETE",
        })
      );
      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === "fulfilled").length;
      const failed = results.filter(r => r.status === "rejected").length;
      return { successful, failed };
    },
    onSuccess: (data) => {
      toast({
        title: "Chasseurs supprimés",
        description: `${data.successful} chasseurs ont été supprimés avec succès. ${data.failed} suppressions ont échoué.`,
      });
      setIsDeleteAllHuntersDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hunters"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de la suppression des chasseurs.",
      });
    },
  });
  
  // Mutation pour supprimer tous les guides de chasse
  const deleteAllGuidesMutation = useMutation({
    mutationFn: async () => {
      const promises = guides.map(guide => 
        apiRequest({
          url: `/api/guides/${guide.id}?force=true`,
          method: "DELETE",
        })
      );
      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === "fulfilled").length;
      const failed = results.filter(r => r.status === "rejected").length;
      return { successful, failed };
    },
    onSuccess: (data) => {
      toast({
        title: "Guides de chasse supprimés",
        description: `${data.successful} guides ont été supprimés avec succès. ${data.failed} suppressions ont échoué.`,
      });
      setIsDeleteAllGuidesDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/guides"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de la suppression des guides.",
      });
    },
  });

  // Mutation pour supprimer un utilisateur
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const isAdmin = localStorage.getItem('userRole') === 'admin';
      const url = isAdmin ? `/api/users/${userId}?force=true` : `/api/users/${userId}`;
      return apiRequest({
        url: url,
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Utilisateur supprimé",
        description: "L'utilisateur a été supprimé avec succès.",
      });
      setIsDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hunters"] });
    },
    onError: (error: any) => {
      let errorMessage = "Échec de la suppression de l'utilisateur.";
      if (error.response?.status === 403) {
        errorMessage = "Vous n'avez pas les permissions nécessaires pour supprimer cet utilisateur.";
      } else if (error.response?.status === 404) {
        errorMessage = "Utilisateur introuvable.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      toast({
        variant: "destructive",
        title: "Erreur",
        description: errorMessage,
      });
    },
  });

  // Mutation pour suspendre/réactiver un utilisateur
  const toggleSuspensionMutation = useMutation({
    mutationFn: async ({ userId, action }: { userId: number; action: 'suspend' | 'reactivate' }) => {
      return apiRequest({
        url: `/api/users/${userId}/${action}`,
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: suspensionAction === 'suspend' ? "Compte suspendu" : "Compte réactivé",
        description: suspensionAction === 'suspend' 
          ? "Le compte utilisateur a été suspendu avec succès." 
          : "Le compte utilisateur a été réactivé avec succès.",
      });
      setIsSuspensionDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: suspensionAction === 'suspend' 
          ? "Échec de la suspension du compte." 
          : "Échec de la réactivation du compte.",
      });
    },
  });

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setIsResetPasswordDialogOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleEditAgent = (user: User) => {
    setSelectedUser(user);
    setIsEditAgentDialogOpen(true);
  };

  const handleToggleSuspension = (user: User) => {
    setSelectedUser(user);
    setSuspensionAction(user.isSuspended ? 'reactivate' : 'suspend');
    setIsSuspensionDialogOpen(true);
  };

  const confirmResetPassword = () => {
    if (selectedUser) {
      resetPasswordMutation.mutate(selectedUser.id);
    }
  };

  const confirmDeleteUser = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.id);
    }
  };

  const confirmSuspensionAction = () => {
    if (selectedUser) {
      toggleSuspensionMutation.mutate({ 
        userId: selectedUser.id, 
        action: suspensionAction 
      });
    }
  };

  const handleRefresh = async () => {
    await Promise.all([refetchUsers(), refetchGuides()]);
    toast({
      title: "Données actualisées",
      description: "Les données des utilisateurs et des guides ont été actualisées.",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    alert("Exportation en PDF simulée !");
    // Ici, tu peux intégrer une bibliothèque comme jsPDF pour générer un PDF
  };

  const handleExport = () => {
    alert("Exportation des données simulée !");
    // Ici, tu peux ajouter une logique pour exporter les données (par exemple, en CSV)
  };

  // Rendu de tableau d'utilisateurs
  const renderUsersTable = (userList: User[], tab: string) => {
    const filteredList = filterUsers(userList);
    const paginatedList = getPaginatedData(filteredList, tab);
    const totalPages = getTotalPages(filteredList);
    const startIndex = (currentPage[tab] - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredList.length);

    return (
      <>
        <Table>
          <TableCaption>Liste des utilisateurs</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <input type="checkbox" className="h-4 w-4" />
              </TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Nom d'utilisateur</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Prénom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Région</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  Aucun utilisateur trouvé
                </TableCell>
              </TableRow>
            ) : (
              paginatedList.map((user) => (
                <TableRow key={user.id}>
                  <TableCell><input type="checkbox" className="h-4 w-4" /></TableCell>
                  <TableCell>{user.id}</TableCell>
                  <TableCell className="font-medium">
                    {user.username}
                    <Badge className="ml-2" variant={
                      user.role === 'admin' ? "destructive" : 
                      user.role === 'agent' ? "outline" : 
                      user.role === 'sub-agent' ? "default" : 
                      "secondary"
                    }>
                      {
                        user.role === 'admin' ? 'Admin' : 
                        user.role === 'agent' ? 'Agent' : 
                        user.role === 'sub-agent' ? 'Agent Secteur' : 
                        'Chasseur'
                      }
                    </Badge>
                  </TableCell>
                  <TableCell>{user.lastName || "-"}</TableCell>
                  <TableCell>{user.firstName || "-"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone || "-"}</TableCell>
                  <TableCell>{user.region || "-"}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          Actions <ChevronDownIcon className="ml-1 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Options</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {user.role === 'agent' && (
                          <DropdownMenuItem onClick={() => handleEditAgent(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                        )}
                        {user.role !== 'admin' && (
                          <>
                            <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Réinitialiser le mot de passe
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleSuspension(user)}>
                              {user.isSuspended ? (
                                <>
                                  <Check className="mr-2 h-4 w-4" />
                                  Réactiver le compte
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="mr-2 h-4 w-4" />
                                  Suspendre le compte
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteUser(user)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        <div className="flex justify-between items-center text-sm mt-4">
          <div className="text-muted-foreground">
            {filteredList.length > 0 ? `Affichage de ${startIndex + 1} à ${endIndex} sur ${filteredList.length} utilisateurs` : "Aucun résultat"}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage({ ...currentPage, [tab]: Math.max(1, currentPage[tab] - 1) })}
              disabled={currentPage[tab] === 1}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage({ ...currentPage, [tab]: currentPage[tab] + 1 })}
              disabled={currentPage[tab] >= totalPages}
            >
              Suivant
            </Button>
          </div>
        </div>
      </>
    );
  };

  // Rendu du tableau des guides de chasse
  const renderGuidesTable = () => {
    const paginatedGuides = getPaginatedData(filteredGuides, 'guides');
    const totalPages = getTotalPages(filteredGuides);
    const startIndex = (currentPage.guides - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredGuides.length);

    return (
      <>
        <Table>
          <TableCaption>Liste des guides de chasse</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <input type="checkbox" className="h-4 w-4" />
              </TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Nom d'utilisateur</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Prénom</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Zone/Lieu</TableHead>
              <TableHead>Région</TableHead>
              <TableHead>N° Pièce d'identité</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedGuides.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  Aucun guide de chasse trouvé
                </TableCell>
              </TableRow>
            ) : (
              paginatedGuides.map((guide) => (
                <TableRow key={guide.id}>
                  <TableCell><input type="checkbox" className="h-4 w-4" /></TableCell>
                  <TableCell>{guide.id}</TableCell>
                  <TableCell className="font-medium">
                    {guide.username || "Non assigné"}
                    <Badge className="ml-2" variant="secondary">
                      Guide de chasse
                    </Badge>
                  </TableCell>
                  <TableCell>{guide.lastName}</TableCell>
                  <TableCell>{guide.firstName}</TableCell>
                  <TableCell>{guide.phone}</TableCell>
                  <TableCell>{guide.zone || "-"}</TableCell>
                  <TableCell>{guide.region || "-"}</TableCell>
                  <TableCell>{guide.idNumber}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      Actions <ChevronDownIcon className="ml-1 h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        <div className="flex justify-between items-center text-sm mt-4">
          <div className="text-muted-foreground">
            {filteredGuides.length > 0 ? `Affichage de ${startIndex + 1} à ${endIndex} sur ${filteredGuides.length} guides` : "Aucun résultat"}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage({ ...currentPage, guides: Math.max(1, currentPage.guides - 1) })}
              disabled={currentPage.guides === 1}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage({ ...currentPage, guides: currentPage.guides + 1 })}
              disabled={currentPage.guides >= totalPages}
            >
              Suivant
            </Button>
          </div>
        </div>
      </>
    );
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
        <h1 className="text-3xl font-bold">Gestion des comptes</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestion des utilisateurs</CardTitle>
          <CardDescription>
            Gestion des différents profils d'utilisateurs du système
          </CardDescription>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
            <div className="w-full sm:w-1/2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, email, région..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex space-x-2 w-full sm:w-auto">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimer
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Exporter
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs defaultValue="admins">
            <TabsList className="w-full grid grid-cols-5 rounded-none">
              <TabsTrigger value="admins">Administrateurs ({admins.length})</TabsTrigger>
              <TabsTrigger value="agents">Agents ({agents.length})</TabsTrigger>
              <TabsTrigger value="subagents">Agents Secteur ({subAgents.length})</TabsTrigger>
              <TabsTrigger value="guides">Guides de Chasse ({guides.length})</TabsTrigger>
              <TabsTrigger value="hunters">Chasseurs ({hunters.length})</TabsTrigger>
            </TabsList>

          <TabsContent value="admins" className="p-4">
            {renderUsersTable(admins, 'admins')}
          </TabsContent>

          <TabsContent value="agents" className="p-4">
            <div className="pb-4 flex justify-end">
              <Button 
                variant="default" 
                size="sm"
                onClick={() => setIsAddAgentDialogOpen(true)}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Ajouter un agent
              </Button>
            </div>
            {renderUsersTable(agents, 'agents')}
          </TabsContent>

          <TabsContent value="subagents" className="p-4">
            <div className="pb-4 flex justify-between">
              <div className="text-sm text-muted-foreground">
                Agents Secteur créés par les agents régionaux
              </div>
            </div>
            {renderUsersTable(subAgents, 'subagents')}
          </TabsContent>

          <TabsContent value="guides" className="p-4">
            <div className="pb-4 flex justify-end">
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setIsDeleteAllGuidesDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer tous les Guides de chasse
              </Button>
            </div>
            {renderGuidesTable()}
          </TabsContent>

          <TabsContent value="hunters" className="p-4">
            <div className="pb-4 flex justify-end">
              {hunters.length > 0 && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setIsDeleteAllHuntersDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer tous les chasseurs
                </Button>
              )}
            </div>
            {renderUsersTable(hunters, 'hunters')}
          </TabsContent>
        </Tabs>
        </CardContent>
      </Card>

      {/* Dialogue de confirmation pour réinitialiser le mot de passe */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>
              Voulez-vous réinitialiser le mot de passe de l'utilisateur {selectedUser?.username} ?
              Le mot de passe sera réinitialisé à une valeur par défaut.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              variant="default" 
              onClick={confirmResetPassword}
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                  En cours...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Confirmer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialogue de confirmation pour supprimer un utilisateur */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'utilisateur</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'utilisateur {selectedUser?.username} ?
              Cette action est irréversible et supprimera toutes les données associées à cet utilisateur.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteUser} 
              className="bg-destructive"
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                  En cours...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Dialogue de confirmation pour supprimer tous les guides de chasse */}
      <AlertDialog open={isDeleteAllGuidesDialogOpen} onOpenChange={setIsDeleteAllGuidesDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer tous les guides de chasse</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer tous les guides de chasse ?
              Cette action est irréversible et supprimera toutes les données associées à ces guides.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteAllGuidesMutation.mutate()} 
              className="bg-destructive"
              disabled={deleteAllGuidesMutation.isPending}
            >
              {deleteAllGuidesMutation.isPending ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                  En cours...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer tous
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Dialogue de confirmation pour suspendre/réactiver un compte */}
      <AlertDialog open={isSuspensionDialogOpen} onOpenChange={setIsSuspensionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {suspensionAction === 'suspend' ? 'Suspendre le compte' : 'Réactiver le compte'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {suspensionAction === 'suspend' 
                ? `Êtes-vous sûr de vouloir suspendre temporairement le compte de ${selectedUser?.username} ? L'utilisateur ne pourra plus se connecter jusqu'à la réactivation de son compte.`
                : `Êtes-vous sûr de vouloir réactiver le compte de ${selectedUser?.username} ? L'utilisateur pourra à nouveau se connecter.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmSuspensionAction} 
              className={suspensionAction === 'suspend' ? 'bg-destructive' : 'bg-primary'}
              disabled={toggleSuspensionMutation.isPending}
            >
              {toggleSuspensionMutation.isPending ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                  En cours...
                </>
              ) : (
                <>
                  {suspensionAction === 'suspend' ? (
                    <>
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Suspendre
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Réactiver
                    </>
                  )}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Dialogue de confirmation pour supprimer tous les chasseurs */}
      <AlertDialog open={isDeleteAllHuntersDialogOpen} onOpenChange={setIsDeleteAllHuntersDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer tous les chasseurs</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer tous les comptes chasseurs ({hunters.length}) ?
              Cette action est irréversible et supprimera également toutes les données associées à ces utilisateurs.
              Les comptes administrateurs et agents seront préservés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteAllHuntersMutation.mutate()} 
              className="bg-destructive"
              disabled={deleteAllHuntersMutation.isPending}
            >
              {deleteAllHuntersMutation.isPending ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                  En cours...
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Supprimer tous les chasseurs
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Formulaire d'édition d'agent */}
      {selectedUser && (
        <AgentForm
          open={isEditAgentDialogOpen}
          onOpenChange={setIsEditAgentDialogOpen}
          agentData={selectedUser}
          mode="edit"
        />
      )}
      
      {/* Formulaire d'ajout d'agent */}
      <AddAgentForm
        open={isAddAgentDialogOpen}
        onClose={() => setIsAddAgentDialogOpen(false)}
      />
    </div>
  );
}