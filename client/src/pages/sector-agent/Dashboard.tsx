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
import { Search, Users, FileText, Bell, MapPin, AlertTriangle, Calendar, CheckCircle } from "lucide-react";

// Types pour les données du tableau de bord secteur
type SectorStats = {
  totalHunters: number;
  activePermits: number;
  pendingValidations: number;
  recentInspections: number;
};

type HunterPermit = {
  id: number;
  hunterName: string;
  permitNumber: string;
  issueDate: string;
  expiryDate: string;
  status: 'valid' | 'expired' | 'pending';
};

const SectorAgentDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<SectorStats>({
    totalHunters: 0,
    activePermits: 0,
    pendingValidations: 0,
    recentInspections: 0,
  });
  
  const [recentPermits, setRecentPermits] = useState<HunterPermit[]>([]);
  
  // Simuler le chargement des données
  useEffect(() => {
    // Simuler des données de statistiques du secteur
    setStats({
      totalHunters: 87,
      activePermits: 65,
      pendingValidations: 5,
      recentInspections: 12,
    });
    
    // Simuler des permis récents
    setRecentPermits([
      { 
        id: 1, 
        hunterName: "Mamadou Diop", 
        permitNumber: "PER-2025-001", 
        issueDate: "2025-01-15", 
        expiryDate: "2025-12-31",
        status: 'valid' 
      },
      { 
        id: 2, 
        hunterName: "Awa Ndiaye", 
        permitNumber: "PER-2025-042", 
        issueDate: "2025-05-10", 
        expiryDate: "2025-11-10",
        status: 'pending' 
      },
      { 
        id: 3, 
        hunterName: "Ibrahima Fall", 
        permitNumber: "PER-2024-156", 
        issueDate: "2024-06-20", 
        expiryDate: "2025-06-20",
        status: 'expired' 
      },
      { 
        id: 4, 
        hunterName: "Fatou Sarr", 
        permitNumber: "PER-2025-087", 
        issueDate: "2025-04-01", 
        expiryDate: "2025-12-31",
        status: 'valid' 
      },
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
      case 'valid':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Valide</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case 'expired':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Expiré</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  // Vérifier si un permis expire bientôt (dans les 30 prochains jours)
  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    return expiry > today && expiry <= thirtyDaysFromNow;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord secteur</h1>
          <p className="text-muted-foreground">
            Bienvenue, Agent {user?.firstName} - Secteur {user?.sector || 'Non spécifié'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher un chasseur..."
              className="pl-8 sm:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button>
            <MapPin className="mr-2 h-4 w-4" />
            Carte du secteur
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
            <p className="text-xs text-muted-foreground">dans votre secteur</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permis actifs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePermits}</div>
            <p className="text-xs text-muted-foreground">permis en cours de validité</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validations en attente</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingValidations}</div>
            <p className="text-xs text-muted-foreground">demandes à traiter</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contrôles récents</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentInspections}</div>
            <p className="text-xs text-muted-foreground">contrôles ce mois-ci</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Permis récents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Permis récents</CardTitle>
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Voir tous les permis
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chasseur</TableHead>
                <TableHead>N° Permis</TableHead>
                <TableHead>Date d'émission</TableHead>
                <TableHead>Date d'expiration</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPermits.map((permit) => (
                <TableRow 
                  key={permit.id} 
                  className={isExpiringSoon(permit.expiryDate) ? 'bg-yellow-50' : ''}
                >
                  <TableCell className="font-medium">{permit.hunterName}</TableCell>
                  <TableCell>{permit.permitNumber}</TableCell>
                  <TableCell>{formatDate(permit.issueDate)}</TableCell>
                  <TableCell className={new Date(permit.expiryDate) < new Date() ? 'text-red-600 font-medium' : ''}>
                    {formatDate(permit.expiryDate)}
                  </TableCell>
                  <TableCell>{getStatusBadge(permit.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      Détails
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Alertes et actions rapides */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
              Alertes importantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-2 w-2 rounded-full bg-yellow-500 mt-2"></div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">3 permis expirent bientôt</p>
                  <p className="text-xs text-muted-foreground">Veuillez contacter les chasseurs concernés</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-2 w-2 rounded-full bg-red-500 mt-2"></div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">1 incident signalé</p>
                  <p className="text-xs text-muted-foreground">Braconnage présumé dans la zone sud</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-600" />
              Prochains contrôles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Contrôle de routine</p>
                  <p className="text-xs text-muted-foreground">Zone de chasse A</p>
                </div>
                <Badge variant="outline" className="ml-2">Demain</Badge>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Formation sécurité</p>
                  <p className="text-xs text-muted-foreground">Salle communale</p>
                </div>
                <Badge variant="outline" className="ml-2">15/05/2025</Badge>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Réunion trimestrielle</p>
                  <p className="text-xs text-muted-foreground">Bureau des Eaux et Forêts</p>
                </div>
                <Badge variant="outline" className="ml-2">22/05/2025</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SectorAgentDashboard;
