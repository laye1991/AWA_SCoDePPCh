import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Printer, Search, FileBox, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePermits } from "@/lib/hooks/usePermits";
import { useHunters } from "@/lib/hooks/useHunters";
import PermitForm from "@/components/permits/PermitForm";
import PermitDetails from "@/components/permits/PermitDetails";
import { isPermitActive, isPermitExpired, isPermitSuspended } from "@/lib/utils/permits";
import { format } from "date-fns";
import { PdfLibraryLoader, generatePdf } from "@/utils/pdfGenerator";

export default function Permits() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPermitId, setSelectedPermitId] = useState<number | null>(null);

  const { permits, isLoading: permitsLoading, error: permitsError } = usePermits();
  const { hunters, isLoading: huntersLoading, error: huntersError } = useHunters();

  const isLoading = permitsLoading || huntersLoading;
  const error = permitsError || huntersError;

  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const filterType = searchParams?.get('filter');

  const filteredPermits = permits?.filter(permit => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = permit.permitNumber.toLowerCase().includes(searchLower);

    if (filterType === 'expired') {
      return matchesSearch && isPermitExpired(permit);
    }

    return matchesSearch;
  });

  const handleSearch = () => {
    // Client-side filtering is already happening with the state change
  };

  const handlePrint = () => {
    // Ajouter une feuille de style temporaire pour l'impression qui cache tout sauf le tableau
    const style = document.createElement('style');
    style.id = 'print-style-permits';
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        .overflow-x-auto, .overflow-x-auto * {
          visibility: visible;
        }
        .print\\:hidden {
          display: none !important;
        }
        .overflow-x-auto {
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
      const printStyle = document.getElementById('print-style-permits');
      if (printStyle) printStyle.remove();
    }, 1000);
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
    const tableColumns = ['N° Permis', 'Chasseur', 'Type', 'Date Expiration', 'Prix', 'Statut'];
    const tableData = filteredPermits.map(permit => [
      permit.permitNumber,
      getHunterName(permit.hunterId),
      permit.type === "petite-chasse" 
        ? (permit.categoryId?.includes("coutumier") ? "Coutumier" : "Petite Chasse") 
        : permit.type === "grande-chasse" 
          ? "Grande Chasse" 
          : "Gibier d'Eau",
      format(new Date(permit.expiryDate), "dd/MM/yyyy"),
      `${Number(permit.price).toLocaleString()} FCFA`,
      getStatusText(permit)
    ]);
    
    // Générer le PDF
    generatePdf({
      title: 'Liste des Permis de Chasse',
      filename: `permis-chasse-${format(new Date(), "yyyy-MM-dd")}.pdf`,
      tableColumns,
      tableData,
      additionalContent: (doc) => {
        // Ajouter du contenu personnalisé
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

  const viewPermitDetails = (permitId: number) => {
    setSelectedPermitId(permitId);
  };

  const getStatusClass = (permit: any) => {
    if (isPermitSuspended(permit)) {
      return "bg-orange-100 text-orange-800";
    } else if (isPermitExpired(permit)) {
      return "bg-red-100 text-red-800";
    } else {
      return "bg-green-100 text-green-800";
    }
  };

  const getStatusText = (permit: any) => {
    if (isPermitSuspended(permit)) {
      return "Suspendu";
    } else if (isPermitExpired(permit)) {
      return "Expiré";
    } else {
      return "Actif";
    }
  };

  const getHunterName = (hunterId: number) => {
    if (!hunters) return "Chargement...";
    const hunter = hunters.find(h => h.id === hunterId);
    return hunter ? `${hunter.firstName} ${hunter.lastName}` : `ID: ${hunterId}`;
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <h1 className="text-2xl font-bold text-neutral-800 mb-4 md:mb-0">Gestion des Permis</h1>
          <Button 
            onClick={() => setShowAddForm(true)} 
            className="flex items-center gap-2"
          >
            <FileBox className="h-4 w-4" />
            Ajouter un Permis
          </Button>
        </div>

        <Card className="border border-gray-200">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 items-center">
              <div className="w-full sm:w-2/3 px-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input 
                    type="text" 
                    placeholder="Rechercher par numéro de permis..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-full sm:w-1/3 px-2 flex space-x-2">
                <Button
                  variant="default"
                  className="w-1/3"
                  onClick={handleSearch}
                >
                  Rechercher
                </Button>
                <Button
                  variant="outline"
                  className="w-1/3 flex items-center gap-2"
                  onClick={handlePrint}
                >
                  <Printer className="h-4 w-4" />
                  Imprimer
                </Button>
                <PdfLibraryLoader fallback={
                  <Button
                    variant="outline"
                    className="w-1/3 flex items-center gap-2"
                    disabled
                  >
                    <FileDown className="h-4 w-4" />
                    PDF
                  </Button>
                }>
                  <Button
                    variant="outline"
                    className="w-1/3 flex items-center gap-2"
                    onClick={handleExportPdf}
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
              <div className="p-8 text-center">Chargement des permis...</div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">Erreur: Impossible de charger les permis</div>
            ) : filteredPermits && filteredPermits.length > 0 ? (
              <div className="overflow-x-auto rounded-lg print:overflow-visible">
                <table className="min-w-full divide-y divide-gray-200 table-auto">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Permis</th>
                      <th scope="col" className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chasseur</th>
                      <th scope="col" className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th scope="col" className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Expiration</th>
                      <th scope="col" className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
                      <th scope="col" className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                      <th scope="col" className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:hidden">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPermits.map((permit) => (
                      <tr key={permit.id}>
                        <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm font-medium text-gray-900">{permit.permitNumber}</td>
                        <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500">{getHunterName(permit.hunterId)}</td>
                        <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500">
                          {permit.type === "petite-chasse" 
                            ? (permit.categoryId?.includes("coutumier") ? "Coutumier" : "Petite Chasse") 
                            : permit.type === "grande-chasse" 
                              ? "Grande Chasse" 
                              : "Gibier d'Eau"}
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500">
                          {format(new Date(permit.expiryDate), "dd/MM/yyyy")}
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500">
                          {Number(permit.price).toLocaleString()} FCFA
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(permit)}`}>
                            {getStatusText(permit)}
                          </span>
                        </td>
                        <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-500 print:hidden">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => viewPermitDetails(permit.id)}
                            className="text-primary-700 hover:text-primary-900"
                          >
                            Détails
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">Aucun permis trouvé</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Permit Form Modal */}
      {showAddForm && (
        <PermitForm 
          open={showAddForm} 
          onClose={() => setShowAddForm(false)} 
        />
      )}

      {/* Permit Details Modal */}
      {selectedPermitId && (
        <PermitDetails 
          permitId={selectedPermitId} 
          open={!!selectedPermitId}
          onClose={() => setSelectedPermitId(null)}
        />
      )}
    </>
  );
}