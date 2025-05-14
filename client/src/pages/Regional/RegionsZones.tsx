import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, MapPin, Globe, Edit, Plus, Trash2 } from "lucide-react";

export default function RegionsZones() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("hunting-zones");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Zones de chasse au Sénégal
  const [huntingZones] = useState([
    { id: 1, name: "ZIC de Djeuss", region: "Saint-Louis", area: 15000, status: "active" },
    { id: 2, name: "ZIC de Niombato", region: "Fatick", area: 22000, status: "active" },
    { id: 3, name: "ZIC de Baobolong", region: "Kaffrine", area: 18500, status: "active" },
    { id: 4, name: "ZIC de la Falémé", region: "Tambacounda", area: 25000, status: "active" },
    { id: 5, name: "Zones amodiées", region: "Multiple", area: 120000, status: "active" },
    { id: 6, name: "Sur le territoire national", region: "Tout le pays", area: 0, status: "special" },
  ]);
  
  // Régions du Sénégal
  const [regions] = useState([
    { id: 1, name: "Dakar", code: "DK", area: 550, districts: 4, departments: 4 },
    { id: 2, name: "Thiès", code: "TH", area: 6601, districts: 3, departments: 3 },
    { id: 3, name: "Saint-Louis", code: "SL", area: 19044, districts: 3, departments: 3 },
    { id: 4, name: "Tambacounda", code: "TC", area: 42364, districts: 3, departments: 4 },
    { id: 5, name: "Kédougou", code: "KD", area: 16800, districts: 3, departments: 3 },
    { id: 6, name: "Kolda", code: "KL", area: 13718, districts: 3, departments: 3 },
    { id: 7, name: "Ziguinchor", code: "ZG", area: 7339, districts: 3, departments: 3 },
    { id: 8, name: "Louga", code: "LG", area: 29188, districts: 3, departments: 3 },
    { id: 9, name: "Diourbel", code: "DB", area: 4769, districts: 3, departments: 3 },
    { id: 10, name: "Fatick", code: "FK", area: 7935, districts: 3, departments: 3 },
    { id: 11, name: "Kaolack", code: "KL", area: 5357, districts: 3, departments: 3 },
    { id: 12, name: "Kaffrine", code: "KF", area: 11853, districts: 3, departments: 4 },
    { id: 13, name: "Matam", code: "MT", area: 25083, districts: 3, departments: 3 },
    { id: 14, name: "Sédhiou", code: "SD", area: 7293, districts: 3, departments: 3 },
  ]);
  
  // Filtrer les zones de chasse selon la recherche
  const filteredHuntingZones = huntingZones.filter(zone =>
    zone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    zone.region.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Filtrer les régions selon la recherche
  const filteredRegions = regions.filter(region =>
    region.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    region.code.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const addNewZone = () => {
    toast({
      title: "Fonctionnalité à implémenter",
      description: "L'ajout de nouvelles zones sera disponible prochainement",
    });
  };
  
  const addNewRegion = () => {
    toast({
      title: "Fonctionnalité à implémenter",
      description: "L'ajout de nouvelles régions sera disponible prochainement",
    });
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Régions et Zones de Chasse</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <div className="bg-green-100 p-2 rounded-full mr-2">
              <MapPin className="h-5 w-5 text-green-700" />
            </div>
            Gestion des Régions et Zones
          </CardTitle>
          <CardDescription>
            Consultez et gérez les régions administratives et les zones de chasse du Sénégal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-md mb-4">
            <p className="text-sm text-amber-800">
              Les zones d'intérêt cynégétique (ZIC) sont des zones délimitées pour la pratique de la chasse. 
              Les permis de chasse peuvent être délivrés pour des zones spécifiques ou pour l'ensemble du territoire national.
            </p>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex items-center space-x-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input 
            placeholder="Rechercher une région ou une zone de chasse..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <Tabs defaultValue="hunting-zones" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="hunting-zones">Zones de Chasse</TabsTrigger>
          <TabsTrigger value="regions">Régions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="hunting-zones" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Zones de Chasse</h2>
            <Button onClick={addNewZone} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Ajouter une zone
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredHuntingZones.map((zone) => (
              <Card key={zone.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <CardTitle className="text-lg">{zone.name}</CardTitle>
                    <Badge variant={zone.status === "active" ? "default" : "secondary"}>
                      {zone.status === "active" ? "Active" : "Spéciale"}
                    </Badge>
                  </div>
                  <CardDescription>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-gray-500" />
                      {zone.region}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    <span className="font-medium">Superficie:</span> {zone.area > 0 ? `${zone.area} km²` : "N/A"}
                  </div>
                  <div className="flex justify-end mt-3">
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Edit className="h-3 w-3" />
                      Éditer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredHuntingZones.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-md">
              <p className="text-gray-500">Aucune zone de chasse ne correspond à votre recherche</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="regions" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Régions</h2>
            <Button onClick={addNewRegion} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Ajouter une région
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRegions.map((region) => (
              <Card key={region.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{region.name}</CardTitle>
                    <Badge>{region.code}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Superficie:</span>
                      <span>{region.area} km²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Départements:</span>
                      <span>{region.departments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Arrondissements:</span>
                      <span>{region.districts}</span>
                    </div>
                  </div>
                  <div className="flex justify-end mt-3">
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Edit className="h-3 w-3" />
                      Éditer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredRegions.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-md">
              <p className="text-gray-500">Aucune région ne correspond à votre recherche</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}