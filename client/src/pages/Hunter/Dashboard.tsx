import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  FileText, 
  Calendar, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight,
  ArrowDownRight,
  Info,
  UserCheck
} from "lucide-react";
import { Link } from "wouter";

// Types pour les données du tableau de bord chasseur
type HunterStats = {
  activePermits: number;
  remainingQuota: number;
  totalQuota: number;
  recentActivities: number;
};

type HunterPermit = {
  id: number;
  permitNumber: string;
  type: string;
  issueDate: string;
  expiryDate: string;
  status: 'valid' | 'expired' | 'pending' | 'rejected';
  quota: {
    used: number;
    total: number;
    species: string;
  };
};

type Activity = {
  id: number;
  type: 'hunt' | 'permit' | 'payment' | 'alert';
  title: string;
  description: string;
  date: string;
  status: 'success' | 'warning' | 'error' | 'info';
};

const HunterDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("permits");
  
  // État pour les statistiques
  const [stats, setStats] = useState<HunterStats>({
    activePermits: 0,
    remainingQuota: 0,
    totalQuota: 0,
    recentActivities: 0,
  });
  
  // État pour les permis du chasseur
  const [permits, setPermits] = useState<HunterPermit[]>([]);
  
  // État pour les activités récentes
  const [activities, setActivities] = useState<Activity[]>([]);
  
  // Simuler le chargement des données
  useEffect(() => {
    // Simuler des statistiques
    setStats({
      activePermits: 1,
      remainingQuota: 8,
      totalQuota: 15,
      recentActivities: 3,
    });
    
    // Simuler des permis
    setPermits([
      {
        id: 1,
        permitNumber: "PER-2025-0456",
        type: "Permis annuel",
        issueDate: "2025-01-15",
        expiryDate: "2025-12-31",
        status: 'valid',
        quota: {
          used: 7,
          total: 15,
          species: "Petite faune sédentaire"
        }
      },
      {
        id: 2,
        permitNumber: "PER-2025-0789",
        type: "Permis spécial",
        issueDate: "2025-05-01",
        expiryDate: "2025-08-31",
        status: 'pending',
        quota: {
          used: 0,
          total: 5,
          species: "Oiseaux migrateurs"
        }
      }
    ]);
    
    // Simuler des activités récentes
    setActivities([
      {
        id: 1,
        type: 'hunt',
        title: 'Sortie de chasse enregistrée',
        description: 'Zone de chasse: Forêt de Bandia',
        date: '2025-05-14T08:30:00',
        status: 'success'
      },
      {
        id: 2,
        type: 'permit',
        title: 'Nouvelle demande de permis',
        description: 'Permis spécial oiseaux migrateurs en attente de validation',
        date: '2025-05-10T14:15:00',
        status: 'warning'
      },
      {
        id: 3,
        type: 'alert',
        title: 'Alerte météo',
        description: 'Alerte canicule en cours dans votre région',
        date: '2025-05-09T11:45:00',
        status: 'error'
      }
    ]);
  }, []);
  
  // Fonction pour formater la date
  const formatDate = (dateString: string, includeTime: boolean = false) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      ...(includeTime && { hour: '2-digit', minute: '2-digit' })
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };
  
  // Fonction pour obtenir l'icône en fonction du type d'activité
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'hunt':
        return <MapPin className="h-4 w-4" />;
      case 'permit':
        return <FileText className="h-4 w-4" />;
      case 'payment':
        return <ArrowDownRight className="h-4 w-4" />;
      case 'alert':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };
  
  // Fonction pour obtenir la classe de statut
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Valide</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expiré</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-yellow-300 text-yellow-800 bg-yellow-50">En attente</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeté</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };
  
  // Calculer le pourcentage du quota utilisé
  const calculateQuotaPercentage = (used: number, total: number) => {
    return (used / total) * 100;
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
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Mon tableau de bord</h1>
        <p className="text-muted-foreground">
          Bienvenue, {user?.firstName} {user?.lastName}
        </p>
      </div>
      
      {/* Alertes importantes */}
      {permits.some(p => isExpiringSoon(p.expiryDate) && p.status === 'valid') && (
        <Alert className="bg-yellow-50 border-yellow-300">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle>Attention</AlertTitle>
          <AlertDescription>
            Certains de vos permis arrivent bientôt à expiration. Pensez à les renouveler.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Cartes de statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permis actifs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePermits}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activePermits > 0 ? 'Dernier valide jusqu\'au ' + formatDate(permits[0]?.expiryDate) : 'Aucun permis actif'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quota de chasse</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.remainingQuota} <span className="text-sm font-normal text-muted-foreground">/ {stats.totalQuota}</span>
            </div>
            <Progress 
              value={calculateQuotaPercentage(stats.totalQuota - stats.remainingQuota, stats.totalQuota)} 
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activités récentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentActivities}</div>
            <p className="text-xs text-muted-foreground">
              {stats.recentActivities > 0 ? 'Dernière activité: ' + formatDate(activities[0]?.date, true) : 'Aucune activité récente'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prochain contrôle</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">22/05/2025</div>
            <p className="text-xs text-muted-foreground">
              Contrôle de routine - Zone de chasse A
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Onglets pour Permis et Activités */}
      <Tabs defaultValue="permits" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="permits">Mes Permis</TabsTrigger>
          <TabsTrigger value="activities">Activités Récents</TabsTrigger>
          {user?.hunter?.category === 'resident' && (
            <TabsTrigger value="migration">Devenir Chasseur Coutumier</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="permits" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Mes permis de chasse</CardTitle>
                <Button size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  Demander un permis
                </Button>
              </div>
              <CardDescription>
                Gérez vos permis de chasse actuels et passez de nouvelles demandes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {permits.length > 0 ? (
                <div className="space-y-4">
                  {permits.map((permit) => (
                    <Card key={permit.id} className="overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold">{permit.permitNumber}</h3>
                              {getStatusBadge(permit.status)}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {permit.type} • {permit.quota.species}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">
                              Émis le {formatDate(permit.issueDate)}
                            </p>
                            <p className={`text-sm ${new Date(permit.expiryDate) < new Date() ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                              Expire le {formatDate(permit.expiryDate)}
                            </p>
                          </div>
                        </div>
                        
                        {permit.status === 'valid' && (
                          <div className="mt-4">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Quota utilisé</span>
                              <span>{permit.quota.used} / {permit.quota.total}</span>
                            </div>
                            <Progress 
                              value={calculateQuotaPercentage(permit.quota.used, permit.quota.total)} 
                              className="h-2"
                            />
                          </div>
                        )}
                        
                        <div className="mt-4 flex justify-end space-x-2">
                          <Button variant="outline" size="sm">
                            Détails
                          </Button>
                          {permit.status === 'valid' && (
                            <Button size="sm">
                              Déclarer une sortie
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-medium">Aucun permis actif</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Commencez par faire une demande de permis de chasse.
                  </p>
                  <Button className="mt-4">
                    Demander un permis
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="migration">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-6 w-6" />
                Devenir Chasseur Coutumier
              </CardTitle>
              <CardDescription>
                Demandez votre migration vers le statut de chasseur coutumier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-muted/50">
                  <h3 className="font-medium mb-2">Qu'est-ce qu'un chasseur coutumier ?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Les chasseurs coutumiers sont des habitants du terroir de la zone de chasse qui bénéficient de droits spécifiques
                    pour chasser selon les usages locaux et traditionnels.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                      <span>Tarifs préférentiels pour les permis de chasse</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                      <span>Accès à des zones de chasse réservées</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                      <span>Reconnaissance des droits d'usage traditionnels</span>
                    </li>
                  </ul>
                </div>
                
                <div className="flex justify-end">
                  <Link href="/migration-coutumier">
                    <Button>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Faire une demande de migration
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Activités récentes</CardTitle>
              <CardDescription>
                Historique de vos activités et notifications récentes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length > 0 ? (
                <div className="space-y-6">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start pb-4 border-b last:border-0 last:pb-0">
                      <div className={`flex items-center justify-center h-8 w-8 rounded-full ${
                        activity.status === 'success' ? 'bg-green-100 text-green-600' :
                        activity.status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                        activity.status === 'error' ? 'bg-red-100 text-red-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(activity.date, true)}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
                        <ArrowUpRight className="h-4 w-4" />
                        <span className="sr-only">Voir les détails</span>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-medium">Aucune activité récente</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Vos activités récentes apparaîtront ici.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Section pour les informations importantes */}
      <Card>
        <CardHeader>
          <CardTitle>Informations importantes</CardTitle>
          <CardDescription>
            Restez informé des dernières actualités et réglementations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="border rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <h4 className="font-medium">Alerte météo</h4>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Vague de chaleur prévue pour les prochains jours. Soyez prudent lors de vos sorties.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Info className="h-4 w-4 text-blue-600" />
                <h4 className="font-medium">Nouvelle réglementation</h4>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Mise à jour des zones de chasse autorisées dans la région de Thiès.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-green-600" />
                <h4 className="font-medium">Événement à venir</h4>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Formation sécurité obligatoire le 30 mai 2025 à 10h00.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HunterDashboard;
