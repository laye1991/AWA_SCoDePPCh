import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Printer, FileText, Repeat, Ban, Trash, MailQuestion } from "lucide-react";
import { format, addYears } from "date-fns";
import { fr } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Hunter, Permit } from "@shared/schema";
import { usePermissions } from "@/lib/hooks/usePermissions";
import QRCode from "qrcode";
import PermitCard from "./PermitCard";

interface PermitDetailsProps {
  permitId: number;
  open: boolean;
  onClose: () => void;
}

export default function PermitDetails({ permitId, open, onClose }: PermitDetailsProps) {
  const { toast } = useToast();
  const [permit, setPermit] = useState<Permit | null>(null);
  const [hunter, setHunter] = useState<Hunter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRenewConfirm, setShowRenewConfirm] = useState(false);
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);
  const [isSuspending, setIsSuspending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    if (open && permitId) {
      const fetchPermitData = async () => {
        setLoading(true);
        try {
          const permitRes = await fetch(`/api/permits/${permitId}`);
          if (!permitRes.ok) throw new Error("Failed to fetch permit");
          const permitData = await permitRes.json();
          setPermit(permitData);
          
          const hunterRes = await fetch(`/api/hunters/${permitData.hunterId}`);
          if (!hunterRes.ok) throw new Error("Failed to fetch hunter");
          const hunterData = await hunterRes.json();
          setHunter(hunterData);
          
          // Générer le code QR avec les informations du chasseur
          if (hunterData && permitData) {
            // Format les données du QR de manière plus lisible (une information par ligne)
            const qrData = 
              `N° Permis: ${permitData.permitNumber}\n` +
              `Nom: ${hunterData.lastName}\n` +
              `Prénom: ${hunterData.firstName}\n` +
              `Téléphone: ${hunterData.phone}\n` +
              `N° Pièce d'identité: ${hunterData.idNumber}\n` +
              `Type de Permis: ${permitData.type}\n` +
              `Catégorie: ${permitData.categoryId || 'Non définie'}\n` + 
              `Montant: ${Number(permitData.price).toLocaleString()} FCFA\n` +
              `Date d'émission: ${format(new Date(permitData.issueDate), "dd/MM/yyyy")}\n` +
              `Date d'expiration: ${format(new Date(permitData.expiryDate), "dd/MM/yyyy")}\n` +
              `Statut: ${permitData.status === 'active' ? 'Actif' : 
                       permitData.status === 'suspended' ? 'Suspendu' : 'Expiré'}`;
            
            try {
              const qrDataUrl = await QRCode.toDataURL(qrData);
              setQrCodeUrl(qrDataUrl);
            } catch (qrErr) {
              console.error("Erreur lors de la génération du QR code:", qrErr);
            }
          }
          
          setError(null);
        } catch (err) {
          setError("Error loading permit details");
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      
      fetchPermitData();
    }
  }, [permitId, open]);
  
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await apiRequest(
        "DELETE", 
        `/api/permits/${permitId}`, 
        undefined
      );
      
      if (response) {
        queryClient.invalidateQueries({ queryKey: ["/api/permits"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        
        toast({
          title: "Permis supprimé",
          description: "Le permis a été supprimé avec succès.",
        });
        
        onClose();
      }
    } catch (error) {
      console.error("Error deleting permit:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le permis.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleRenew = async () => {
    setIsRenewing(true);
    try {
      // Calculate new expiry date (1 year from current expiry)
      const currentExpiry = new Date(permit!.expiryDate);
      const newExpiry = addYears(currentExpiry, 1);
      
      const response = await apiRequest(
        "PATCH", 
        `/api/permits/${permitId}/renew`, 
        { expiryDate: newExpiry.toISOString().split('T')[0] }
      );
      
      if (response) {
        setPermit(response as any);
        
        queryClient.invalidateQueries({ queryKey: ["/api/permits"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        
        toast({
          title: "Permis renouvelé",
          description: `Le permis a été renouvelé jusqu'au ${format(newExpiry, "dd MMMM yyyy", { locale: fr })}.`,
        });
      }
    } catch (error) {
      console.error("Error renewing permit:", error);
      toast({
        title: "Erreur",
        description: "Impossible de renouveler le permis.",
        variant: "destructive",
      });
    } finally {
      setIsRenewing(false);
      setShowRenewConfirm(false);
    }
  };

  const handleSuspend = async () => {
    setIsSuspending(true);
    try {
      console.log("Tentative de suspension du permis ID:", permitId);
      const response = await apiRequest(
        "PATCH", 
        `/api/permits/${permitId}/suspend`, 
        undefined
      );
      
      if (response) {
        console.log("Réponse de l'API de suspension:", response);
        setPermit(response);
        
        queryClient.invalidateQueries({ queryKey: ["/api/permits"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        
        toast({
          title: "Permis suspendu",
          description: "Le permis a été suspendu avec succès.",
        });
      }
    } catch (error) {
      console.error("Error suspending permit:", error);
      toast({
        title: "Erreur",
        description: "Impossible de suspendre le permis. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSuspending(false);
      setShowSuspendConfirm(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!open) return null;

  const isExpired = permit && new Date(permit.expiryDate) < new Date();
  const isSuspended = permit && permit.status === "suspended";

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[90%] md:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center justify-between">
              Détails du Permis
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4 no-print"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {/* Suppression de l'en-tête comme demandé */}

          {loading ? (
            <div className="flex justify-center py-8">Chargement...</div>
          ) : error ? (
            <div className="text-red-500 text-center py-8">{error}</div>
          ) : permit && hunter ? (
            <div>
              {/* Version détaillée pour l'écran (non imprimable) */}
              <div className="hidden-print mb-6">
                <Card className="printable-table">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="space-y-3">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Numéro de Permis</h3>
                            <p className="text-base font-bold">{permit.permitNumber}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Nom Complet</h3>
                            <p className="text-base">{hunter.firstName} {hunter.lastName}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Catégorie du Chasseur</h3>
                            <p className="text-base capitalize">{hunter.category}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Type de Permis</h3>
                            <p className="text-base capitalize">
                              {permit.type === 'petite-chasse' ? 'Petite Chasse' : 
                               permit.type === 'grande-chasse' ? 'Grande Chasse' : 
                               permit.type === 'gibier-eau' ? 'Gibier d\'Eau' : 
                               permit.type}
                            </p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">N° Pièce d'Identité</h3>
                            <p className="text-base">{hunter.idNumber}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Date d'Émission</h3>
                            <p className="text-base">{format(new Date(permit.issueDate), "dd/MM/yyyy")}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Date d'Expiration</h3>
                            <p className={`text-base ${isExpired ? "text-red-600 font-bold" : ""}`}>
                              {format(new Date(permit.expiryDate), "dd/MM/yyyy")}
                            </p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Statut</h3>
                            <p 
                              className={`text-base ${
                                isSuspended 
                                  ? "text-orange-600 font-bold"
                                  : isExpired 
                                    ? "text-red-600 font-bold" 
                                    : "text-green-600 font-bold"
                              }`}
                            >
                              {isSuspended ? "Suspendu" : (isExpired ? "Expiré" : "Actif")}
                            </p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Prix</h3>
                            <p className="text-base">{Number(permit.price).toLocaleString()} FCFA</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-center justify-center border-l border-gray-200 pl-6">
                        <div className="mb-4">
                          <div className="w-32 h-32 bg-gray-200 rounded-full mb-2 mx-auto flex items-center justify-center">
                            <User className="h-16 w-16 text-gray-400" />
                          </div>
                          <p className="text-center text-sm text-gray-500">Photo du chasseur</p>
                        </div>
                        {/* QR Code Réactivé comme demandé */}
                        {qrCodeUrl && (
                          <div className="mt-4">
                            <img 
                              src={qrCodeUrl} 
                              alt="QR Code" 
                              className="w-32 h-32 mx-auto" 
                            />
                            <p className="text-center text-sm text-gray-500 mt-2">QR Code d'identification</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Version carte pour impression */}
              <div className="print-only">
                <PermitCard permit={permit} hunter={hunter} />
              </div>
            </div>
          ) : (
            <div className="text-center py-8">Permis non trouvé</div>
          )}

          {permit && hunter && (
            <DialogFooter className="gap-2 no-print">
              {/* Bouton d'impression - accessible à tous */}
              <Button 
                variant="outline" 
                onClick={handlePrint}
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                Imprimer
              </Button>
              
              {/* Utilisation du hook de permissions */}
              {(() => {
                const permissions = usePermissions();
                
                return (
                  <>
                    {/* Bouton renouveler */}
                    {permissions.canEditPermit && (
                      <Button 
                        variant="outline" 
                        onClick={() => setShowRenewConfirm(true)}
                        className="gap-2"
                        disabled={isSuspended ? true : false}
                      >
                        <Repeat className="h-4 w-4" />
                        Renouveler
                      </Button>
                    )}
                    
                    {/* Bouton suspendre */}
                    {permissions.canSuspendPermit && !isSuspended && (
                      <Button 
                        variant="default"
                        onClick={() => setShowSuspendConfirm(true)}
                        className="gap-2"
                      >
                        <Ban className="h-4 w-4" />
                        Suspendre
                      </Button>
                    )}
                    
                    {/* Bouton supprimer - administrateur seulement */}
                    {permissions.canDeletePermit ? (
                      <Button 
                        variant="destructive"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="gap-2"
                      >
                        <Trash className="h-4 w-4" />
                        Supprimer
                      </Button>
                    ) : permissions.canSuspendPermit && (
                      <Button 
                        variant="outline"
                        className="gap-2 border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => {
                          toast({
                            title: "Information",
                            description: "Seul un administrateur peut supprimer un permis.",
                          });
                        }}
                      >
                        <MailQuestion className="h-4 w-4" />
                        Demander suppression
                      </Button>
                    )}
                  </>
                );
              })()}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Renew Confirmation Dialog */}
      <Dialog open={showRenewConfirm ? true : false} onOpenChange={(open) => setShowRenewConfirm(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renouveler le Permis</DialogTitle>
          </DialogHeader>
          <p>Voulez-vous renouveler ce permis pour une année supplémentaire ?</p>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowRenewConfirm(false)}
              disabled={isRenewing}
            >
              Annuler
            </Button>
            <Button 
              variant="default" 
              onClick={handleRenew}
              disabled={isRenewing}
            >
              {isRenewing ? "Renouvellement..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Confirmation Dialog */}
      <Dialog open={showSuspendConfirm ? true : false} onOpenChange={(open) => setShowSuspendConfirm(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspendre le Permis</DialogTitle>
          </DialogHeader>
          <p>Êtes-vous sûr de vouloir suspendre ce permis ? Le chasseur ne pourra plus l'utiliser.</p>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowSuspendConfirm(false)}
              disabled={isSuspending}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleSuspend}
              disabled={isSuspending}
            >
              {isSuspending ? "Suspension..." : "Suspendre"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm ? true : false} onOpenChange={(open) => setShowDeleteConfirm(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le Permis</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer définitivement ce permis ? Cette action est irréversible.
          </DialogDescription>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Import this component later for proper TypeScript definition
function User(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className} style={props.style}>
      <circle cx="12" cy="8" r="5" />
      <path d="M20 21a8 8 0 1 0-16 0" />
    </svg>
  );
}
