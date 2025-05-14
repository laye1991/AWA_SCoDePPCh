import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Printer, Search, FileText, Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTaxes } from "@/lib/hooks/useTaxes";
import TaxForm from "@/components/taxes/TaxForm";
import { format } from "date-fns";

export default function Taxes() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  
  const { taxes, isLoading, error } = useTaxes();

  const filteredTaxes = taxes?.filter(tax => {
    const searchLower = searchTerm.toLowerCase();
    return (
      tax.taxNumber.toLowerCase().includes(searchLower) ||
      tax.location.toLowerCase().includes(searchLower) ||
      tax.animalType.toLowerCase().includes(searchLower)
    );
  });

  const handleSearch = () => {
    // Client-side filtering is already happening with the state change
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <h1 className="text-2xl font-bold text-neutral-800 mb-4 md:mb-0">Gestion des Taxes d'Abattage</h1>
          <Button 
            onClick={() => setShowAddForm(true)} 
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Ajouter une Taxe
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
                    placeholder="Rechercher par numéro de taxe, lieu, type d'animal..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-full sm:w-1/3 px-2 flex space-x-2">
                <Button
                  variant="default"
                  className="w-1/2"
                  onClick={handleSearch}
                >
                  Rechercher
                </Button>
                <Button
                  variant="outline"
                  className="w-1/2 flex items-center gap-2"
                  onClick={handlePrint}
                >
                  <Printer className="h-4 w-4" />
                  Imprimer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">Chargement des taxes...</div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">Erreur: Impossible de charger les taxes</div>
            ) : filteredTaxes && filteredTaxes.length > 0 ? (
              <div className="overflow-x-auto rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Taxe</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chasseur ID</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permis ID</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Animal</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lieu</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTaxes.map((tax) => (
                      <tr key={tax.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tax.taxNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tax.hunterId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tax.permitId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(tax.issueDate), "dd/MM/yyyy")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{tax.animalType}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tax.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tax.location}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="flex items-center">{Number(tax.amount).toLocaleString()} <Coins className="ml-1 h-3 w-3 text-yellow-500" /> FCFA</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">Aucune taxe d'abattage trouvée</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Tax Form Modal */}
      {showAddForm && (
        <TaxForm 
          open={showAddForm} 
          onClose={() => setShowAddForm(false)} 
        />
      )}
    </>
  );
}
