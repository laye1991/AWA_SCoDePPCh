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

export default function History() {
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
      case "login":
        return <User className="h-4 w-4 text-purple-600" />;
      case "view":
        return <Eye className="h-4 w-4 text-gray-600" />;
      case "download":
        return <Download className="h-4 w-4 text-blue-800" />;
      case "upload":
        return <Upload className="h-4 w-4 text-blue-600" />;
      case "sms_notification":
        return <Send className="h-4 w-4 text-amber-600" />;
      case "payment":
        return <Banknote className="h-4 w-4 text-green-600" />;
      case "alert":
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case "error":
        return <ShieldAlert className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  // Fonction pour traduire le nom de l'opération
  const getOperationName = (operation: string) => {
    switch (operation) {
      case "create":
        return "Création";
      case "update":
        return "Modification";
      case "delete":
        return "Suppression";
      case "login":
        return "Connexion";
      case "view":
        return "Consultation";
      case "download":
        return "Téléchargement";
      case "upload":
        return "Importation";
      case "sms_notification":
        return "Notification SMS";
      case "payment":
        return "Paiement";
      case "alert":
        return "Alerte";
      case "error":
        return "Erreur";
      default:
        return operation;
    }
  };

  // Fonction pour traduire le type d'entité
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
        return "Finance";
      case "tax":
        return "Taxe";
      default:
        return entityType;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <h1 className="text-2xl font-bold text-neutral-800 mb-4 md:mb-0">Historique des Activités</h1>
        <Button 
          variant="outline" 
          onClick={() => refetchHistory()}
          className="flex items-center gap-2"
          disabled={isHistoryLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isHistoryLoading ? 'animate-spin' : ''}`} />
          {isHistoryLoading ? 'Actualisation...' : 'Rafraîchir'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <CardDescription>Filtrer les événements par type, opération, date ou recherche</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor="search">Recherche</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  id="search"
                  placeholder="Rechercher..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="operation">Opération</Label>
              <Select 
                value={selectedOperation} 
                onValueChange={setSelectedOperation}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les opérations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les opérations</SelectItem>
                  {uniqueOperations.map((operation) => (
                    <SelectItem key={operation} value={operation}>
                      {getOperationName(operation)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="entityType">Type d'entité</Label>
              <Select 
                value={selectedEntityType} 
                onValueChange={setSelectedEntityType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {uniqueEntityTypes.map((entityType) => (
                    <SelectItem key={entityType} value={entityType}>
                      {getEntityTypeName(entityType)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <div className="relative">
                <Calendar className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  id="date"
                  type="date"
                  className="pl-8"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-6 mb-6">
          <TabsTrigger value="all">Tout</TabsTrigger>
          <TabsTrigger value="permit">Permis</TabsTrigger>
          <TabsTrigger value="hunter">Chasseurs</TabsTrigger>
          <TabsTrigger value="user">Utilisateurs</TabsTrigger>
          <TabsTrigger value="revenue">Finance</TabsTrigger>
          <TabsTrigger value="system">Système</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="py-4 px-6 font-medium">Date et Heure</th>
                <th className="py-4 px-6 font-medium">Opération</th>
                <th className="py-4 px-6 font-medium">Type</th>
                <th className="py-4 px-6 font-medium">Utilisateur</th>
                <th className="py-4 px-6 font-medium">Détails</th>
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
      </Card>
    </div>
  );
}
