import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const filteredPermits = permits ? permits.filter((permit: any) => {
    return searchTerm 
      ? permit.permitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (hunters ? hunters.find((h: any) => h.id === permit.hunterId)?.lastName || '' : '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (hunters ? hunters.find((h: any) => h.id === permit.hunterId)?.firstName || '' : '').toLowerCase().includes(searchTerm.toLowerCase())
      : true;
  }) : [];

  const handlePrint = () => {
    window.print();
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
    const tableColumns = ['N° Permis', 'Titulaire', 'Type', 'Date d\'expiration', 'Prix', 'Statut'];
    const tableData = filteredPermits.map((permit: any) => [
      permit.permitNumber,
      getHunterName(permit.hunterId),
      permit.type === "petite-chasse" 
        ? "petite-chasse" 
        : permit.type === "grande-chasse" 
          ? "grande-chasse" 
          : "gibier-eau",
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
      return "bg-orange-400 text-white";
    } else if (isPermitExpired(permit)) {
      return "bg-red-500 text-white";
    } else {
      return "bg-green-500 text-white";
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
    const hunter = hunters.find((h: any) => h.id === hunterId);
    return hunter ? `${hunter.firstName} ${hunter.lastName}` : `ID: ${hunterId}`;
  };

  return (
    <>
      <h2 className="text-2xl font-bold mb-4">Gestion des Permis</h2>

      {/* Search and Filters */}
      <div className="flex justify-between mb-4">
        <div className="flex space-x-2 items-center">
          <a href="/suspended-permits" className="flex items-center text-orange-500 bg-orange-50 px-3 py-2 rounded-md hover:bg-orange-100 transition-colors">
            <span className="material-icons text-sm mr-1">warning</span> Voir les permis suspendus
          </a>
        </div>
        <div className="flex space-x-2">
          <div className="relative">
            <span className="material-icons absolute left-2 top-2 text-gray-500">search</span>
            <Input 
              type="text" 
              placeholder="Rechercher par numéro de permis ou titulaire..." 
              className="pl-8 p-2 border rounded w-96"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button className="border border-blue-500 text-blue-500 px-3 py-2 rounded flex items-center" variant="outline">
            <span className="material-icons text-sm mr-1">filter_list</span> Filtres
          </Button>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => setShowAddForm(true)} 
            className="bg-blue-500 text-white px-3 py-2 rounded flex items-center"
          >
            <span className="material-icons text-sm mr-1">add</span> Ajouter un Permis
          </Button>
          
          <Button
            variant="outline"
            className="border border-blue-500 text-blue-500 px-3 py-2 rounded flex items-center"
            onClick={handlePrint}
          >
            <span className="material-icons text-sm mr-1">print</span> Imprimer
          </Button>
          
          <PdfLibraryLoader fallback={
            <Button
              variant="outline"
              className="border border-blue-500 text-blue-500 px-3 py-2 rounded flex items-center"
              disabled
            >
              <span className="material-icons text-sm mr-1">picture_as_pdf</span> PDF
            </Button>
          }>
            <Button
              variant="outline"
              className="border border-blue-500 text-blue-500 px-3 py-2 rounded flex items-center"
              onClick={handleExportPdf}
            >
              <span className="material-icons text-sm mr-1">picture_as_pdf</span> PDF
            </Button>
          </PdfLibraryLoader>
          
          <Button
            variant="outline"
            className="border border-blue-500 text-blue-500 px-3 py-2 rounded flex items-center"
          >
            <span className="material-icons text-sm mr-1">download</span> Exporter
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center">Chargement des permis...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">Erreur: Impossible de charger les permis</div>
        ) : filteredPermits && filteredPermits.length > 0 ? (
          <>
            <table className="w-full">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-3 text-left"><input type="checkbox" /></th>
                  <th className="p-3 text-left">N° Permis</th>
                  <th className="p-3 text-left">Titulaire</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Date d'expiration</th>
                  <th className="p-3 text-left">Prix</th>
                  <th className="p-3 text-left">Statut</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPermits.map((permit: any) => (
                  <tr key={permit.id} className="table-row">
                    <td className="p-3"><input type="checkbox" /></td>
                    <td className="p-3">{permit.permitNumber}</td>
                    <td className="p-3">{getHunterName(permit.hunterId)}</td>
                    <td className="p-3">
                      {permit.type === "petite-chasse" 
                        ? "petite-chasse" 
                        : permit.type === "grande-chasse" 
                          ? "grande-chasse" 
                          : "gibier-eau"}
                    </td>
                    <td className="p-3">{format(new Date(permit.expiryDate), "dd/MM/yyyy")}</td>
                    <td className="p-3">{Number(permit.price).toLocaleString()} FCFA</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded ${getStatusClass(permit)}`}>
                        {getStatusText(permit)}
                      </span>
                    </td>
                    <td className="p-3">
                      <button onClick={() => viewPermitDetails(permit.id)} className="text-blue-500">
                        <span className="material-icons">visibility</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination */}
            <div className="flex justify-between items-center mt-4 p-3">
              <p className="text-gray-600">Affichage de 1 à {filteredPermits.length} sur {filteredPermits.length} permis</p>
              <div className="space-x-2">
                <button className="bg-gray-300 text-gray-700 px-3 py-1 rounded" disabled>Précédent</button>
                <button className="bg-blue-500 text-white px-3 py-1 rounded">Suivant</button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-gray-500">Aucun permis trouvé</div>
        )}
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

      {/* Modal */}
      <style dangerouslySetInnerHTML={{ __html: `
        .table-row:nth-child(even) {
          background-color: #F9F9F9;
        }
        .table-row:hover {
          background-color: #E3F2FD;
        }
      `}} />
    </>
  );
}