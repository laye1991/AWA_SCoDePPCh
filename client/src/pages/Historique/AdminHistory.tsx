import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Search, Calendar, Clock, UserIcon, RefreshCw, Filter, AlertTriangle, FileText, User, Users, Trash, Edit, PenTool, Eye, Download, Upload, Send, Banknote, ShieldAlert } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface HistoryEvent {
  id: number;
  operation: string;
  entityType: string;
  entityId: number;
  details: string;
  userId: number | null;
  createdAt: string;
}

export default function AdminHistory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOperation, setSelectedOperation] = useState<string>("");
  const [selectedEntityType, setSelectedEntityType] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [currentTab, setCurrentTab] = useState("all");
  
  const { data: systemHistory = [], isLoading: isHistoryLoading, refetch: refetchHistory } = useQuery({
    queryKey: ["/api/history"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Obtenir les opérations uniques pour le filtre
  const uniqueOperations = Array.from(
    new Set((systemHistory as HistoryEvent[]).map((event) => event.operation))
  );

  // Obtenir les types d'entités uniques pour le filtre
  const uniqueEntityTypes = Array.from(
    new Set((systemHistory as HistoryEvent[]).map((event) => event.entityType))
  );

  // Filtrer les événements selon les critères
  const filteredHistory = (systemHistory as HistoryEvent[]).filter((event) => {
    // Filtrer par opération si une opération est sélectionnée
    if (selectedOperation && selectedOperation !== "all" && event.operation !== selectedOperation) {
      return false;
    }
    
    // Filtrer par type d'entité si un type est sélectionné
    if (selectedEntityType && selectedEntityType !== "all" && event.entityType !== selectedEntityType) {
      return false;
    }
    
    // Filtrer par date si une date est sélectionnée
    if (selectedDate) {
      const eventDate = new Date(event.createdAt).toISOString().split('T')[0];
      if (eventDate !== selectedDate) {
        return false;
      }
    }
    
    // Filtrer par texte de recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        event.details.toLowerCase().includes(query) ||
        (event.userId ? String(event.userId).includes(query) : false) ||
        event.operation.toLowerCase().includes(query) ||
        event.entityType.toLowerCase().includes(query)
      );
    }
    
    // Filtrer par onglet
    if (currentTab !== "all") {
      return event.entityType === currentTab;
    }
    
    return true;
  });

  // Fonction pour obtenir une couleur de badge en fonction du type d'entité
  const getEntityTypeColor = (entityType: string) => {
    switch (entityType) {
      case "permit":
        return "bg-blue-100 text-blue-800";
      case "user":
        return "bg-purple-100 text-purple-800";
      case "hunter":
        return "bg-amber-100 text-amber-800";
      case "system":
        return "bg-gray-100 text-gray-800";
      case "revenue":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Fonction pour obtenir une icône en fonction de l'opération
  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case "create":
        return <PenTool className="h-4 w-4 text-green-600" />;
      case "update":
        return <Edit className="h-4 w-4 text-blue-600" />;
      case "delete":
        return <Trash className="h-4 w-4 text-red-600" />;
      case "view":
        return <Eye className="h-4 w-4 text-purple-600" />;
      case "download":
        return <Download className="h-4 w-4 text-indigo-600" />;
      case "upload":
        return <Upload className="h-4 w-4 text-teal-600" />;
      case "send":
        return <Send className="h-4 w-4 text-cyan-600" />;
      case "payment":
        return <Banknote className="h-4 w-4 text-emerald-600" />;
      case "suspend":
        return <ShieldAlert className="h-4 w-4 text-amber-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  // Fonction pour formater le nom de l'opération
  const getOperationName = (operation: string) => {
    switch (operation) {
      case "create":
        return "Création";
      case "update":
        return "Modification";
      case "delete":
        return "Suppression";
      case "view":
        return "Consultation";
      case "download":
        return "Téléchargement";
      case "upload":
        return "Importation";
      case "send":
        return "Envoi";
      case "payment":
        return "Paiement";
      case "suspend":
        return "Suspension";
      default:
        return operation;
    }
  };

  // Fonction pour formater le nom du type d'entité
  const getEntityTypeName = (entityType: string) => {
    switch (entityType) {
      case "permit":
        return "Permis";
      case "user":
        return "Utilisateur";
      case "hunter":
        return "Chasseur";
      case "system":
        return "Système";
      case "revenue":
        return "Revenu";
      case "tax":
        return "Taxe";
      default:
        return entityType;
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Historique du système</h1>
        <Button
          onClick={() => refetchHistory()}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      <Card className="overflow-hidden border-0 shadow-md">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
          <CardTitle>Activités du système</CardTitle>
          <CardDescription>
            Consultez l'historique des actions effectuées sur la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex flex-1 items-center relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher dans l'historique..."
                className="pl-10"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="w-full sm:w-44">
                <Select
                  value={selectedOperation}
                  onValueChange={setSelectedOperation}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Opération" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Toutes les opérations</SelectItem>
                    {uniqueOperations.map((op) => (
                      <SelectItem key={op} value={op}>
                        {getOperationName(op)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-44">
                <Select
                  value={selectedEntityType}
                  onValueChange={setSelectedEntityType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type d'entité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les types</SelectItem>
                    {uniqueEntityTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {getEntityTypeName(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-48">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              {(selectedOperation || selectedEntityType || selectedDate || searchQuery) && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedOperation("");
                    setSelectedEntityType("");
                    setSelectedDate("");
                    setSearchQuery("");
                  }}
                  className="flex items-center gap-1"
                >
                  <Filter className="h-4 w-4" />
                  Réinitialiser
                </Button>
              )}
            </div>
          </div>

          <Tabs
            defaultValue="all"
            value={currentTab}
            onValueChange={setCurrentTab}
            className="mb-4"
          >
            <TabsList>
              <TabsTrigger value="all">Tout</TabsTrigger>
              <TabsTrigger value="permit">Permis</TabsTrigger>
              <TabsTrigger value="hunter">Chasseurs</TabsTrigger>
              <TabsTrigger value="user">Utilisateurs</TabsTrigger>
              <TabsTrigger value="revenue">Revenus</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="border rounded-md overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="py-3 px-6 text-left font-medium">Date</th>
                  <th className="py-3 px-6 text-left font-medium">Opération</th>
                  <th className="py-3 px-6 text-left font-medium">Type</th>
                  <th className="py-3 px-6 text-left font-medium">Utilisateur</th>
                  <th className="py-3 px-6 text-left font-medium">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredHistory.length > 0 ? (
                  filteredHistory
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) // Trier par date décroissante
                    .map((event) => (
                      <tr key={event.id} className="hover:bg-gray-50">
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-800">
                              {format(new Date(event.createdAt), "dd/MM/yyyy à HH:mm", {locale: fr})}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5">
                            {getOperationIcon(event.operation)}
                            <span>{getOperationName(event.operation)}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <Badge className={getEntityTypeColor(event.entityType)}>
                            {getEntityTypeName(event.entityType)}
                          </Badge>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5">
                            <UserIcon className="h-4 w-4 text-gray-500" />
                            <span>{event.userId ? `ID: ${event.userId}` : "Système"}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">{event.details}</td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      {isHistoryLoading ? "Chargement de l'historique..." : "Aucun événement trouvé"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}