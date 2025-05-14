import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import { 
  Calendar, Printer, FileDown, FilterX, Filter, TrendingUp, Users, 
  Mail, Target, Layers, FileText, MapPin, PieChart as PieChartIcon,
  BarChart as BarChartIcon
} from "lucide-react";

// Types pour les statistiques départementales
interface DepartementStats {
  nom: string;
  region: string;
  permisActifs: number;
  permisExpires: number;
  piecesAbattues: number;
  chasseurs: number;
  guides: number;
  chasseursAvecGuide: number;
  quotaAtteint: number; // pourcentage
}

// Types pour les espèces chassées
interface EspeceStats {
  nom: string;
  abattues: number;
  quota: number;
  pourcentage: number;
}

// Types pour les statistiques générales
interface RegionStats {
  totalPermis: number;
  permisActifs: number;
  permisExpires: number;
  totalChasseurs: number;
  chasseursActifs: number;
  totalGuides: number;
  guidesActifs: number;
  totalPiecesAbattues: number;
  quotaTotal: number;
  quotaAtteint: number; // pourcentage
}

// Types pour les statistiques mensuelles
interface MonthlyStats {
  mois: string;
  permisDelivres: number;
  piecesAbattues: number;
}

export default function RegionalStatistics() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDepartement, setSelectedDepartement] = useState("tous");
  const [selectedYear, setSelectedYear] = useState("2025");
  const [selectedPeriod, setSelectedPeriod] = useState("saison");
  
  // Récupération des statistiques (à remplacer par une vraie API)
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/stats"],
    enabled: Boolean(user),
  });

  // Données complètes pour tous les départements du Sénégal organisés par région
  const departementsByRegion = {
    "Dakar": ["Dakar", "Guédiawaye", "Pikine", "Rufisque"],
    "Thiès": ["Mbour", "Thiès", "Tivaouane"],
    "Diourbel": ["Bambey", "Diourbel", "Mbacké"],
    "Fatick": ["Fatick", "Foundiougne", "Gossas"],
    "Kaolack": ["Guinguinéo", "Kaolack", "Nioro du Rip"],
    "Kaffrine": ["Birkelane", "Kaffrine", "Koungheul", "Malem Hodar"],
    "Kédougou": ["Kédougou", "Salemata", "Saraya"],
    "Kolda": ["Kolda", "Médina Yoro Foulah", "Vélingara"],
    "Louga": ["Kébémer", "Linguère", "Louga"],
    "Matam": ["Kanel", "Matam", "Ranérou Ferlo"],
    "Saint-Louis": ["Dagana", "Podor", "Saint-Louis"],
    "Sédhiou": ["Bounkiling", "Goudomp", "Sédhiou"],
    "Tambacounda": ["Bakel", "Goudiry", "Koumpentoum", "Tambacounda"],
    "Ziguinchor": ["Bignona", "Oussouye", "Ziguinchor"]
  };
  
  // Génération de statistiques pour tous les départements
  const allDepartements: DepartementStats[] = [];
  
  Object.entries(departementsByRegion).forEach(([region, depts]) => {
    depts.forEach(dept => {
      // Génération de données en fonction de la région (simulées mais relativement cohérentes)
      const baseActivity = region === "Dakar" ? 40 : 
                           region === "Thiès" || region === "Saint-Louis" ? 30 :
                           region === "Ziguinchor" || region === "Tambacounda" ? 25 : 15;
      
      const randomFactor = 0.5 + Math.random(); // Entre 0.5 et 1.5
      const permisActifs = Math.round(baseActivity * randomFactor);
      const chasseurs = Math.round(permisActifs * 1.1);
      
      const guides = Math.max(1, Math.round(chasseurs / 7));
      const chasseursAvecGuide = Math.round(chasseurs * (0.3 + Math.random() * 0.4)); // Entre 30% et 70% des chasseurs avec guide

      allDepartements.push({
        nom: dept,
        region: region,
        permisActifs: permisActifs,
        permisExpires: Math.round(permisActifs * 0.2),
        piecesAbattues: Math.round(permisActifs * 1.5),
        chasseurs: chasseurs,
        guides: guides,
        chasseursAvecGuide: chasseursAvecGuide,
        quotaAtteint: Math.round(30 + Math.random() * 30),
      });
    });
  });
  
  // Trier par nombre de permis actifs pour mettre en évidence les départements les plus actifs
  const departements = allDepartements.sort((a, b) => b.permisActifs - a.permisActifs);

  // Statistiques des espèces chassées
  const especesStats: EspeceStats[] = [
    { nom: "Francolin", abattues: 120, quota: 200, pourcentage: 60 },
    { nom: "Tourterelle", abattues: 85, quota: 150, pourcentage: 57 },
    { nom: "Lièvre", abattues: 45, quota: 80, pourcentage: 56 },
    { nom: "Canard", abattues: 30, quota: 60, pourcentage: 50 },
    { nom: "Pintade", abattues: 25, quota: 50, pourcentage: 50 },
    { nom: "Phacochère", abattues: 15, quota: 30, pourcentage: 50 },
  ];

  // Statistiques générales de la région
  const regionStats: RegionStats = {
    totalPermis: 175,
    permisActifs: 150,
    permisExpires: 25,
    totalChasseurs: 200,
    chasseursActifs: 169,
    totalGuides: 24,
    guidesActifs: 24,
    totalPiecesAbattues: 247,
    quotaTotal: 570,
    quotaAtteint: 43,
  };

  // Statistiques mensuelles
  const monthlyStats: MonthlyStats[] = [
    { mois: "Jan", permisDelivres: 25, piecesAbattues: 35 },
    { mois: "Fév", permisDelivres: 20, piecesAbattues: 42 },
    { mois: "Mar", permisDelivres: 15, piecesAbattues: 28 },
    { mois: "Avr", permisDelivres: 10, piecesAbattues: 18 },
    { mois: "Mai", permisDelivres: 5, piecesAbattues: 10 },
    { mois: "Juin", permisDelivres: 2, piecesAbattues: 5 },
    { mois: "Juil", permisDelivres: 0, piecesAbattues: 0 },
    { mois: "Aoû", permisDelivres: 0, piecesAbattues: 0 },
    { mois: "Sep", permisDelivres: 8, piecesAbattues: 12 },
    { mois: "Oct", permisDelivres: 30, piecesAbattues: 25 },
    { mois: "Nov", permisDelivres: 35, piecesAbattues: 42 },
    { mois: "Déc", permisDelivres: 25, piecesAbattues: 30 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Données pour le graphique en camembert des permis
  const permisData = [
    { name: 'Permis actifs', value: regionStats.permisActifs },
    { name: 'Permis expirés', value: regionStats.permisExpires },
  ];

  // Données pour le graphique en camembert des quotas
  const quotaData = [
    { name: 'Pièces abattues', value: regionStats.totalPiecesAbattues },
    { name: 'Quota restant', value: regionStats.quotaTotal - regionStats.totalPiecesAbattues },
  ];

  // Calculer le total des chasseurs avec guide par rapport au total des chasseurs
  const totalChasseurs = departements.reduce((total, dept) => total + dept.chasseurs, 0);
  const totalChasseursAvecGuide = departements.reduce((total, dept) => total + dept.chasseursAvecGuide, 0);
  const pourcentageChasseursAvecGuide = Math.round((totalChasseursAvecGuide / totalChasseurs) * 100);

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Statistiques Régionales de Chasse</h1>
        
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-1">
            <Printer className="w-4 h-4" />
            Imprimer
          </Button>
          <Button variant="outline" className="flex items-center gap-1">
            <FileDown className="w-4 h-4" />
            Exporter
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 mb-6 border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label>Département</Label>
            <Select defaultValue={selectedDepartement} onValueChange={setSelectedDepartement}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les départements" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les départements</SelectItem>
                {departements.map(dept => (
                  <SelectItem key={dept.nom} value={dept.nom.toLowerCase()}>{dept.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Année</Label>
            <Select defaultValue={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner l'année" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Période</Label>
            <Select defaultValue={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner la période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="saison">Saison entière</SelectItem>
                <SelectItem value="trimestre1">Premier trimestre</SelectItem>
                <SelectItem value="trimestre2">Deuxième trimestre</SelectItem>
                <SelectItem value="trimestre3">Troisième trimestre</SelectItem>
                <SelectItem value="trimestre4">Quatrième trimestre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end gap-2">
            <Button variant="outline" className="flex items-center gap-1">
              <Filter className="w-4 h-4" />
              Filtrer
            </Button>
            <Button variant="ghost" className="flex items-center gap-1">
              <FilterX className="w-4 h-4" />
              Réinitialiser
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            Par département
          </TabsTrigger>
          <TabsTrigger value="permits" className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            Permis
          </TabsTrigger>
          <TabsTrigger value="species" className="flex items-center gap-1">
            <Target className="w-4 h-4" />
            Espèces
          </TabsTrigger>
          <TabsTrigger value="hunters" className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            Chasseurs
          </TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Permis Actifs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold">{regionStats.permisActifs}</p>
                    <p className="text-xs text-gray-500">sur {regionStats.totalPermis} permis</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-full">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <Progress className="mt-2" value={(regionStats.permisActifs / regionStats.totalPermis) * 100} />
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round((regionStats.permisActifs / regionStats.totalPermis) * 100)}% des permis sont actifs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Pièces Abattues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold">{regionStats.totalPiecesAbattues}</p>
                    <p className="text-xs text-gray-500">sur un quota de {regionStats.quotaTotal}</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <Progress className="mt-2" value={(regionStats.totalPiecesAbattues / regionStats.quotaTotal) * 100} />
                <p className="text-xs text-gray-500 mt-1">
                  {regionStats.quotaAtteint}% du quota atteint
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Chasseurs Actifs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold">{regionStats.chasseursActifs}</p>
                    <p className="text-xs text-gray-500">sur {regionStats.totalChasseurs} chasseurs</p>
                  </div>
                  <div className="p-2 bg-amber-100 rounded-full">
                    <Users className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
                <Progress className="mt-2" value={(regionStats.chasseursActifs / regionStats.totalChasseurs) * 100} />
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round((regionStats.chasseursActifs / regionStats.totalChasseurs) * 100)}% des chasseurs sont actifs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Guides de Chasse</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold">{regionStats.guidesActifs}</p>
                    <p className="text-xs text-gray-500">sur {regionStats.totalGuides} guides</p>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-full">
                    <MapPin className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <Progress className="mt-2" value={(regionStats.guidesActifs / regionStats.totalGuides) * 100} />
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round((regionStats.guidesActifs / regionStats.totalGuides) * 100)}% des guides sont actifs
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Graphique: Tendance mensuelle */}
            <Card className="lg:col-span-2 h-80">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Tendance mensuelle</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={monthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="mois" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="permisDelivres" name="Permis délivrés" stroke="#0057b7" />
                    <Line type="monotone" dataKey="piecesAbattues" name="Pièces abattues" stroke="#ffd700" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Graphique: Distribution par espèce */}
            <Card className="h-80">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Top des espèces chassées</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={especesStats.slice(0, 5)}
                      nameKey="nom"
                      dataKey="abattues"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label
                    >
                      {especesStats.slice(0, 5).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Statistiques par département */}
        <TabsContent value="departments" className="space-y-6">
          <Card className="overflow-x-auto">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Statistiques par département</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="min-w-[800px]">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 bg-gray-50 font-medium text-gray-500">Département</th>
                      <th className="text-left py-3 px-2 bg-gray-50 font-medium text-gray-500">Région</th>
                      <th className="text-center py-3 px-2 bg-gray-50 font-medium text-gray-500">Permis Actifs</th>
                      <th className="text-center py-3 px-2 bg-gray-50 font-medium text-gray-500">Permis Expirés</th>
                      <th className="text-center py-3 px-2 bg-gray-50 font-medium text-gray-500">Pièces Abattues</th>
                      <th className="text-center py-3 px-2 bg-gray-50 font-medium text-gray-500">Chasseurs</th>
                      <th className="text-center py-3 px-2 bg-gray-50 font-medium text-gray-500">Guides</th>
                      <th className="text-center py-3 px-2 bg-gray-50 font-medium text-gray-500">Chasseurs avec Guide</th>
                      <th className="text-center py-3 px-2 bg-gray-50 font-medium text-gray-500">Quota Atteint</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departements.map((dept, index) => (
                      <tr key={dept.nom} className={index % 2 === 0 ? "" : "bg-gray-50"}>
                        <td className="py-3 px-2 font-medium">{dept.nom}</td>
                        <td className="py-3 px-2">{dept.region}</td>
                        <td className="py-3 px-2 text-center">{dept.permisActifs}</td>
                        <td className="py-3 px-2 text-center">{dept.permisExpires}</td>
                        <td className="py-3 px-2 text-center">{dept.piecesAbattues}</td>
                        <td className="py-3 px-2 text-center">{dept.chasseurs}</td>
                        <td className="py-3 px-2 text-center">{dept.guides}</td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2 mr-3 flex-1">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ width: `${Math.round((dept.chasseursAvecGuide / dept.chasseurs) * 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm">{dept.chasseursAvecGuide} ({Math.round((dept.chasseursAvecGuide / dept.chasseurs) * 100)}%)</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2 mr-3 flex-1">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${dept.quotaAtteint}%` }}
                              ></div>
                            </div>
                            <span className="text-sm">{dept.quotaAtteint}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Comparaison par Département</CardTitle>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={departements.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="nom" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="permisActifs" name="Permis Actifs" fill="#0057b7" />
                  <Bar dataKey="piecesAbattues" name="Pièces Abattues" fill="#ffd700" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistiques de permis */}
        <TabsContent value="permits" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Permis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold">{regionStats.totalPermis}</p>
                  <div className="p-2 bg-gray-100 rounded-full">
                    <FileText className="w-6 h-6 text-gray-500" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Tous types confondus</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Permis Actifs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold">{regionStats.permisActifs}</p>
                  <div className="p-2 bg-green-100 rounded-full">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Valides pour la saison en cours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Permis Expirés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold">{regionStats.permisExpires}</p>
                  <div className="p-2 bg-red-100 rounded-full">
                    <FileText className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Nécessitant un renouvellement</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Taux de Renouvellement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold">78%</p>
                  <div className="p-2 bg-blue-100 rounded-full">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Augmentation de 8% par rapport à l'année précédente</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Distribution des permis par mois</CardTitle>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mois" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="permisDelivres" name="Permis délivrés" fill="#0057b7" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistiques des espèces */}
        <TabsContent value="species" className="space-y-6">
          <Card className="overflow-x-auto">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Espèces chassées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="min-w-[600px]">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 bg-gray-50 font-medium text-gray-500">Espèce</th>
                      <th className="text-center py-3 px-2 bg-gray-50 font-medium text-gray-500">Pièces Abattues</th>
                      <th className="text-center py-3 px-2 bg-gray-50 font-medium text-gray-500">Quota</th>
                      <th className="text-center py-3 px-2 bg-gray-50 font-medium text-gray-500">Progression</th>
                    </tr>
                  </thead>
                  <tbody>
                    {especesStats.map((espece, index) => (
                      <tr key={espece.nom} className={index % 2 === 0 ? "" : "bg-gray-50"}>
                        <td className="py-3 px-2 font-medium">{espece.nom}</td>
                        <td className="py-3 px-2 text-center">{espece.abattues}</td>
                        <td className="py-3 px-2 text-center">{espece.quota}</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2 mr-3 flex-1">
                              <div 
                                className={`h-2 rounded-full ${espece.pourcentage > 80 ? 'bg-red-500' : 'bg-green-500'}`} 
                                style={{ width: `${espece.pourcentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm">{espece.pourcentage}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Comparaison des espèces chassées</CardTitle>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={especesStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="nom" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="abattues" name="Pièces abattues" fill="#0057b7" />
                  <Bar dataKey="quota" name="Quota" fill="#83a6ed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistiques des chasseurs */}
        <TabsContent value="hunters" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Chasseurs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold">{regionStats.totalChasseurs}</p>
                  <div className="p-2 bg-gray-100 rounded-full">
                    <Users className="w-6 h-6 text-gray-500" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Enregistrés dans la région</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Chasseurs Actifs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold">{regionStats.chasseursActifs}</p>
                  <div className="p-2 bg-green-100 rounded-full">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <Progress className="mt-2" value={(regionStats.chasseursActifs / regionStats.totalChasseurs) * 100} />
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round((regionStats.chasseursActifs / regionStats.totalChasseurs) * 100)}% des chasseurs sont actifs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Guides de Chasse</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold">{regionStats.guidesActifs}</p>
                  <div className="p-2 bg-purple-100 rounded-full">
                    <MapPin className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Guides actifs dans la région</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Chasseurs avec Guides</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold">{totalChasseursAvecGuide}</p>
                  <div className="p-2 bg-amber-100 rounded-full">
                    <Users className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
                <Progress className="mt-2" value={pourcentageChasseursAvecGuide} />
                <p className="text-xs text-gray-500 mt-1">{pourcentageChasseursAvecGuide}% des chasseurs chassent avec des guides</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Distribution des chasseurs par département</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={departements.slice(0, 8)}
                      nameKey="nom"
                      dataKey="chasseurs"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label
                    >
                      {departements.slice(0, 8).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Distribution des guides par département</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={departements.slice(0, 8)}
                      nameKey="nom"
                      dataKey="guides"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label
                    >
                      {departements.slice(0, 8).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between items-center mt-8 text-xs text-gray-500 border-t pt-4">
        <div>
          <p>Données mises à jour le {new Date().toLocaleDateString()}</p>
          <p>Direction des Eaux et Forêts, Chasses et Conservation des Sols du Sénégal</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-xs">
            Aide
          </Button>
          <Button variant="ghost" size="sm" className="text-xs">
            Signaler un problème
          </Button>
        </div>
      </div>
    </div>
  );
}
