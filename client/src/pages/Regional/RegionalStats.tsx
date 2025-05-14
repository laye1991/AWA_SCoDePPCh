import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { CalendarDays, CreditCard, ArrowUpDown, Loader2, MapPin, Users, FileBadge, ActivitySquare } from "lucide-react";

export default function RegionalStatsPage() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("all");

  // Récupérer les informations de l'agent connecté
  const { data: agentInfo } = useQuery({
    queryKey: ["/api/users/me"],
    queryFn: () => apiRequest({ url: "/api/auth/me", method: "GET" }),
    enabled: !!user && user.role === "agent",
  });

  // Région de l'agent connecté
  const agentRegion = agentInfo?.region || "";

  // Récupérer les statistiques régionales
  const { data: regionalStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/stats/regional", agentRegion, selectedPeriod],
    queryFn: () => apiRequest({ 
      url: `/api/stats/regional?region=${agentRegion}&period=${selectedPeriod}`, 
      method: "GET" 
    }),
    enabled: !!agentRegion,
  });

  // Récupérer l'évolution des permis par mois dans la région
  const { data: permitsByMonth, isLoading: isLoadingPermitsByMonth } = useQuery({
    queryKey: ["/api/stats/regional/permits-by-month", agentRegion],
    queryFn: () => apiRequest({ 
      url: `/api/stats/regional/permits-by-month?region=${agentRegion}`, 
      method: "GET" 
    }),
    enabled: !!agentRegion,
  });

  // Récupérer la répartition des revenus par type
  const { data: revenueByType, isLoading: isLoadingRevenueByType } = useQuery({
    queryKey: ["/api/stats/regional/revenue-by-type", agentRegion],
    queryFn: () => apiRequest({ 
      url: `/api/stats/regional/revenue-by-type?region=${agentRegion}`, 
      method: "GET" 
    }),
    enabled: !!agentRegion,
  });

  // Récupérer la distribution des taxes
  const { data: taxDistribution, isLoading: isLoadingTaxDistribution } = useQuery({
    queryKey: ["/api/stats/regional/tax-distribution", agentRegion],
    queryFn: () => apiRequest({ 
      url: `/api/stats/regional/tax-distribution?region=${agentRegion}`, 
      method: "GET" 
    }),
    enabled: !!agentRegion,
  });

  // Couleurs pour les graphiques
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

  // Formatage de la monnaie
  const formatMoney = (amount: number) => {
    return amount.toLocaleString() + " FCFA";
  };

  // Simulation de données si l'API n'est pas encore implémentée
  const dummyRegionalStats = {
    hunterCount: 45,
    activePermitCount: 32,
    expiredPermitCount: 67,
    taxCount: 23,
    revenue: 2450000,
    pendingRequests: 5,
  };

  const dummyPermitsByMonth = [
    { month: "Jan", count: 5 },
    { month: "Fév", count: 8 },
    { month: "Mar", count: 12 },
    { month: "Avr", count: 15 },
    { month: "Mai", count: 7 },
    { month: "Juin", count: 3 },
    { month: "Juil", count: 0 },
    { month: "Août", count: 0 },
    { month: "Sep", count: 0 },
    { month: "Oct", count: 4 },
    { month: "Nov", count: 10 },
    { month: "Déc", count: 14 },
  ];

  const dummyRevenueByType = [
    { name: "Permis petite chasse", value: 1250000 },
    { name: "Permis grande chasse", value: 750000 },
    { name: "Permis gibier d'eau", value: 150000 },
    { name: "Taxes d'abattage", value: 300000 },
  ];

  const dummyTaxDistribution = [
    { name: "Phacochère", count: 45, amount: 225000 },
    { name: "Autres espèces", count: 15, amount: 75000 },
  ];

  // Données utilisées pour les graphiques (API ou simulation)
  const stats = regionalStats || dummyRegionalStats;
  const permits = permitsByMonth || dummyPermitsByMonth;
  const revenues = revenueByType || dummyRevenueByType;
  const taxes = taxDistribution || dummyTaxDistribution;

  if (!user || user.role !== "agent") {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Accès refusé</CardTitle>
            <CardDescription>
              Vous devez être connecté en tant qu'agent pour accéder aux statistiques régionales.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Cette page est réservée aux agents des Eaux et Forêts.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Statistiques Régionales</h1>
          <p className="text-muted-foreground mt-1">
            <MapPin className="inline-block mr-1 h-4 w-4" />
            {agentInfo?.region ? `Région de ${agentInfo.region}` : "Chargement..."}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toute la période</SelectItem>
              <SelectItem value="current_year">Année en cours</SelectItem>
              <SelectItem value="current_month">Mois en cours</SelectItem>
              <SelectItem value="current_campaign">Campagne en cours</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon">
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Chasseurs enregistrés</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hunterCount}</div>
            <p className="text-xs text-muted-foreground">Région de {agentInfo?.region}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Permis actifs</CardTitle>
            <FileBadge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePermitCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.expiredPermitCount} permis expirés
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxes enregistrées</CardTitle>
            <ActivitySquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.taxCount}</div>
            <p className="text-xs text-muted-foreground">
              Pour la saison en cours
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenus</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(stats.revenue)}</div>
            <p className="text-xs text-muted-foreground">
              <CalendarDays className="inline mr-1 h-3 w-3" />
              Total {selectedPeriod === "current_year" ? "de l'année" : "de la période"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <Tabs defaultValue="permits" className="space-y-4">
        <TabsList>
          <TabsTrigger value="permits">Évolution des permis</TabsTrigger>
          <TabsTrigger value="revenue">Répartition des revenus</TabsTrigger>
          <TabsTrigger value="taxes">Taxes d'abattage</TabsTrigger>
        </TabsList>
        
        <TabsContent value="permits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Évolution des permis par mois</CardTitle>
              <CardDescription>
                Nombre de permis délivrés dans la région au cours des 12 derniers mois
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              {isLoadingPermitsByMonth ? (
                <div className="flex items-center justify-center h-80">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={permits}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} permis`, "Nombre"]} />
                    <Legend />
                    <Bar dataKey="count" name="Nombre de permis" fill="#0088FE" barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Répartition des revenus par type</CardTitle>
              <CardDescription>
                Distribution des revenus par type de permis et taxes d'abattage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRevenueByType ? (
                <div className="flex items-center justify-center h-80">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={revenues}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {revenues.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${formatMoney(value as number)}`, "Montant"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {revenues.map((item, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{item.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatMoney(item.value)}</div>
                  <p className="text-xs text-muted-foreground">
                    {((item.value / stats.revenue) * 100).toFixed(1)}% du total
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="taxes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribution des taxes d'abattage</CardTitle>
              <CardDescription>
                Répartition des taxes par espèce et montants associés
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTaxDistribution ? (
                <div className="flex items-center justify-center h-80">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Nombre d'animaux abattus par espèce</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={taxes}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, count, percent }) => `${name}: ${count} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {taxes.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} animaux`, "Nombre"]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Montant des taxes par espèce</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={taxes}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="amount"
                        >
                          {taxes.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index + 2 % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${formatMoney(value as number)}`, "Montant"]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {taxes.map((item, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{item.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{item.count} abattages</div>
                  <p className="text-lg font-medium">{formatMoney(item.amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatMoney(item.amount / item.count)} par animal
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}