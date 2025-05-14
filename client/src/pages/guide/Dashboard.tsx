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
  Users, 
  Calendar, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  UserPlus,
  ArrowUpRight,
  Map,
  Compass,
  BarChart2,
  Info
} from "lucide-react";

// Types pour les données du tableau de bord guide
type GuideStats = {
  totalHunts: number;
  upcomingHunts: number;
  huntersGuided: number;
  successRate: number;
};

type Hunt = {
  id: number;
  date: string;
  location: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  hunters: {
    id: number;
    name: string;
    permitNumber: string;
  }[];
  notes?: string;
};

type Hunter = {
  id: number;
  name: string;
  permitNumber: string;
  lastHunt: string;
  status: 'active' | 'inactive';
  huntsCompleted: number;
};

const GuideDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("hunts");
  
  // État pour les statistiques
  const [stats, setStats] = useState<GuideStats>({
    totalHunts: 0,
    upcomingHunts: 0,
    huntersGuided: 0,
    successRate: 0,
  });
  
  // État pour les chasses
  const [hunts, setHunts] = useState<Hunt[]>([]);
  
  // État pour les chasseurs associés
  const [hunters, setHunters] = useState<Hunter[]>([]);
  
  // Simuler le chargement des données
  useEffect(() => {
    // Simuler des statistiques
    setStats({
      totalHunts: 24,
      upcomingHunts: 3,
      huntersGuided: 15,
      successRate: 87, // Pourcentage
    });
    
    // Simuler des chasses
    setHunts([
      {
        id: 1,
        date: "2025-05-15",
        location: "Forêt de Bandia",
        status: 'upcoming',
        hunters: [
          { id: 1, name: "Mamadou Diop", permitNumber: "PER-2025-0456" },
          { id: 2, name: "Awa Ndiaye", permitNumber: "PER-2025-0421" },
        ],
        notes: "Prévoir des équipements pour la chasse au petit gibier"
      },
      {
        id: 2,
        date: "2025-05-20",
        location: "Réserve de Fathala",
        status: 'upcoming',
        hunters: [
          { id: 3, name: "Ibrahima Fall", permitNumber: "PER-2025-0387" },
        ],
        notes: "Chasse spéciale avec autorisation spéciale"
      },
      {
        id: 3,
        date: "2025-05-10",
        location: "Forêt de Mbao",
        status: 'completed',
        hunters: [
          { id: 4, name: "Fatou Sarr", permitNumber: "PER-2025-0512" },
          { id: 5, name: "Ousmane Diagne", permitNumber: "PER-2025-0498" },
        ],
        notes: "Chasse réussie - 2 lièvres et 1 pintade"
      },
      {
        id: 4,
        date: "2025-05-05",
        location: "Réserve de Popenguine",
        status: 'completed',
        hunters: [
          { id: 1, name: "Mamadou Diop", permitNumber: "PER-2025-0456" },
        ],
        notes: "Aucune prise - conditions météo défavorables"
      },
    ]);
    
    // Simuler des chasseurs associés
    setHunters([
      { id: 1, name: "Mamadou Diop", permitNumber: "PER-2025-0456", lastHunt: "2025-05-05", status: 'active', huntsCompleted: 5 },
      { id: 2, name: "Awa Ndiaye", permitNumber: "PER-2025-0421", lastHunt: "2025-04-28", status: 'active', huntsCompleted: 3 },
      { id: 3, name: "Ibrahima Fall", permitNumber: "PER-2025-0387", lastHunt: "2025-04-15", status: 'active', huntsCompleted: 2 },
      { id: 4, name: "Fatou Sarr", permitNumber: "PER-2025-0512", lastHunt: "2025-05-10", status: 'active', huntsCompleted: 1 },
      { id: 5, name: "Ousmane Diagne", permitNumber: "PER-2025-0498", lastHunt: "2025-05-10", status: 'inactive', huntsCompleted: 1 },
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
  
  // Fonction pour obtenir le badge de statut
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">À venir</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Terminée</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Annulée</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };
  
  // Obtenir les chasses à venir
  const upcomingHunts = hunts.filter(hunt => hunt.status === 'upcoming');
  
  // Obtenir les chasses passées
  const pastHunts = hunts.filter(hunt => hunt.status !== 'upcoming');
  
  // Obtenir les chasseurs actifs
  const activeHunters = hunters.filter(hunter => hunter.status === 'active');

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Tableau de bord du guide</h1>
        <p className="text-muted-foreground">
          Bienvenue, Guide {user?.firstName} {user?.lastName}
        </p>
      </div>
      
      {/* Alertes importantes */}
      {upcomingHunts.length > 0 && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertTitle>Prochaine sortie prévue</AlertTitle>
          <AlertDescription>
            Vous avez une sortie de chasse prévue le {formatDate(upcomingHunts[0].date)} à {upcomingHunts[0].location} avec {upcomingHunts[0].hunters.length} chasseur(s).
          </AlertDescription>
        </Alert>
      )}
      
      {/* Cartes de statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total des chasses</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHunts}</div>
            <p className="text-xs text-muted-foreground">
              dont {stats.upcomingHunts} à venir
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chasseurs guidés</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.huntersGuided}</div>
            <p className="text-xs text-muted-foreground">
              dont {activeHunters.length} actifs
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de réussite</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <div className="mt-2">
              <Progress value={stats.successRate} className="h-2" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prochaine sortie</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {upcomingHunts.length > 0 ? (
              <>
                <div className="text-2xl font-bold">{formatDate(upcomingHunts[0].date)}</div>
                <p className="text-xs text-muted-foreground">
                  {upcomingHunts[0].location}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune sortie prévue</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Onglets pour Chasses et Chasseurs */}
      <Tabs defaultValue="hunts" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="hunts">Mes chasses</TabsTrigger>
          <TabsTrigger value="hunters">Mes chasseurs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="hunts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Mes chasses guidées</CardTitle>
                <Button>
                  <Calendar className="mr-2 h-4 w-4" />
                  Planifier une chasse
                </Button>
              </div>
              <CardDescription>
                Gérez vos sorties de chasse passées et à venir.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {/* Chasses à venir */}
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                  Chasses à venir
                </h3>
                {upcomingHunts.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingHunts.map((hunt) => (
                      <Card key={hunt.id} className="border-blue-100">
                        <div className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold">Chasse du {formatDate(hunt.date)}</h3>
                                {getStatusBadge(hunt.status)}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                <MapPin className="inline h-3.5 w-3.5 mr-1" />
                                {hunt.location}
                              </p>
                              <p className="text-sm mt-2">
                                <span className="font-medium">{hunt.hunters.length}</span> chasseur(s) inscrit(s)
                              </p>
                            </div>
                            <Button variant="outline" size="sm">
                              Détails
                            </Button>
                          </div>
                          
                          {hunt.notes && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-md text-sm text-blue-700">
                              <p className="font-medium">Notes :</p>
                              <p>{hunt.notes}</p>
                            </div>
                          )}
                          
                          <div className="mt-4 flex justify-end space-x-2">
                            <Button variant="outline" size="sm">
                              <Map className="h-4 w-4 mr-2" />
                              Itinéraire
                            </Button>
                            <Button variant="outline" size="sm">
                              <Users className="h-4 w-4 mr-2" />
                              Liste des chasseurs
                            </Button>
                            <Button size="sm">
                              <Compass className="h-4 w-4 mr-2" />
                              Commencer la chasse
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-lg bg-muted/20">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-medium">Aucune chasse prévue</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Planifiez votre prochaine sortie de chasse.
                    </p>
                    <Button className="mt-4">
                      Planifier une chasse
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Historique des chasses */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
                  Historique des chasses
                </h3>
                {pastHunts.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Lieu</TableHead>
                          <TableHead>Chasseurs</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pastHunts.map((hunt) => (
                          <TableRow key={hunt.id}>
                            <TableCell className="font-medium">
                              {formatDate(hunt.date)}
                            </TableCell>
                            <TableCell>{hunt.location}</TableCell>
                            <TableCell>{hunt.hunters.length} chasseur(s)</TableCell>
                            <TableCell>{getStatusBadge(hunt.status)}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm">
                                Détails
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-lg">
                    <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-medium">Aucune chasse enregistrée</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Votre historique de chasse apparaîtra ici.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="hunters" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Mes chasseurs</CardTitle>
                  <CardDescription>
                    Gérez les chasseurs que vous guidez régulièrement.
                  </CardDescription>
                </div>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Ajouter un chasseur
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {hunters.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>N° Permis</TableHead>
                        <TableHead>Dernière chasse</TableHead>
                        <TableHead>Chasses</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hunters.map((hunter) => (
                        <TableRow key={hunter.id}>
                          <TableCell className="font-medium">{hunter.name}</TableCell>
                          <TableCell>{hunter.permitNumber}</TableCell>
                          <TableCell>{formatDate(hunter.lastHunt)}</TableCell>
                          <TableCell>{hunter.huntsCompleted} sortie(s)</TableCell>
                          <TableCell>
                            <Badge 
                              variant={hunter.status === 'active' ? 'default' : 'outline'}
                              className={hunter.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                            >
                              {hunter.status === 'active' ? 'Actif' : 'Inactif'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              Détails
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 border rounded-lg">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-medium">Aucun chasseur enregistré</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ajoutez des chasseurs pour commencer à suivre leurs activités.
                  </p>
                  <Button className="mt-4">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Ajouter un chasseur
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Section pour les rapports et statistiques */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart2 className="h-5 w-5 mr-2 text-blue-600" />
              Statistiques mensuelles
            </CardTitle>
            <CardDescription>
              Vue d'ensemble de votre activité ce mois-ci.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Sorties de chasse</span>
                  <span className="font-medium">4/8</span>
                </div>
                <Progress value={50} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Chasseurs guidés</span>
                  <span className="font-medium">7/15</span>
                </div>
                <Progress value={46.67} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Taux de réussite</span>
                  <span className="font-medium">75%</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
              Alertes et notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      <span className="font-medium">Attention !</span> Votre certificat de guide expire dans 15 jours.
                    </p>
                    <div className="mt-2">
                      <Button variant="outline" size="sm">
                        Renouveler
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-l-4 border-blue-400 bg-blue-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Info className="h-5 w-5 text-blue-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      <span className="font-medium">Nouvelle formation disponible</span> - Techniques de guidage avancées
                    </p>
                    <div className="mt-2">
                      <Button variant="outline" size="sm">
                        En savoir plus
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GuideDashboard;
