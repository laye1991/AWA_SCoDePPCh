import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Printer,
  Search,
  UserPlus,
  Trash2,
  MoreHorizontal
} from "lucide-react";
import { IdBadge } from "@/components/ui/id-badge";
import { useToast } from "@/hooks/use-toast";
import { useHunters, useHuntersByRegion, useHuntersByZone } from "@/lib/hooks/useHunters";
import HunterForm from "@/components/hunters/HunterForm";
import HunterDetails from "@/components/hunters/HunterDetails";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";

export default function Hunters() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedHunterId, setSelectedHunterId] = useState<number | null>(null);
  const [hunterToDelete, setHunterToDelete] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Récupérer les chasseurs en fonction du rôle
  const { allHunters, huntersLoading: isLoadingAll, error: errorAll } = useHunters();
  const { data: regionHunters, isLoading: isLoadingRegion, error: errorRegion } =
    useHuntersByRegion(user?.region || null);
  const { data: zoneHunters, isLoading: isLoadingZone, error: errorZone } =
    useHuntersByZone(user?.zone || null);

  // Déterminer quels chasseurs afficher en fonction de l'onglet actif
  const hunters = activeTab === "all" ? allHunters :
    activeTab === "region" ? regionHunters :
      activeTab === "zone" ? zoneHunters :
        allHunters;

  const isLoading = activeTab === "all" ? isLoadingAll :
    activeTab === "region" ? isLoadingRegion :
      activeTab === "zone" ? isLoadingZone :
        isLoadingAll;

  const error = activeTab === "all" ? errorAll :
    activeTab === "region" ? errorRegion :
      activeTab === "zone" ? errorZone :
        errorAll;

  // Mutation pour supprimer un chasseur
  const deleteHunterMutation = useMutation({
    mutationFn: async (hunterId: number) => {
      console.log(`🚫 Tentative de suppression du chasseur ${hunterId}`);

      // Vérifier si l'utilisateur est admin pour forcer la suppression
      const isAdmin = localStorage.getItem('userRole') === 'admin';
      console.log(`🔑 Suppression par admin? ${isAdmin}`);

      try {
        // Si c'est un administrateur, ajouter force=true dans l'URL
        const url = isAdmin
          ? `/api/hunters/${hunterId}?force=true`
          : `/api/hunters/${hunterId}`;

        console.log(`🔗 URL d'appel: ${url}`);

        const response = await apiRequest({
          url: url,
          method: "DELETE",
        });
        console.log(`✅ Réponse de suppression:`, response);
        return response;
      } catch (error) {
        console.error(`❌ Erreur lors de la suppression du chasseur ${hunterId}:`, error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("✅ Suppression réussie:", data);
      toast({
        title: "Chasseur supprimé",
        description: "Le chasseur a été supprimé avec succès.",
      });
      setIsDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/hunters"] });
    },
    onError: (error: any) => {
      console.error("❌ Erreur détaillée:", error);

      // Log détaillé de l'erreur pour faciliter le debug
      try {
        console.error("Détails de l'erreur:", JSON.stringify(error, null, 2));
        console.error("Response data:", error.response?.data);
        console.error("Status:", error.response?.status);
      } catch (e) {
        console.error("Erreur lors de la journalisation des détails de l'erreur");
      }

      // Message personnalisé en fonction du statut de l'erreur
      let errorMessage = "Échec de la suppression du chasseur.";

      if (error.response?.status === 403) {
        errorMessage = "Vous n'avez pas les permissions nécessaires pour supprimer ce chasseur.";
      } else if (error.response?.status === 404) {
        errorMessage = "Chasseur introuvable.";
      } else if (error.response?.status === 400) {
        errorMessage = "Ce chasseur possède des permis actifs ou un historique et ne peut pas être supprimé.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast({
        variant: "destructive",
        title: "Erreur",
        description: errorMessage
      });
      setIsDeleteDialogOpen(false);
    },
  });

  const filteredHunters = hunters?.filter(hunter => {
    const searchLower = searchTerm.toLowerCase();
    return (
      hunter.lastName.toLowerCase().includes(searchLower) ||
      hunter.firstName.toLowerCase().includes(searchLower) ||
      hunter.idNumber.toLowerCase().includes(searchLower) ||
      hunter.phone.toLowerCase().includes(searchLower)
    );
  });

  const handleSearch = () => {
    // Client-side filtering is already happening with the state change
    // This function is if we decide to add server-side search in the future
  };

  const handlePrint = () => {
    // Ajouter une feuille de style temporaire pour l'impression qui cache tout sauf le tableau
    const style = document.createElement('style');
    style.id = 'print-style-hunters';
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #hunters-table, #hunters-table * {
          visibility: visible;
        }
        .print\\:hidden {
          display: none !important;
        }
        #hunters-table {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        table {
          width: 100%;
        }
        .hidden {
          display: table-cell !important;
        }
      }
    `;
    document.head.appendChild(style);

    // Imprimer et nettoyer
    window.print();

    // Supprimer la feuille de style temporaire après l'impression
    setTimeout(() => {
      const printStyle = document.getElementById('print-style-hunters');
      if (printStyle) printStyle.remove();
    }, 1000);
  };

  const viewHunterDetails = (hunterId: number) => {
    setSelectedHunterId(hunterId);
  };

  const handleDeleteHunter = (hunterId: number) => {
    setHunterToDelete(hunterId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteHunter = () => {
    if (hunterToDelete) {
      deleteHunterMutation.mutate(hunterToDelete);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 p-4 rounded-md">
          <h1 className="text-xl font-semibold text-neutral-800 mb-2 md:mb-0">
            Gestion des Chasseurs
          </h1>
          {/* Bouton d'ajout masqué pour les admins, mais disponible pour les autres rôles */}
          {localStorage.getItem('userRole') !== 'admin' && (
            <Button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Ajouter un Chasseur
            </Button>
          )}
        </div>

        {/* Tabs based on user role */}
        {user?.role === "agent" ? (
          <Tabs defaultValue="region" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="region">Chasseurs de la Région</TabsTrigger>
              <TabsTrigger value="all">Liste Nationale des Chasseurs</TabsTrigger>
            </TabsList>
          </Tabs>
        ) : user?.role === "sub-agent" ? (
          <Tabs defaultValue="zone" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all">Liste Nationale des Chasseurs</TabsTrigger>
              <TabsTrigger value="zone">Suivi Chasseur</TabsTrigger>
            </TabsList>
            <div className="mt-2 px-2 py-1 bg-yellow-50 text-sm text-yellow-700 rounded border border-yellow-200">
              <p className="font-medium">Informations sur le suivi des chasseurs :</p>
              <ul className="list-disc ml-4 mt-1 text-xs">
                <li>L'onglet "Suivi Chasseur" affiche les chasseurs assignés à votre zone et ceux qui ont des permis actifs dans votre zone</li>
                <li>Les chasseurs avec un permis actif dans votre zone apparaissent automatiquement, même s'ils ne sont pas assignés explicitement</li>
              </ul>
            </div>
          </Tabs>
        ) : null}

        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg shadow-sm">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Rechercher par nom, numéro de pièce..."
              className="pl-10 bg-white h-9 text-sm border-gray-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-xs"
              onClick={handleSearch}
            >
              <Search className="h-3.5 w-3.5" />
              Filtres
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-xs"
              onClick={handlePrint}
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimer
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-xs"
            >
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-xs"
            >
              Exporter
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-md shadow-sm">
          {isLoading ? (
            <div className="p-8 text-center">Chargement des chasseurs...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">Erreur: Impossible de charger les chasseurs</div>
          ) : filteredHunters && filteredHunters.length > 0 ? (
            <div className="overflow-x-auto rounded-lg print:overflow-visible">
              <table className="w-full" id="hunters-table">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="w-10 p-3">
                      <div className="flex items-center justify-center">
                        <input type="checkbox" className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500">ID</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500">NOM COMPLET</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500">TÉLÉPHONE</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500">N° PIÈCE ID</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500">CATÉGORIE</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500">STATUT</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHunters.map((hunter) => (
                    <tr key={hunter.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center justify-center">
                          <input type="checkbox" className="h-4 w-4" />
                        </div>
                      </td>
                      <td className="p-3 text-sm text-gray-700"><IdBadge id={hunter.id} type="hunter" /></td>
                      <td className="p-3 text-sm text-gray-700">{hunter.firstName} {hunter.lastName}</td>
                      <td className="p-3 text-sm text-gray-700">{hunter.phone}</td>
                      <td className="p-3 text-sm text-gray-700">{hunter.idNumber}</td>
                      <td className="p-3 text-sm text-gray-700 capitalize">{hunter.category}</td>
                      <td className="p-3 text-sm">
                        {hunter.isSuspended ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            Suspendu
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Actif
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewHunterDetails(hunter.id)}
                            className="text-blue-600 hover:text-blue-700 text-xs"
                          >
                            Détails
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-3 flex justify-between items-center text-xs text-gray-500 bg-gray-50">
                <div>Affichage de 1 à {filteredHunters.length} sur {filteredHunters.length} chasseurs</div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="text-xs">Précédent</Button>
                  <Button variant="default" size="sm" className="text-xs bg-blue-100 text-blue-600">Suivant</Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">Aucun chasseur trouvé</div>
          )}
        </div>
      </div>

      {/* Add Hunter Form Modal */}
      {showAddForm && (
        <HunterForm
          open={showAddForm}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Hunter Details Modal */}
      {selectedHunterId && (
        <HunterDetails
          hunterId={selectedHunterId}
          open={!!selectedHunterId}
          onClose={() => setSelectedHunterId(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce chasseur ? Cette action ne peut pas être annulée.
              {localStorage.getItem('userRole') === 'admin' && (
                <p className="text-red-500 mt-2">
                  En tant qu'administrateur, cette suppression sera forcée, même si le chasseur possède des permis ou un historique.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteHunter}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteHunterMutation.isPending}
            >
              {deleteHunterMutation.isPending ? (
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
    </>
  );
}
