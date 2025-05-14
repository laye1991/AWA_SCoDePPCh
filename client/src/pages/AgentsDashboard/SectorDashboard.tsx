import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useStats } from "@/lib/hooks/useStats";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  RefreshCw, Calendar, FileBadge, Users, Activity, ChartBar, CreditCard, 
  Coins, AlertTriangle, ClipboardList, Ban, DollarSign, Zap, PieChart, BarChart, TrendingUp,
  Printer, LineChart, UserCheck
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

// Données fictives pour le tableau de bord
const monthlyPermitData = [
  { month: "Janvier", count: 12 },
  { month: "Février", count: 18 },
  { month: "Mars", count: 24 },
  { month: "Avril", count: 32 },
  { month: "Mai", count: 28 },
  { month: "Juin", count: 15 },
  { month: "Juillet", count: 20 },
  { month: "Août", count: 22 },
  { month: "Septembre", count: 35 },
  { month: "Octobre", count: 42 },
  { month: "Novembre", count: 38 },
  { month: "Décembre", count: 25 },
];

const wildlifeData = [
  { species: "Phacochère", count: 24, quota: 30 },
  { species: "Francolin", count: 56, quota: 100 },
  { species: "Pintade", count: 32, quota: 50 },
  { species: "Lièvre", count: 18, quota: 25 },
  { species: "Hippotrague", count: 5, quota: 10 },
  { species: "Buffle", count: 3, quota: 5 },
  { species: "Céphalophe", count: 8, quota: 15 },
  { species: "Ourébi", count: 6, quota: 12 }
];

const infractionData = [
  { type: "Chasse sans permis", count: 8, fines: 400000 },
  { type: "Chasse en période fermée", count: 4, fines: 300000 },
  { type: "Dépassement quota", count: 3, fines: 150000 },
  { type: "Chasse en zone interdite", count: 5, fines: 250000 },
  { type: "Non-déclaration d'abattage", count: 6, fines: 180000 }
];

/**
 * Tableau de bord pour les Agents Secteur
 * Cette page présente les statistiques et informations pertinentes pour la gestion quotidienne
 * du secteur de l'agent sans répéter l'en-tête qui est déjà inclus dans la mise en page principale
 */
