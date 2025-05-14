import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Users, FileText, Bell, MapPin, AlertTriangle } from "lucide-react";

// Types pour les données du tableau de bord régional
type RegionalStats = {
  totalHunters: number;
  activeHunters: number;
  totalPermits: number;
  pendingRequests: number;
  reportedIncidents: number;
};

type RecentRequest = {
  id: number;
  hunterName: string;
  permitType: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
};

const RegionalAgentDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<RegionalStats>({
    totalHunters: 0,
    activeHunters: 0,
    totalPermits: 0,
    pendingRequests: 0,
    reportedIncidents: 0,
  });
  
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  
  // Simuler le chargement des données
  useEffect(() => {
    // Simuler des données de statistiques régionales
    setStats({
      totalHunters: 356,
      activeHunters: 289,
      totalPermits: 124,
      pendingRequests: 8,
      reportedIncidents: 3,
    });
    
    // Simuler des demandes récentes
    setRecentRequests([
      { id: 1, hunterName: "Mamadou Diop", permitType: "Permis annuel", requestDate: "2025-05-14", status: 'pending' },
      { id: 2, hunterName: "Awa Ndiaye", permitType: "Permis de chasse spécial", requestDate: "2025-05-13", status: 'approved' },
      { id: 3, hunterName: "Ibrahima Fall", permitType: "Renouvellement de permis", requestDate: "2025-05-12", status: 'pending' },
      { id: 4, hunterName: "Fatou Sarr", permitType: "Permis temporaire", requestDate: "2025-05-11", status: 'rejected' },
      { id: 5, hunterName: "Ousmane Diagne", permitType: "Permis annuel", requestDate: "2025-05-10", status: 'approved' },
    ]);
  }, []);
  
  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };
  
  // Fonction pour obtenir la classe de statut
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Approuvé</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Rejeté</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord régional</h1>
          <p className="text-muted-foreground">
            Bienvenue, Agent {user?.firstName} - {user?.region || 'Région non spécifiée'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher..."
              className="pl-8 sm:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button>
            <MapPin className="mr-2 h-4 w-4" />
            Voir la carte
          </Button>
        </div>
      </div>
      
      {/* Cartes de statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chasseurs enregistrés</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHunters}</div>
            <p className="text-xs text-muted-foreground">dont {stats.activeHunters} actifs</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permis actifs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPermits}</div>
            <p className="text-xs text-muted-foreground">déjà délivrés cette année</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demandes en attente</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">demandes à traiter</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incidents signalés</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reportedIncidents}</div>
            <p className="text-xs text-muted-foreground">incidents ce mois-ci</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Demandes récentes */}
      <Card>
        <CardHeader>
          <CardTitle>Demandes récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chasseur</TableHead>
                <TableHead>Type de permis</TableHead>
                <TableHead>Date de demande</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.hunterName}</TableCell>
                  <TableCell>{request.permitType}</TableCell>
                  <TableCell>{formatDate(request.requestDate)}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      Voir détails
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Section pour les actions rapides */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
          <Users className="h-6 w-6 mb-2" />
          Gérer les chasseurs
        </Button>
        <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
          <FileText className="h-6 w-6 mb-2" />
          Nouveau permis
        </Button>
        <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
          <MapPin className="h-6 w-6 mb-2" />
          Zones de chasse
        </Button>
        <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
          <AlertTriangle className="h-6 w-6 mb-2" />
          Signaler un incident
        </Button>
      </div>
    </div>
  );
};

export default RegionalAgentDashboard;
