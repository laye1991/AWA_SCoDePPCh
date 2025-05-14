import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Check, FileText, Filter, MoreHorizontal, RefreshCw, Search, X } from "lucide-react";

// Type pour les demandes de permis
interface PermitRequest {
  id: number;
  hunterName: string;
  hunterCategory: string;
  requestDate: string;
  status: "pending" | "approved" | "rejected";
  permitType: string;
  region: string;
  department: string;
  phone: string;
  email: string;
  comments?: string;
}

export default function PermitRequestReception() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [selectedRequests, setSelectedRequests] = useState<number[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<PermitRequest | null>(null);
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<"approve" | "reject" | null>(null);

  // Requête pour récupérer les demandes de permis
  const { data: permitRequests, isLoading, error, refetch } = useQuery<PermitRequest[]>({
    queryKey: ["/api/permit-requests"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Mutation pour approuver une demande
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      // Simuler un appel API pour approuver la demande
      const response = await fetch(`/api/permit-requests/${id}/approve`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Échec de l'approbation");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "La demande a été approuvée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/permit-requests"] });
      setDetailsOpen(false);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'approuver la demande",
        variant: "destructive",
      });
    },
  });

  // Mutation pour rejeter une demande
  const rejectMutation = useMutation({
    mutationFn: async (id: number) => {
      // Simuler un appel API pour rejeter la demande
      const response = await fetch(`/api/permit-requests/${id}/reject`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Échec du rejet");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "La demande a été rejetée",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/permit-requests"] });
      setDetailsOpen(false);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de rejeter la demande",
        variant: "destructive",
      });
    },
  });

  // Mutation pour les actions en masse
  const bulkActionMutation = useMutation({
    mutationFn: async ({ action, ids }: { action: "approve" | "reject"; ids: number[] }) => {
      // Simuler un appel API pour actions en masse
      const response = await fetch(`/api/permit-requests/bulk-${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) throw new Error(`Échec de l'action en masse`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: `${selectedRequests.length} demandes ont été traitées avec succès`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/permit-requests"] });
      setSelectedRequests([]);
      setBulkActionOpen(false);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de traiter les demandes sélectionnées",
        variant: "destructive",
      });
    },
  });

  // Fonction pour filtrer les demandes
  const filteredRequests = permitRequests
    ? permitRequests.filter((request) => {
        const matchesSearch =
          request.hunterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.permitType.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.region.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus ? request.status === filterStatus : true;

        return matchesSearch && matchesStatus;
      })
    : [];

  // Fonctions de gestion des sélections
  const toggleSelectAll = () => {
    if (selectedRequests.length === filteredRequests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(filteredRequests.map((r) => r.id));
    }
  };

  const toggleSelectRequest = (id: number) => {
    if (selectedRequests.includes(id)) {
      setSelectedRequests(selectedRequests.filter((requestId) => requestId !== id));
    } else {
      setSelectedRequests([...selectedRequests, id]);
    }
  };

  // Fonction pour ouvrir les détails d'une demande
  const viewRequestDetails = (request: PermitRequest) => {
    setCurrentRequest(request);
    setDetailsOpen(true);
  };

  // Fonction pour exécuter l'action en masse
  const executeBulkAction = () => {
    if (bulkAction && selectedRequests.length > 0) {
      bulkActionMutation.mutate({ action: bulkAction, ids: selectedRequests });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50 p-4 rounded-md">
        <h1 className="text-xl font-semibold text-neutral-800 mb-2 md:mb-0">
          Réception des Demandes de Permis
        </h1>

      </div>

      {/* Filtres et recherche */}
      <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg shadow-sm">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Rechercher par nom, type de permis..."
            className="pl-10 bg-white h-9 text-sm border-gray-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs">
                <Filter className="h-3.5 w-3.5" />
                Filtres
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterStatus(null)}>Tous</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("pending")}>En attente</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("approved")}>Approuvés</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("rejected")}>Rejetés</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {selectedRequests.length > 0 && (
            <Button
              variant="default"
              size="sm"
              className="flex items-center gap-1 text-xs"
              onClick={() => {
                setBulkAction("approve");
                setBulkActionOpen(true);
              }}
            >
              <Check className="h-3.5 w-3.5" />
              Approuver ({selectedRequests.length})
            </Button>
          )}
        </div>
      </div>

      {/* Tableau des demandes */}
      <div className="bg-white rounded-md shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center">Chargement des demandes...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">Erreur: Impossible de charger les demandes</div>
        ) : filteredRequests.length > 0 ? (
          <div className="overflow-x-auto rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <div className="flex items-center justify-center">
                      <Checkbox 
                        checked={selectedRequests.length === filteredRequests.length && filteredRequests.length > 0} 
                        onCheckedChange={toggleSelectAll} 
                      />
                    </div>
                  </TableHead>
                  <TableHead>Chasseur</TableHead>
                  <TableHead>Type de Permis</TableHead>
                  <TableHead>Date de Demande</TableHead>
                  <TableHead>Région</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <Checkbox 
                          checked={selectedRequests.includes(request.id)} 
                          onCheckedChange={() => toggleSelectRequest(request.id)} 
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{request.hunterName}</TableCell>
                    <TableCell>{request.permitType}</TableCell>
                    <TableCell>
                      {format(new Date(request.requestDate), "dd MMM yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell>{request.region}</TableCell>
                    <TableCell>
                      <Badge
                        variant={request.status === "pending" ? "outline" : request.status === "approved" ? "default" : "destructive"}
                      >
                        {request.status === "pending" && "En attente"}
                        {request.status === "approved" && "Approuvé"}
                        {request.status === "rejected" && "Rejeté"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewRequestDetails(request)}
                        className="text-blue-600 hover:text-blue-700 text-xs"
                      >
                        Détails
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">Aucune demande trouvée</div>
        )}
      </div>

      {/* Boîte de dialogue des détails de la demande */}
      {currentRequest && (
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Détails de la Demande de Permis</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 my-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-500">Chasseur</h4>
                  <p className="text-base">{currentRequest.hunterName}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-500">Catégorie</h4>
                  <p className="text-base capitalize">{currentRequest.hunterCategory}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-500">Type de Permis</h4>
                  <p className="text-base">{currentRequest.permitType}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-500">Date de Demande</h4>
                  <p className="text-base">
                    {format(new Date(currentRequest.requestDate), "dd MMMM yyyy", { locale: fr })}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-500">Région</h4>
                  <p className="text-base">{currentRequest.region}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-500">Département</h4>
                  <p className="text-base">{currentRequest.department}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-500">Téléphone</h4>
                  <p className="text-base">{currentRequest.phone}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-500">Email</h4>
                  <p className="text-base">{currentRequest.email || "Non spécifié"}</p>
                </div>
              </div>

              {currentRequest.comments && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-500">Commentaires</h4>
                  <p className="text-base p-2 bg-gray-50 rounded-md">{currentRequest.comments}</p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold text-gray-500">Statut</h4>
                <Badge
                  className="mt-1 text-sm"
                  variant={currentRequest.status === "pending" ? "outline" : currentRequest.status === "approved" ? "default" : "destructive"}
                >
                  {currentRequest.status === "pending" && "En attente"}
                  {currentRequest.status === "approved" && "Approuvé"}
                  {currentRequest.status === "rejected" && "Rejeté"}
                </Badge>
              </div>
            </div>

            <DialogFooter>
              {currentRequest.status === "pending" && (
                <div className="flex space-x-2 w-full">
                  <Button
                    variant="outline"
                    onClick={() => rejectMutation.mutate(currentRequest.id)}
                    disabled={rejectMutation.isPending}
                    className="flex-1"
                  >
                    {rejectMutation.isPending ? "Traitement..." : "Rejeter"}
                  </Button>
                  <Button
                    onClick={() => approveMutation.mutate(currentRequest.id)}
                    disabled={approveMutation.isPending}
                    className="flex-1"
                  >
                    {approveMutation.isPending ? "Traitement..." : "Approuver"}
                  </Button>
                </div>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Boîte de dialogue pour action en masse */}
      <Dialog open={bulkActionOpen} onOpenChange={setBulkActionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkAction === "approve" ? "Approuver les demandes" : "Rejeter les demandes"}
            </DialogTitle>
            <DialogDescription>
              Vous êtes sur le point de {bulkAction === "approve" ? "approuver" : "rejeter"} {selectedRequests.length} demande(s) de permis. Êtes-vous sûr de vouloir continuer ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkActionOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={executeBulkAction}
              disabled={bulkActionMutation.isPending}
              variant={bulkAction === "approve" ? "default" : "destructive"}
            >
              {bulkActionMutation.isPending ? "Traitement..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