export default function SectorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { stats, loading, error, refetch } = useStats();
  const [totalInfractions, setTotalInfractions] = useState(0);
  const [totalFines, setTotalFines] = useState(0);
  
  useEffect(() => {
    // Mettre à jour le titre de la page
    document.title = "Tableau de bord Agent Secteur | SCoDePP_Ch";
    
    // Calcul du total des infractions et amendes
    const infractions = infractionData.reduce((sum, item) => sum + item.count, 0);
    const fines = infractionData.reduce((sum, item) => sum + item.fines, 0);
    
    setTotalInfractions(infractions);
    setTotalFines(fines);
  }, []);

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les statistiques",
      });
    }
  }, [error, toast]);

  const handleRefresh = async () => {
    await refetch();
    toast({
      title: "Mise à jour",
      description: "Les statistiques ont été mises à jour",
    });
  };

  return (
      <div className="space-y-4 p-4 sm:p-6 md:p-8">
        {/* En-tête simplifié avec informations de l'agent */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">
            Tableau de bord - Secteur {user?.zone}
          </h1>
          <p className="text-muted-foreground">
            <Badge variant="outline" className="mr-2 bg-green-50 text-green-700 border-green-200">
              Agent Secteur
            </Badge>
            {user?.region}
          </p>
        </div>


        {/* Informations sur la Campagne Cynégétique */}
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-green-700 mr-2" />
                <CardTitle className="text-xl text-green-800">Campagne Cynégétique de Chasse 2025-2026</CardTitle>
              </div>
              <div className="text-sm font-medium text-green-700 bg-white px-3 py-1 rounded-full border border-green-300">
                {stats?.campaignSettings?.status === "active" ? "En cours" : "Fermée"}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between mt-2">
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-gray-500">Ouverture:</span>
                <span className="text-lg font-bold text-green-700">
                  {stats?.campaignSettings?.startDate ? format(new Date(stats.campaignSettings.startDate), 'dd/MM/yyyy', { locale: fr }) : "15/09/2025"}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-gray-500">Fermeture:</span>
                <span className="text-lg font-bold text-red-600">
                  {stats?.campaignSettings?.endDate ? format(new Date(stats.campaignSettings.endDate), 'dd/MM/yyyy', { locale: fr }) : "28/02/2026"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid grid-cols-4 md:w-fit">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="species">Espèces & Quotas</TabsTrigger>
            <TabsTrigger value="permits">Permis</TabsTrigger>
            <TabsTrigger value="infractions">Infractions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Permis en cours
                  </CardTitle>
                  <FileBadge className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.activePermits || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Dans votre secteur
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Permis expirés
                  </CardTitle>
                  <CreditCard className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.expiredPermits || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    À renouveler
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Chasseurs actifs
                  </CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.activeHunters || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Dans votre secteur
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Taxes collectées
                  </CardTitle>
                  <Coins className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.totalTaxes?.toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "XOF",
                    }) || "0 XOF"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ce mois
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Infractions
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalInfractions}</div>
                  <p className="text-xs text-muted-foreground">
                    {new Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF' }).format(totalFines)} d'amendes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Recettes
                  </CardTitle>
                  <Coins className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{new Intl.NumberFormat('fr-SN', { style: 'currency', currency: 'XOF' }).format(stats?.totalTaxes || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    Taxes et redevances
                  </p>
                </CardContent>
              </Card>

              {/* Ajout des informations sur les chasseurs et les guides */}
              <Card className="md:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Population de Chasseurs
                  </CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-2xl font-bold">{stats?.activeHunters || 0}</div>
                      <p className="text-xs text-muted-foreground">Chasseurs actifs</p>
                    </div>
                    <div>
                      <div className="text-xl font-semibold text-amber-600">{stats?.activeHunters ? Math.round(stats.activeHunters * 0.15) : 0}</div>
                      <p className="text-xs text-muted-foreground">Guides de chasse</p>
                    </div>
                    <div>
                      <div className="text-xl font-semibold text-green-600">{stats?.activeHunters ? Math.round(stats.activeHunters * 0.25) : 0}</div>
                      <p className="text-xs text-muted-foreground">Résidents</p>
                    </div>
                    <div>
                      <div className="text-xl font-semibold text-indigo-600">{stats?.activeHunters ? Math.round(stats.activeHunters * 0.6) : 0}</div>
                      <p className="text-xs text-muted-foreground">Touristes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Répartition des Espèces Abattues
                  </CardTitle>
                  <PieChart className="h-4 w-4 text-indigo-600" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {wildlifeData.slice(0, 4).map((species, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{species.species}</span>
                          <Progress value={(species.count / species.quota) * 100} className="h-2 w-24 mt-1" />
                        </div>
                        <div className="text-sm font-semibold">
                          {species.count}/{species.quota}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contenu supprimé - Activité récente et distribution des permis */}
          </TabsContent>

          <TabsContent value="species" className="space-y-4">
            <div className="grid gap-4 grid-cols-1">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Liste des Espèces et Quotas d'Abattage</CardTitle>
                    <Button size="sm" variant="outline" className="text-xs">
                      <ClipboardList className="h-4 w-4 mr-1" />
                      Exporter
                    </Button>
                  </div>
                  <CardDescription>
                    Suivi des abattages déclarés par rapport aux quotas autorisés dans votre secteur
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Espèce</TableHead>
                        <TableHead>Quota alloué</TableHead>
                        <TableHead>Abattages déclarés</TableHead>
                        <TableHead>% Utilisé</TableHead>
                        <TableHead className="text-right">Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {wildlifeData.map((species, index) => {
                        const percentage = (species.count / species.quota) * 100;
                        return (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{species.species}</TableCell>
                            <TableCell>{species.quota}</TableCell>
                            <TableCell>{species.count}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={percentage} className="h-2 w-24" />
                                <span className="text-xs font-medium">{Math.round(percentage)}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${percentage > 90 ? 'bg-red-100 text-red-800' : percentage > 70 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                                {percentage > 90 ? 'Critique' : percentage > 70 ? 'Attention' : 'Bon'}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="permits" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Permis délivrés par mois</CardTitle>
                  <CardDescription>Évolution mensuelle des permis dans votre secteur</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <div className="space-y-4">
                      {monthlyPermitData.map((month, index) => (
                        <div key={index} className="flex items-center">
                          <span className="w-20 text-sm">{month.month}</span>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center">
                              <div 
                                className="bg-green-500 h-3 rounded-full" 
                                style={{ width: `${(month.count / 42) * 100}%` }} 
                              />
                              <span className="ml-2 text-sm font-medium">{month.count}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Répartition des recettes</CardTitle>
                  <CardDescription>Taxes et redevances perçues (en FCFA)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <span className="text-sm font-medium">Permis de chasse</span>
                        </div>
                        <span className="text-sm font-semibold">
                          {new Intl.NumberFormat('fr-SN').format(stats?.totalTaxes ? stats.totalTaxes * 0.65 : 280000)}
                        </span>
                      </div>
                      <Progress value={65} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                          <span className="text-sm font-medium">Taxes d'abattage</span>
                        </div>
                        <span className="text-sm font-semibold">
                          {new Intl.NumberFormat('fr-SN').format(stats?.totalTaxes ? stats.totalTaxes * 0.25 : 120000)}
                        </span>
                      </div>
                      <Progress value={25} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-amber-500" />
                          <span className="text-sm font-medium">Amendes</span>
                        </div>
                        <span className="text-sm font-semibold">
                          {new Intl.NumberFormat('fr-SN').format(totalFines)}
                        </span>
                      </div>
                      <Progress value={10} className="h-2" />
                    </div>
                    
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Total</span>
                        <span className="font-bold text-lg">
                          {new Intl.NumberFormat('fr-SN').format(stats?.totalTaxes ? stats.totalTaxes + totalFines : 480000)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="infractions" className="space-y-4">
            <div className="grid gap-4 grid-cols-1">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Infractions enregistrées</CardTitle>
                    <span className="text-sm font-medium bg-red-100 text-red-800 py-1 px-3 rounded-full">
                      {totalInfractions} Infractions
                    </span>
                  </div>
                  <CardDescription>
                    Liste des infractions constatées dans votre secteur
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type d'infraction</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Montant des amendes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {infractionData.map((infraction, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium flex items-center gap-2">
                            <Ban className="h-4 w-4 text-red-600" />
                            {infraction.type}
                          </TableCell>
                          <TableCell>{infraction.count}</TableCell>
                          <TableCell className="font-semibold">
                            {new Intl.NumberFormat('fr-SN').format(infraction.fines)} FCFA
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost">
                              Détails
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <div className="flex items-center justify-between w-full">
                    <div className="text-sm text-muted-foreground">
                      Données mises à jour le {format(new Date(), 'dd MMMM yyyy', { locale: fr })}
                    </div>
                    <Button variant="outline" size="sm">
                      <ClipboardList className="h-4 w-4 mr-1" />
                      Exporter le rapport
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    
  );
}
