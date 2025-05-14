import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Printer, Search, FileBox, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePermits, usePermitsByZone } from "@/lib/hooks/usePermits";
import { useHunters, useHuntersByZone } from "@/lib/hooks/useHunters";
import PermitForm from "@/components/permits/PermitForm";
import PermitDetails from "@/components/permits/PermitDetails";
import { isPermitActive, isPermitExpired, isPermitSuspended } from "@/lib/utils/permits";
import { format } from "date-fns";
import { PdfLibraryLoader, generatePdf } from "@/utils/pdfGenerator";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

// Type pour les permis (ajustez selon votre schema)
interface Permit {
  id: number;
  permitNumber: string;
  hunterId: number;
  issueDate: string;
  expiryDate: string;
  status: string;
  price: number;
  type?: string;
  area?: string;
  zone?: string;
}

// Type pour les chasseurs
interface Hunter {
  id: number;
  firstName: string;
  lastName: string;
  idNumber: string;
}

export default function SectorPermits() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPermitId, setSelectedPermitId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("sector");
  const [location, navigate] = useLocation();
  
  // Vérifier si un onglet spécifique est demandé via l'URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.split("?")[1]);
    const tab = searchParams.get("tab");
    if (tab === "all") {
      setActiveTab("all");
    }
  }, [location]);

  const { permits: allPermits, isLoading: allPermitsLoading, error: allPermitsError } = usePermits();
  const { permits: sectorPermits, isLoading: sectorPermitsLoading, error: sectorPermitsError } = usePermitsByZone(user?.zone);
  const { hunters, isLoading: huntersLoading, error: huntersError } = useHunters();
  const { hunters: zoneHunters, isLoading: zoneHuntersLoading } = useHuntersByZone(user?.zone);

  const isLoading = (activeTab === "sector" ? sectorPermitsLoading : allPermitsLoading) || huntersLoading;
  const error = (activeTab === "sector" ? sectorPermitsError : allPermitsError) || huntersError;

  // Filtrer les permis en fonction de la recherche et de l'onglet actif
  const filteredPermits = useMemo(() => {
    const permitsToFilter = activeTab === "sector" ? sectorPermits : allPermits || [];
    
    if (!searchTerm) return permitsToFilter;
    
    const searchLower = searchTerm.toLowerCase();
    return permitsToFilter.filter(permit => {
      const hunter = hunters?.find(h => h.id === permit.hunterId);
      return (
        permit.permitNumber.toLowerCase().includes(searchLower) ||
        hunter?.firstName?.toLowerCase().includes(searchLower) ||
        hunter?.lastName?.toLowerCase().includes(searchLower) ||
        hunter?.idNumber?.toLowerCase().includes(searchLower)
      );
    });
  }, [activeTab, sectorPermits, allPermits, searchTerm, hunters]);

  // Compter les différents types de permis
  const permitCounts = useMemo(() => {
    const permitsToCount = activeTab === "sector" ? sectorPermits : allPermits || [];
    return {
      active: permitsToCount.filter(isPermitActive).length,
      expired: permitsToCount.filter(isPermitExpired).length,
      suspended: permitsToCount.filter(isPermitSuspended).length,
      total: permitsToCount.length
    };
  }, [activeTab, sectorPermits, allPermits]);

  // Générer un PDF des permis
  const exportPermitsList = () => {
    toast({
      title: "Export en cours",
      description: "La liste des permis est en cours d'exportation au format PDF.",
    });
    
    const permitsList = filteredPermits.map(permit => {
      const hunter = hunters?.find(h => h.id === permit.hunterId);
      return {
        'Numéro': permit.permitNumber,
        'Titulaire': hunter ? `${hunter.firstName} ${hunter.lastName}` : 'Inconnu',
        'Date émission': format(new Date(permit.issueDate), 'dd/MM/yyyy'),
        'Date expiration': format(new Date(permit.expiryDate), 'dd/MM/yyyy'),
        'Statut': permit.status,
        'Type': permit.type || '-',
        'Zone': permit.zone || '-'
      };
    });

    PdfLibraryLoader().then(() => {
      generatePdf({
        title: activeTab === "sector" ? "Permis de Chasse - Secteur" : "Permis de Chasse - National",
        subtitle: `Liste extraite le ${format(new Date(), 'dd/MM/yyyy')}`,
        tableData: permitsList,
        fileName: activeTab === "sector" ? "permis-secteur.pdf" : "permis-national.pdf"
      });
      toast({
        title: "Export terminé",
        description: "La liste des permis a été exportée avec succès.",
      });
    }).catch(error => {
      console.error("Erreur lors de la génération du PDF:", error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF.",
        variant: "destructive"
      });
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Permis</h1>
          <p className="text-muted-foreground">
            {activeTab === "sector" 
              ? "Consultez et gérez les permis de chasse dans votre secteur" 
              : "Consultez tous les permis de chasse émis"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total des permis</p>
              <h4 className="text-2xl font-bold">{permitCounts.total}</h4>
            </div>
            <FileBox className="h-8 w-8 text-primary opacity-80" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Permis actifs</p>
              <h4 className="text-2xl font-bold">{permitCounts.active}</h4>
            </div>
            <Badge variant="default" className="text-xl px-3 py-1">
              {permitCounts.active}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Permis expirés</p>
              <h4 className="text-2xl font-bold">{permitCounts.expired}</h4>
            </div>
            <Badge variant="secondary" className="text-xl px-3 py-1">
              {permitCounts.expired}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Permis suspendus</p>
              <h4 className="text-2xl font-bold">{permitCounts.suspended}</h4>
            </div>
            <Badge variant="destructive" className="text-xl px-3 py-1">
              {permitCounts.suspended}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sector" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger 
            value="sector" 
            onClick={() => {
              setActiveTab("sector");
              navigate("/sector-permits");
            }}
          >
            Permis du Secteur
          </TabsTrigger>
          <TabsTrigger 
            value="all" 
            onClick={() => {
              setActiveTab("all");
              navigate("/sector-permits?tab=all");
            }}
          >
            Permis Liste Nationale
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sector" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <CardTitle>Permis de votre Secteur ({user?.zone || "Non défini"})</CardTitle>
                <div className="flex space-x-2 mt-2 md:mt-0">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un permis..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" onClick={exportPermitsList}>
                    <Printer className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <p>Chargement des permis...</p>
                </div>
              ) : error ? (
                <div className="flex justify-center items-center h-32">
                  <p className="text-destructive">
                    Erreur lors du chargement des permis. Veuillez réessayer.
                  </p>
                </div>
              ) : filteredPermits.length === 0 ? (
                <div className="flex justify-center items-center h-32">
                  <p>Doit contenir la liste des permis délivrés par le secteur.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">N° Permis</th>
                        <th className="text-left py-2 px-2">Chasseur</th>
                        <th className="text-left py-2 px-2">N° ID</th>
                        <th className="text-left py-2 px-2">Date émission</th>
                        <th className="text-left py-2 px-2">Date expiration</th>
                        <th className="text-left py-2 px-2">Type</th>
                        <th className="text-left py-2 px-2">Statut</th>
                        <th className="text-left py-2 px-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPermits.map((permit) => {
                        const hunter = hunters?.find(h => h.id === permit.hunterId);
                        return (
                          <tr key={permit.id} className="border-b">
                            <td className="py-2 px-2">{permit.permitNumber}</td>
                            <td className="py-2 px-2">
                              {hunter ? `${hunter.firstName} ${hunter.lastName}` : "Inconnu"}
                            </td>
                            <td className="py-2 px-2">{hunter?.idNumber || "N/A"}</td>
                            <td className="py-2 px-2">
                              {format(new Date(permit.issueDate), 'dd/MM/yyyy')}
                            </td>
                            <td className="py-2 px-2">
                              {format(new Date(permit.expiryDate), 'dd/MM/yyyy')}
                            </td>
                            <td className="py-2 px-2">{permit.type || "Standard"}</td>
                            <td className="py-2 px-2">
                              <Badge variant={
                                isPermitActive(permit) ? 'default' :
                                isPermitExpired(permit) ? 'secondary' :
                                'destructive'
                              }>
                                {isPermitActive(permit) ? 'Actif' :
                                isPermitExpired(permit) ? 'Expiré' :
                                'Suspendu'}
                              </Badge>
                            </td>
                            <td className="py-2 px-2">
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => setSelectedPermitId(permit.id)}
                                >
                                  <Search className="h-4 w-4 mr-1" />
                                  Détails
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    toast({
                                      title: "Téléchargement du permis",
                                      description: "Le permis est en cours de téléchargement.",
                                    });
                                  }}
                                >
                                  <FileDown className="h-4 w-4 mr-1" />
                                  PDF
                                </Button>
                              </div>
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

        <TabsContent value="all" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <CardTitle>Tous les Permis de Chasse</CardTitle>
                <div className="flex space-x-2 mt-2 md:mt-0">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un permis..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" onClick={exportPermitsList}>
                    <Printer className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <p>Chargement des permis...</p>
                </div>
              ) : error ? (
                <div className="flex justify-center items-center h-32">
                  <p className="text-destructive">
                    Erreur lors du chargement des permis. Veuillez réessayer.
                  </p>
                </div>
              ) : filteredPermits.length === 0 ? (
                <div className="flex justify-center items-center h-32">
                  <p>Aucun permis trouvé.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">N° Permis</th>
                        <th className="text-left py-2 px-2">Chasseur</th>
                        <th className="text-left py-2 px-2">Date émission</th>
                        <th className="text-left py-2 px-2">Date expiration</th>
                        <th className="text-left py-2 px-2">Type</th>
                        <th className="text-left py-2 px-2">Zone</th>
                        <th className="text-left py-2 px-2">Statut</th>
                        <th className="text-left py-2 px-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPermits.map((permit) => {
                        const hunter = hunters?.find(h => h.id === permit.hunterId);
                        return (
                          <tr key={permit.id} className="border-b">
                            <td className="py-2 px-2">{permit.permitNumber}</td>
                            <td className="py-2 px-2">
                              {hunter ? `${hunter.firstName} ${hunter.lastName}` : "Inconnu"}
                            </td>
                            <td className="py-2 px-2">
                              {format(new Date(permit.issueDate), 'dd/MM/yyyy')}
                            </td>
                            <td className="py-2 px-2">
                              {format(new Date(permit.expiryDate), 'dd/MM/yyyy')}
                            </td>
                            <td className="py-2 px-2">{permit.type || "Standard"}</td>
                            <td className="py-2 px-2">{permit.zone || "Non définie"}</td>
                            <td className="py-2 px-2">
                              <Badge variant={
                                isPermitActive(permit) ? 'default' :
                                isPermitExpired(permit) ? 'secondary' :
                                'destructive'
                              }>
                                {isPermitActive(permit) ? 'Actif' :
                                isPermitExpired(permit) ? 'Expiré' :
                                'Suspendu'}
                              </Badge>
                            </td>
                            <td className="py-2 px-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setSelectedPermitId(permit.id)}
                              >
                                <Search className="h-4 w-4 mr-1" />
                                Détails
                              </Button>
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

      {selectedPermitId && (
        <PermitDetails
          permitId={selectedPermitId}
          open={!!selectedPermitId}
          onClose={() => setSelectedPermitId(null)}
        />
      )}
    </div>
  );
}