import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash, FileDown, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSuspendedPermits } from "@/lib/hooks/usePermits";
import { useHunters } from "@/lib/hooks/useHunters";
import { usePermitDetails } from "@/lib/hooks/usePermits";
import PermitDetails from "@/components/permits/PermitDetails";
import { Spinner } from "@/components/ui/spinner";
import { format } from "date-fns";
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
import { PdfLibraryLoader, generatePdf } from "@/utils/pdfGenerator";
import { useAuth } from "@/contexts/AuthContext";

export default function SuspendedPermits() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPermitId, setSelectedPermitId] = useState<number | null>(null);
  const [selectedPermits, setSelectedPermits] = useState<number[]>([]);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [showDeleteSelectedDialog, setShowDeleteSelectedDialog] = useState(false);

  const {
    permits,
    isLoading: permitsLoading,
    error: permitsError,
    deletePermitMutation,
    deleteAllSuspendedPermitsMutation,
    deleteBatchPermitsMutation
  } = useSuspendedPermits();
  
  const { hunters, isLoading: huntersLoading, error: huntersError } = useHunters();

  const isLoading = permitsLoading || huntersLoading;
  const error = permitsError || huntersError;

  const filteredPermits = permits?.filter(permit => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      permit.permitNumber.toLowerCase().includes(searchLower) || 
      getHunterName(permit.hunterId).toLowerCase().includes(searchLower);
    return matchesSearch;
  });

  const handleDeletePermit = (permitId: number) => {
    deletePermitMutation.mutate(permitId);
  };

  const handleDeleteAllPermits = () => {
    deleteAllSuspendedPermitsMutation.mutate();
    setShowDeleteAllDialog(false);
  };

  const handleDeleteSelectedPermits = () => {
    if (selectedPermits.length > 0) {
      deleteBatchPermitsMutation.mutate(selectedPermits);
      setSelectedPermits([]);
      setShowDeleteSelectedDialog(false);
    }
  };

  const togglePermitSelection = (permitId: number) => {
    setSelectedPermits(prev => {
      if (prev.includes(permitId)) {
        return prev.filter(id => id !== permitId);
      } else {
        return [...prev, permitId];
      }
    });
  };

  const handleSelectAll = () => {
    if (filteredPermits) {
      if (selectedPermits.length === filteredPermits.length) {
        setSelectedPermits([]);
      } else {
        setSelectedPermits(filteredPermits.map(permit => permit.id));
      }
    }
  };

  const handleExportPdf = () => {
    if (!filteredPermits || !hunters) {
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF. Données manquantes.",
        variant: "destructive",
      });
      return;
    }
    
    // Préparer les données pour le PDF
    const tableColumns = ['N° Permis', 'Chasseur', 'Type', 'Date Expiration', 'Prix'];
    const tableData = filteredPermits.map(permit => [
      permit.permitNumber,
      getHunterName(permit.hunterId),
      permit.type === "petite-chasse" 
        ? (permit.categoryId?.includes("coutumier") ? "Coutumier" : "Petite Chasse") 
        : permit.type === "grande-chasse" 
          ? "Grande Chasse" 
          : "Gibier d'Eau",
      format(new Date(permit.expiryDate), "dd/MM/yyyy"),
      `${Number(permit.price).toLocaleString()} FCFA`
    ]);
    
    // Générer le PDF
    generatePdf({
      title: 'Liste des Permis Suspendus',
      filename: `permis-suspendus-${format(new Date(), "yyyy-MM-dd")}.pdf`,
      tableColumns,
      tableData,
      additionalContent: (doc) => {
        doc.setFontSize(10);
        doc.text('Direction des Eaux et Forêts - République du Sénégal', 14, doc.autoTable.previous.finalY + 10);
        doc.text(`Généré par: ${localStorage.getItem('username') || 'Utilisateur'} - ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, doc.autoTable.previous.finalY + 16);
      },
    });
    
    toast({
      title: "Succès",
      description: "Le PDF a été généré avec succès.",
    });
  };

  const getHunterName = (hunterId: number) => {
    if (!hunters) return "Chargement...";
    const hunter = hunters.find(h => h.id === hunterId);
    return hunter ? `${hunter.firstName} ${hunter.lastName}` : `ID: ${hunterId}`;
  };

  const isAllSelected = filteredPermits && selectedPermits.length === filteredPermits.length && filteredPermits.length > 0;

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <h1 className="text-2xl font-bold text-neutral-800 mb-4 md:mb-0">Gestion des Permis Suspendus</h1>
          <div className="space-x-2">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteSelectedDialog(true)}
              disabled={selectedPermits.length === 0}
              className="flex items-center gap-2"
            >
              <Trash className="h-4 w-4" />
              Supprimer Sélectionnés ({selectedPermits.length})
            </Button>
            

          </div>
        </div>

        <Card className="border border-gray-200">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 items-center">
              <div className="w-full sm:w-2/3 px-2">
                <div className="relative">
                  <Input 
                    type="text" 
                    placeholder="Rechercher par numéro de permis ou nom de chasseur..." 
                    className="pl-4"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-full sm:w-1/3 px-2 flex space-x-2">
                <PdfLibraryLoader fallback={
                  <Button
                    variant="outline"
                    className="w-1/2 flex items-center gap-2"
                    disabled
                  >
                    <FileDown className="h-4 w-4" />
                    PDF
                  </Button>
                }>
                  <Button
                    variant="outline"
                    className="w-1/2 flex items-center gap-2"
                    onClick={handleExportPdf}
                    disabled={!filteredPermits || filteredPermits.length === 0}
                  >
                    <FileDown className="h-4 w-4" />
                    PDF
                  </Button>
                </PdfLibraryLoader>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">
                <Spinner className="mx-auto" />
                <p className="mt-2">Chargement des permis suspendus...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">Erreur: Impossible de charger les permis suspendus</div>
            ) : filteredPermits && filteredPermits.length > 0 ? (
              <div className="overflow-x-auto rounded-lg print:overflow-visible">
                <table className="min-w-full divide-y divide-gray-200 table-auto">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <Checkbox 
                            id="select-all" 
                            checked={isAllSelected}
                            onCheckedChange={handleSelectAll}
                          />
                        </div>
                      </th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Permis</th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chasseur</th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Expiration</th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
                      <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPermits.map((permit) => (
                      <tr key={permit.id} className="bg-orange-50 hover:bg-orange-100 transition-colors duration-150">
                        <td className="px-3 py-2 whitespace-nowrap">
                          <Checkbox 
                            id={`select-${permit.id}`} 
                            checked={selectedPermits.includes(permit.id)}
                            onCheckedChange={() => togglePermitSelection(permit.id)}
                          />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">{permit.permitNumber}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{getHunterName(permit.hunterId)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          {permit.type === "petite-chasse" 
                            ? (permit.categoryId?.includes("coutumier") ? "Coutumier" : "Petite Chasse") 
                            : permit.type === "grande-chasse" 
                              ? "Grande Chasse" 
                              : "Gibier d'Eau"}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          {format(new Date(permit.expiryDate), "dd/MM/yyyy")}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          {Number(permit.price).toLocaleString()} FCFA
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs">
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setSelectedPermitId(permit.id)}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            >
                              Détails
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeletePermit(permit.id)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              Supprimer
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <AlertTriangle className="h-12 w-12 mx-auto text-orange-500 mb-2" />
                <p>Aucun permis suspendu trouvé</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Permit Details Modal */}
      {selectedPermitId && (
        <PermitDetails 
          permitId={selectedPermitId} 
          open={!!selectedPermitId}
          onClose={() => setSelectedPermitId(null)}
        />
      )}

      {/* Delete All Confirmation Dialog */}
      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer tous les permis suspendus</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer tous les permis suspendus ? Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAllPermits} className="bg-red-500 hover:bg-red-600">
              Supprimer tous
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Selected Confirmation Dialog */}
      <AlertDialog open={showDeleteSelectedDialog} onOpenChange={setShowDeleteSelectedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer les permis sélectionnés</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer les {selectedPermits.length} permis sélectionnés ? Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSelectedPermits} className="bg-red-500 hover:bg-red-600">
              Supprimer sélectionnés
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
