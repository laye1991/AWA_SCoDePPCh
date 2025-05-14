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
import { Search, Users, FileText, Bell, UserPlus, Activity } from "lucide-react";

// Types pour les données du tableau de bord
type DashboardStats = {
  totalUsers: number;
  activeUsers: number;
  totalPermits: number;
  pendingApprovals: number;
};

type RecentActivity = {
  id: number;
  action: string;
  user: string;
  date: string;
  status: 'success' | 'warning' | 'error';
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Données factices pour le développement
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalPermits: 0,
    pendingApprovals: 0,
  });
  
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  
  // Simuler le chargement des données
  useEffect(() => {
    // Simuler des données de statistiques
    setStats({
      totalUsers: 1245,
      activeUsers: 873,
      totalPermits: 567,
      pendingApprovals: 23,
    });
    
    // Simuler des activités récentes
    setRecentActivities([
      { id: 1, action: "Nouvel utilisateur enregistré", user: "Moussa Diop", date: "2025-05-14 10:30", status: 'success' },
      { id: 2, action: "Demande de permis approuvée", user: "Aminata Ndiaye", date: "2025-05-14 09:15", status: 'success' },
      { id: 3, action: "Échec de la mise à jour du profil", user: "Ibrahima Fall", date: "2025-05-14 08:45", status: 'error' },
      { id: 4, action: "Nouvelle alerte de braconnage", user: "Système", date: "2025-05-13 16:20", status: 'warning' },
      { id: 5, action: "Mise à jour du système effectuée", user: "Admin", date: "2025-05-13 15:10", status: 'success' },
    ]);
  }, []);
  
  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };
  
  // Fonction pour obtenir la classe de statut
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord administrateur</h1>
          <p className="text-muted-foreground">
            Bienvenue, {user?.firstName} {user?.lastName}
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
            <UserPlus className="mr-2 h-4 w-4" />
            Ajouter un utilisateur
          </Button>
        </div>
      </div>
      
      {/* Cartes de statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs totaux</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">+12% par rapport au mois dernier</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs actifs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">+5% par rapport au mois dernier</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permis délivrés</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPermits}</div>
            <p className="text-xs text-muted-foreground">+23% par rapport au mois dernier</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">+2 en attente de validation</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Activités récentes */}
      <Card>
        <CardHeader>
          <CardTitle>Activités récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>{activity.action}</TableCell>
                  <TableCell>{activity.user}</TableCell>
                  <TableCell>{formatDate(activity.date)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusClass(activity.status)}>
                      {activity.status === 'success' 
                        ? 'Réussi' 
                        : activity.status === 'warning' 
                          ? 'Avertissement' 
                          : 'Erreur'
                      }
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
