import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronDownIcon, Trash2, RefreshCw, UserPlus, AlertTriangle, Check, UserCog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AddAgentSubAccountForm from "@/components/agents/AddAgentSubAccountForm";

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

// Types
interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'agent' | 'hunter' | 'sub-agent';
  phone: string;
  region?: string;
  isSuspended?: boolean;
  matricule?: string;
  serviceLocation?: string;
}

export default function SubAccounts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSuspensionDialogOpen, setIsSuspensionDialogOpen] = useState(false);
  const [suspensionAction, setSuspensionAction] = useState<'suspend' | 'reactivate'>('suspend');
  const [isAddSubAccountDialogOpen, setIsAddSubAccountDialogOpen] = useState(false);

  // Requête pour récupérer tous les utilisateurs
  const { data: users = [], isLoading, refetch } = useQuery<User[]>({
    queryKey: ["/api/users"],
    refetchOnWindowFocus: false,
    select: (data) => {
      // Filtrer pour ne montrer que les agents de la même région que l'agent connecté
      if (!user || user.role !== 'agent') return [];
      
      return data.filter((u) => 
        u.role === 'sub-agent' && 
        u.region === user.region && 
        u.id !== user.id
      );
    }
  });

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
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de la réinitialisation du mot de passe.",
      });
    },
  });
  
  // Mutation pour supprimer un utilisateur
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      console.log(`🚫 Tentative de suppression du sous-compte ${userId}`);
      
      try {
        const response = await apiRequest({
          url: `/api/users/${userId}`,
          method: "DELETE",
        });
        console.log(`✅ Réponse de suppression:`, response);
        return response;
      } catch (error) {
        console.error(`❌ Erreur lors de la suppression du sous-compte ${userId}:`, error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("✅ Suppression réussie:", data);
      toast({
        title: "Agent Secteur supprimé",
        description: "L'Agent Secteur a été supprimé avec succès.",
      });
      setIsDeleteDialogOpen(false);
      refetch();
    },
    onError: (error: any) => {
      console.error("❌ Erreur détaillée:", error);
      
      // Message personnalisé en fonction du statut de l'erreur
      let errorMessage = "Échec de la suppression de l'Agent Secteur.";
      
      if (error.response?.status === 403) {
        errorMessage = "Vous n'avez pas les permissions nécessaires pour supprimer ce compte.";
      } else if (error.response?.status === 404) {
        errorMessage = "Utilisateur introuvable.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast({
        variant: "destructive",
        title: "Erreur",
        description: errorMessage
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
          ? "Le compte a été suspendu avec succès." 
          : "Le compte a été réactivé avec succès.",
      });
      setIsSuspensionDialogOpen(false);
      refetch();
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestion des Agents Secteur</h1>
        <div className="flex space-x-2">
          <Button 
            onClick={() => refetch()}
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
          <Button 
            variant="default" 
            onClick={() => setIsAddSubAccountDialogOpen(true)}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Ajouter un Agent Secteur
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agents Secteur de votre région</CardTitle>
          <CardDescription>
            Gérez les Agents Secteur rattachés à votre région
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableCaption>Liste des Agents Secteur</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">ID</TableHead>
                <TableHead>Nom d'utilisateur</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Prénom</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Matricule</TableHead>
                <TableHead>Secteur</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    Aucun Agent Secteur trouvé dans votre région
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell className="font-medium">
                      {user.username}
                      {user.isSuspended && (
                        <Badge variant="destructive" className="ml-2">Suspendu</Badge>
                      )}
                    </TableCell>
                    <TableCell>{user.lastName}</TableCell>
                    <TableCell>{user.firstName}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>{user.matricule}</TableCell>
                    <TableCell>{user.serviceLocation}</TableCell>
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
                          <DropdownMenuItem onClick={() => handleDeleteUser(user)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogue de réinitialisation de mot de passe */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir réinitialiser le mot de passe de cet utilisateur? Un nouveau mot de passe temporaire sera généré.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={confirmResetPassword}>
              Réinitialiser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue de suppression */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'Agent Secteur</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet Agent Secteur? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteUser} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialogue de suspension/réactivation */}
      <AlertDialog open={isSuspensionDialogOpen} onOpenChange={setIsSuspensionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {suspensionAction === 'suspend' ? 'Suspendre le compte' : 'Réactiver le compte'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {suspensionAction === 'suspend' 
                ? "Êtes-vous sûr de vouloir suspendre ce compte? L'utilisateur ne pourra plus se connecter."
                : "Êtes-vous sûr de vouloir réactiver ce compte? L'utilisateur pourra à nouveau se connecter."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmSuspensionAction}
              className={suspensionAction === 'suspend' ? "bg-amber-600 hover:bg-amber-700" : ""}
            >
              {suspensionAction === 'suspend' ? 'Suspendre' : 'Réactiver'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Formulaire d'ajout d'agent secteur */}
      <AddAgentSubAccountForm 
        open={isAddSubAccountDialogOpen} 
        onClose={() => setIsAddSubAccountDialogOpen(false)} 
      />
    </div>
  );
}