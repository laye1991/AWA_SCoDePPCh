import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Edit, Trash2, FileText, Ban, CheckCircle2, AlertTriangle, MailQuestion } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useHunterDetails } from "@/lib/hooks/useHunters";
import { usePermissions } from "@/lib/hooks/usePermissions";
import type { Hunter, Permit } from "@shared/schema";
import HunterForm from "./HunterForm";

interface HunterDetailsProps {
  hunterId: number;
  open: boolean;
  onClose: () => void;
}

export default function HunterDetails({ hunterId, open, onClose }: HunterDetailsProps) {
  const { toast } = useToast();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showForceDeleteConfirm, setShowForceDeleteConfirm] = useState(false);
  const [suspendConfirm, setSuspendConfirm] = useState(false);
  const [reactivateConfirm, setReactivateConfirm] = useState(false);
  const [permits, setPermits] = useState<Permit[]>([]);
  const [hunterData, setHunterData] = useState<Hunter | null>(null);
  
  // Utilisation directe de useQuery pour récupérer les détails du chasseur
  const { 
    data: hunter,
    isLoading,
    error 
  } = useQuery<Hunter>({ 
    queryKey: [`/api/hunters/${hunterId}`],
    enabled: open && !!hunterId,
  });
  
  // Utiliser le hook personnalisé uniquement pour les mutations
  const {
    suspendHunter,
    suspendLoading,
    reactivateHunter,
    reactivateLoading,
    deleteHunter,
    deleteLoading,
    toggleMinorStatus
  } = useHunterDetails(hunterId);
  
  // Log pour le débogage détaillé
  useEffect(() => {
    if (hunter) {
      console.log("Détails du chasseur reçus dans le composant:", hunter);
      console.log("Type de hunter:", typeof hunter);
      console.log("Nom du chasseur:", hunter?.firstName, hunter?.lastName);
      console.log("ID du chasseur:", hunter?.id);
      console.log("Date de naissance:", hunter?.dateOfBirth);
      console.log("Statut actif:", hunter?.isActive);
      
      // Vérifier si les propriétés sont accessibles
      if ('firstName' in hunter) {
        console.log("firstName est accessible directement");
      } else {
        console.log("firstName N'EST PAS accessible directement");
      }
      
      // Stocker les données du chasseur dans l'état local
      setHunterData(hunter);
    } else {
      console.log("Aucune donnée de chasseur disponible dans le composant");
    }
  }, [hunter]);
  
  // Récupérer manuellement les données du chasseur si nécessaire
  useEffect(() => {
    if (open && hunterId && !hunter && !hunterData) {
      const fetchHunterDirectly = async () => {
        console.log("Récupération directe des données du chasseur:", hunterId);
        try {
          const response = await fetch(`/api/hunters/${hunterId}`);
          if (!response.ok) throw new Error("Erreur lors de la récupération du chasseur");
          
          const data = await response.json();
          console.log("Données récupérées directement:", data);
          setHunterData(data);
        } catch (err) {
          console.error("Erreur lors de la récupération directe:", err);
        }
      };
      
      fetchHunterDirectly();
    }
  }, [open, hunterId, hunter, hunterData]);

  // Charger les permis du chasseur
  useEffect(() => {
    if (open && hunterId) {
      const fetchPermits = async () => {
        try {
          const permitsRes = await fetch(`/api/permits/hunter/${hunterId}`);
          if (!permitsRes.ok) throw new Error("Failed to fetch permits");
          const permitsData = await permitsRes.json();
          setPermits(permitsData);
        } catch (err) {
          console.error(err);
        }
      };
      
      fetchPermits();
    }
  }, [hunterId, open]);

  // Gérer la suppression d'un chasseur
  const handleDelete = async () => {
    try {
      console.log("Démarrage de la suppression du chasseur:", hunterId);
      await deleteHunter.mutateAsync({ id: hunterId, force: true });
      console.log("Suppression du chasseur réussie");
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error("Erreur lors de la suppression du chasseur:", error);
      setShowDeleteConfirm(false);
      // Le traitement des erreurs est géré dans la mutation
    }
  };

  // Gérer la suppression forcée d'un chasseur (même avec des permis actifs)
  const handleForceDelete = async () => {
    try {
      console.log("Démarrage de la suppression forcée du chasseur:", hunterId);
      await deleteHunter.mutateAsync({ id: hunterId, force: true });
      console.log("Suppression forcée du chasseur réussie");
      setShowForceDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error("Erreur lors de la suppression forcée du chasseur:", error);
      setShowForceDeleteConfirm(false);
      // Le traitement des erreurs est géré dans la mutation
    }
  };

  // Gérer la suspension d'un chasseur
  const handleSuspend = async () => {
    try {
      console.log("🔒 Démarrage de la suspension du chasseur:", hunterId);
      await suspendHunter.mutateAsync();
      console.log("✅ Suspension du chasseur réussie");
      setSuspendConfirm(false);
    } catch (error) {
      console.error("❌ Erreur lors de la suspension du chasseur:", error);
      setSuspendConfirm(false);
      // Le traitement des erreurs est géré dans la mutation
    }
  };

  // Gérer la réactivation d'un chasseur
  const handleReactivate = async () => {
    try {
      console.log("🔓 Démarrage de la réactivation du chasseur:", hunterId);
      await reactivateHunter.mutateAsync();
      console.log("✅ Réactivation du chasseur réussie");
      setReactivateConfirm(false);
    } catch (error) {
      console.error("❌ Erreur lors de la réactivation du chasseur:", error);
      setReactivateConfirm(false);
      // Le traitement des erreurs est géré dans la mutation
    }
  };

  // Gérer le changement de statut mineur
  const handleToggleMinorStatus = () => {
    if (!hunter) return;
    
    console.log(`📈 Changement du statut mineur pour le chasseur ${hunterId}: ${!hunter.isMinor}`);
    toggleMinorStatus.mutate(!hunter.isMinor);
  };

  if (!open) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[90%] md:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center justify-between">
              Détails du Chasseur
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {isLoading && !hunterData ? (
            <div className="flex justify-center py-8">Chargement...</div>
          ) : error && !hunterData ? (
            <div className="text-red-500 text-center py-8">Erreur lors du chargement</div>
          ) : (hunter || hunterData) ? (
            <Tabs defaultValue="details">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Informations</TabsTrigger>
                <TabsTrigger value="permits">Permis ({permits.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details">
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Nom Complet</h3>
                        <p className="text-base font-medium">{hunter?.firstName || hunterData?.firstName || "Non renseigné"} {hunter?.lastName || hunterData?.lastName || ""}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Date de Naissance</h3>
                        <p className="text-base">
                          {(hunter?.dateOfBirth || hunterData?.dateOfBirth) ? format(new Date(hunter?.dateOfBirth || hunterData?.dateOfBirth || ""), "dd MMMM yyyy", { locale: fr }) : "Non renseignée"}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Numéro de Pièce d'Identité</h3>
                        <p className="text-base">{hunter.idNumber || "Non renseigné"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Téléphone</h3>
                        <p className="text-base">{hunter.phone || "Non renseigné"}</p>
                      </div>
                      <div className="md:col-span-2">
                        <h3 className="text-sm font-medium text-gray-500">Adresse</h3>
                        <p className="text-base">{hunter.address || "Non renseignée"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Profession</h3>
                        <p className="text-base">{hunter.profession || "Non renseignée"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Années d'Expérience</h3>
                        <p className="text-base">{hunter.experience !== undefined && hunter.experience !== null ? `${hunter.experience} ans` : "Non renseigné"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Catégorie</h3>
                        <p className="text-base capitalize">{hunter.category || "Non renseignée"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Date d'Enregistrement</h3>
                        <p className="text-base">
                          {hunter.createdAt ? format(new Date(hunter.createdAt), "dd MMMM yyyy", { locale: fr }) : "Non renseignée"}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Statut</h3>
                        <p className={`text-base font-medium ${hunter.isActive ? 'text-green-600' : 'text-red-600'}`}>
                          {hunter.isActive ? 'Actif' : 'Suspendu'}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Âge</h3>
                        <p className="text-base font-medium text-blue-600">
                          {hunter.dateOfBirth ? 
                            `${Math.floor((new Date().getTime() - new Date(hunter.dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365))} ans` : 
                            "Non renseigné"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="permits">
                <Card>
                  <CardContent className="pt-6">
                    {permits.length === 0 ? (
                      <p className="text-center py-4 text-gray-500">Aucun permis trouvé pour ce chasseur</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium text-gray-500">N° Permis</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-500">Type</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-500">Prix</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-500">Date Émission</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-500">Date Expiration</th>
                              <th className="px-3 py-2 text-left font-medium text-gray-500">Statut</th>
                            </tr>
                          </thead>
                          <tbody>
                            {permits.map((permit) => {
                              const isExpired = permit.expiryDate && new Date(permit.expiryDate) < new Date();
                              const status = isExpired ? "Expiré" : permit.status === "active" ? "Actif" : "Suspendu";
                              const statusClass = 
                                status === "Actif" ? "bg-green-100 text-green-800" :
                                status === "Expiré" ? "bg-red-100 text-red-800" : 
                                "bg-orange-100 text-orange-800";
                                
                              return (
                                <tr key={permit.id} className="border-t border-gray-200">
                                  <td className="px-3 py-3 font-medium">{permit.permitNumber}</td>
                                  <td className="px-3 py-3">
                                    {permit.type === "petite-chasse" 
                                      ? "Petite Chasse"
                                      : permit.type === "grande-chasse" 
                                        ? "Grande Chasse" 
                                        : "Gibier d'Eau"}
                                  </td>
                                  <td className="px-3 py-3">
                                    {Number(permit.price).toLocaleString()} FCFA
                                  </td>
                                  <td className="px-3 py-3">
                                    {permit.issueDate ? format(new Date(permit.issueDate), "dd/MM/yyyy") : "Non renseignée"}
                                  </td>
                                  <td className="px-3 py-3">
                                    {permit.expiryDate ? format(new Date(permit.expiryDate), "dd/MM/yyyy") : "Non renseignée"}
                                  </td>
                                  <td className="px-3 py-3">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}>
                                      {status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-8">Chasseur non trouvé</div>
          )}

          {hunter && (
            <DialogFooter className="gap-2 flex-wrap">
              {/* Bouton d'édition */}
              <Button 
                variant="outline" 
                onClick={() => setShowEditForm(true)}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Modifier
              </Button>

              {/* Boutons de suspension/réactivation */}
              {hunter.isActive ? (
                <Button 
                  variant="outline" 
                  onClick={() => setSuspendConfirm(true)}
                  className="gap-2 border-orange-500 text-orange-500 hover:bg-orange-50"
                >
                  <Ban className="h-4 w-4" />
                  Suspendre
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => setReactivateConfirm(true)}
                  className="gap-2 border-green-500 text-green-500 hover:bg-green-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Réactiver
                </Button>
              )}
              
              {/* Bouton pour changer le statut mineur */}
              <Button 
                variant="outline" 
                onClick={handleToggleMinorStatus}
                className={`gap-2 ${hunter.isMinor 
                  ? 'border-blue-500 text-blue-500 hover:bg-blue-50' 
                  : 'border-purple-500 text-purple-500 hover:bg-purple-50'}`}
              >
                {hunter.isMinor ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Marquer comme adulte
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4" />
                    Marquer comme mineur
                  </>
                )}
              </Button>

              {/* Bouton de suppression */}
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteConfirm(true)}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Hunter Form */}
      {showEditForm && hunter && (
        <HunterForm 
          hunterId={hunterId}
          open={showEditForm}
          onClose={() => setShowEditForm(false)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce chasseur ? Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Force Delete Confirmation Dialog (when hunter has active permits) */}
      <AlertDialog open={showForceDeleteConfirm} onOpenChange={setShowForceDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suppression forcée</AlertDialogTitle>
            <AlertDialogDescription>
              Ce chasseur possède des permis actifs. La suppression forcée supprimera le chasseur et tous ses permis associés. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForceDelete}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? "Suppression..." : "Supprimer définitivement"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend Confirmation Dialog */}
      <AlertDialog open={suspendConfirm} onOpenChange={setSuspendConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suspension</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir suspendre ce chasseur ? Le chasseur ne pourra plus se connecter au système mais ses permis resteront actifs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={suspendLoading}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSuspend}
              disabled={suspendLoading}
              className="bg-orange-500 text-white hover:bg-orange-600"
            >
              {suspendLoading ? "Suspension..." : "Suspendre"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reactivate Confirmation Dialog */}
      <AlertDialog open={reactivateConfirm} onOpenChange={setReactivateConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la réactivation</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir réactiver ce chasseur ? Le chasseur pourra à nouveau se connecter au système.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reactivateLoading}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReactivate}
              disabled={reactivateLoading}
              className="bg-green-500 text-white hover:bg-green-600"
            >
              {reactivateLoading ? "Réactivation..." : "Réactiver"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
