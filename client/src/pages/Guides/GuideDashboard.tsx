import { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Check,
  ChevronDown,
  Eye,
  FileText,
  Home,
  Info,
  LinkIcon,
  MoreHorizontal,
  PenLine,
  Search,
  Send,
  User,
  UserPlus,
  Users
} from "lucide-react";

// Types temporaires pour le développement de l'interface
type Hunter = {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  region: string;
  permitCount: number;
  status: "active" | "inactive";
  lastActivity?: string;
};

type HuntingActivity = {
  id: number;
  date: string;
  hunterId: number;
  hunterName: string;
  location: string;
  species: string;
  count: number;
  status: "pending" | "approved" | "rejected";
};

type Alert = {
  id: number;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  category: "info" | "warning" | "danger";
};

export default function GuideDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [hunters, setHunters] = useState<Hunter[]>([]);
  const [activities, setActivities] = useState<HuntingActivity[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<HuntingActivity | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [declarationForm, setDeclarationForm] = useState({
    hunterId: "",
    species: "",
    location: "",
    date: new Date().toISOString().split('T')[0],
    count: "1",
    description: ""
  });

  useEffect(() => {
    document.title = "Espace Guide de Chasse | SCoDePP_Ch";
  }, []);

  // Simuler des données pour le développement
  useEffect(() => {
    // Simuler des chasseurs associés
    const mockHunters: Hunter[] = [
      {
        id: 1,
        name: "Moussa Diop",
        firstName: "Moussa",
        lastName: "Diop",
        region: "Tambacounda",
        permitCount: 2,
        status: "active",
        lastActivity: "2025-04-05"
      },
      {
        id: 2,
        name: "Ahmed Sarr",
        firstName: "Ahmed",
        lastName: "Sarr",
        region: "Fatick",
        permitCount: 1,
        status: "inactive"
      },
      {
        id: 3,
        name: "Jean Mendy",
        firstName: "Jean",
        lastName: "Mendy",
        region: "Ziguinchor",
        permitCount: 3,
        status: "active",
        lastActivity: "2025-04-10"
      }
    ];

    // Simuler des activités de chasse
    const mockActivities: HuntingActivity[] = [
      {
        id: 1,
        date: "2025-04-08",
        hunterId: 1,
        hunterName: "Moussa Diop",
        location: "Forêt de Niokolo-Koba, secteur Est",
        species: "Phacochère",
        count: 1,
        status: "approved"
      },
      {
        id: 2,
        date: "2025-04-10",
        hunterId: 3,
        hunterName: "Jean Mendy",
        location: "Delta du Saloum",
        species: "Canard sauvage",
        count: 3,
        status: "pending"
      },
      {
        id: 3,
        date: "2025-04-11",
        hunterId: 1,
        hunterName: "Moussa Diop",
        location: "Zone de Gouloumbou",
        species: "Francolin",
        count: 2,
        status: "pending"
      }
    ];

    // Simuler des alertes
    const mockAlerts: Alert[] = [
      {
        id: 1,
        title: "Mise à jour des quotas",
        message: "Les quotas pour la chasse au phacochère ont été mis à jour pour la saison en cours. Veuillez consulter les nouvelles limites.",
        createdAt: "2025-04-07T10:30:00",
        isRead: false,
        category: "info"
      },
      {
        id: 2,
        title: "Alerte braconnage",
        message: "Des activités de braconnage ont été signalées dans la zone de Tambacounda. Soyez vigilant et signalez toute activité suspecte.",
        createdAt: "2025-04-10T08:15:00",
        isRead: true,
        category: "warning"
      },
      {
        id: 3,
        title: "Fermeture temporaire",
        message: "La zone de chasse du secteur Kédougou-Est est temporairement fermée suite à des observations d'espèces protégées. Merci de respecter cette mesure.",
        createdAt: "2025-04-12T16:45:00",
        isRead: false,
        category: "danger"
      }
    ];

    setHunters(mockHunters);
    setActivities(mockActivities);
    setAlerts(mockAlerts);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredHunters = hunters.filter(hunter =>
    hunter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hunter.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeclarationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { name: string, value: string }) => {
    const { name, value } = 'target' in e ? e.target : e;
    setDeclarationForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDeclarationSubmit = () => {
    if (!declarationForm.hunterId || !declarationForm.species || !declarationForm.location) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    // Simuler l'envoi
    setTimeout(() => {
      setIsSubmitting(false);

      // Ajouter à la liste des activités
      const newActivity: HuntingActivity = {
        id: activities.length + 1,
        date: declarationForm.date,
        hunterId: parseInt(declarationForm.hunterId),
        hunterName: hunters.find(h => h.id === parseInt(declarationForm.hunterId))?.name || "",
        location: declarationForm.location,
        species: declarationForm.species,
        count: parseInt(declarationForm.count),
        status: "pending"
      };

      setActivities(prev => [newActivity, ...prev]);

      // Réinitialiser le formulaire
      setDeclarationForm({
        hunterId: "",
        species: "",
        location: "",
        date: new Date().toISOString().split('T')[0],
        count: "1",
        description: ""
      });

      toast({
        title: "Déclaration soumise",
        description: "Votre déclaration d'abattage a été soumise avec succès",
      });
    }, 1500);
  };

  const markAlertAsRead = (alertId: number) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Actif</Badge>;
      case "inactive":
        return <Badge variant="outline">Inactif</Badge>;
      case "approved":
        return <Badge className="bg-green-500">Approuvé</Badge>;
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">En attente</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejeté</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">
            Espace Guide de Chasse
          </h2>
        </div>

        <Tabs defaultValue="hunters" className="space-y-4">
          <TabsList className="grid w-full max-w-3xl grid-cols-4">
            <TabsTrigger value="home">
              <Home className="h-4 w-4 mr-2" />
              Accueil
            </TabsTrigger>
            <TabsTrigger value="hunters">
              <Users className="h-4 w-4 mr-2" />
              Associer des Chasseurs
            </TabsTrigger>
            <TabsTrigger value="declarations">
              <FileText className="h-4 w-4 mr-2" />
              Déclarations
            </TabsTrigger>
            <TabsTrigger value="alerts">
              <Bell className="h-4 w-4 mr-2" />
              Alertes
              {alerts.filter(a => !a.isRead).length > 0 && (
                <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500">
                  {alerts.filter(a => !a.isRead).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="permits">
              <FileText className="h-4 w-4 mr-2" />
              Mes permis
            </TabsTrigger>
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Mon profil
            </TabsTrigger>
          </TabsList>

          {/* Onglet Chasseurs Associés */}
          <TabsContent value="hunters" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Chasseurs Accompagnés</CardTitle>
                    <CardDescription>
                      Gérez les chasseurs que vous accompagnez en tant que guide
                    </CardDescription>
                  </div>
                  <Button size="sm">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Associer un chasseur
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un chasseur par nom ou région..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={handleSearchChange}
                    />
                  </div>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Chasseur</TableHead>
                        <TableHead>Région</TableHead>
                        <TableHead>Permis actifs</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Dernière activité</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHunters.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                            Aucun chasseur trouvé
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredHunters.map(hunter => (
                          <TableRow key={hunter.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-green-100 text-green-800">
                                    {hunter.firstName[0]}{hunter.lastName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{hunter.name}</div>
                                  <div className="text-xs text-muted-foreground">ID: {hunter.id}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{hunter.region}</TableCell>
                            <TableCell>{hunter.permitCount}</TableCell>
                            <TableCell>{getStatusBadge(hunter.status)}</TableCell>
                            <TableCell>
                              {hunter.lastActivity ? (
                                new Date(hunter.lastActivity).toLocaleDateString('fr-FR')
                              ) : (
                                <span className="text-muted-foreground text-sm">Aucune</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Voir détails
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <PenLine className="h-4 w-4 mr-2" />
                                    Nouvelle déclaration
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Send className="h-4 w-4 mr-2" />
                                    Envoyer message
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Déclarations d'abattage */}
          <TabsContent value="declarations" className="space-y-4">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Nouvelle Déclaration</CardTitle>
                  <CardDescription>
                    Déclarer une nouvelle activité de chasse
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="hunterId">Chasseur concerné</Label>
                    <Select
                      value={declarationForm.hunterId}
                      onValueChange={(value) => handleDeclarationChange({ name: 'hunterId', value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un chasseur" />
                      </SelectTrigger>
                      <SelectContent>
                        {hunters.map(hunter => (
                          <SelectItem key={hunter.id} value={hunter.id.toString()}>
                            {hunter.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Date de l'activité</Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      value={declarationForm.date}
                      onChange={handleDeclarationChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="species">Espèce prélevée</Label>
                    <Input
                      id="species"
                      name="species"
                      placeholder="Ex: Phacochère, Francolin..."
                      value={declarationForm.species}
                      onChange={handleDeclarationChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="count">Nombre</Label>
                    <Input
                      id="count"
                      name="count"
                      type="number"
                      min="1"
                      value={declarationForm.count}
                      onChange={handleDeclarationChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Lieu</Label>
                    <Input
                      id="location"
                      name="location"
                      placeholder="Localisation précise"
                      value={declarationForm.location}
                      onChange={handleDeclarationChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Détails supplémentaires</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Précisions sur les conditions de chasse..."
                      rows={3}
                      value={declarationForm.description}
                      onChange={handleDeclarationChange}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleDeclarationSubmit} disabled={isSubmitting} className="w-full">
                    {isSubmitting ? (
                      <span className="animate-spin mr-2">◌</span>
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    {isSubmitting ? "Envoi en cours..." : "Soumettre la déclaration"}
                  </Button>
                </CardFooter>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Historique des déclarations</CardTitle>
                  <CardDescription>
                    Suivi des activités de chasse déclarées
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Chasseur</TableHead>
                          <TableHead>Espèce</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activities.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                              Aucune déclaration d'activité trouvée
                            </TableCell>
                          </TableRow>
                        ) : (
                          activities.map(activity => (
                            <TableRow key={activity.id}>
                              <TableCell>
                                {new Date(activity.date).toLocaleDateString('fr-FR')}
                              </TableCell>
                              <TableCell>{activity.hunterName}</TableCell>
                              <TableCell>{activity.species}</TableCell>
                              <TableCell>{activity.count}</TableCell>
                              <TableCell>{getStatusBadge(activity.status)}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedActivity(activity)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Détails
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Modal/Dialog pour afficher les détails d'une activité */}
                  {selectedActivity && (
                    <AlertDialog open={!!selectedActivity} onOpenChange={() => setSelectedActivity(null)}>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Détails de la déclaration</AlertDialogTitle>
                          <AlertDialogDescription>
                            Informations détaillées sur l'activité de chasse
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground">Date</h4>
                              <p>{new Date(selectedActivity.date).toLocaleDateString('fr-FR')}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground">Statut</h4>
                              <p>{getStatusBadge(selectedActivity.status)}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground">Chasseur</h4>
                              <p>{selectedActivity.hunterName}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground">ID Chasseur</h4>
                              <p>{selectedActivity.hunterId}</p>
                            </div>
                            <div className="col-span-2">
                              <h4 className="text-sm font-medium text-muted-foreground">Lieu</h4>
                              <p>{selectedActivity.location}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground">Espèce</h4>
                              <p>{selectedActivity.species}</p>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground">Nombre</h4>
                              <p>{selectedActivity.count}</p>
                            </div>
                          </div>
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Fermer</AlertDialogCancel>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Onglet Alertes */}
          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Alertes et Notifications</CardTitle>
                <CardDescription>
                  Consultez vos alertes et messages importants
                </CardDescription>
              </CardHeader>
              <CardContent>
                {alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <Info className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucune alerte disponible</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {alerts.map(alert => {
                      let alertStyle = "";
                      switch (alert.category) {
                        case "info":
                          alertStyle = "bg-blue-50 border-blue-200";
                          break;
                        case "warning":
                          alertStyle = "bg-yellow-50 border-yellow-200";
                          break;
                        case "danger":
                          alertStyle = "bg-red-50 border-red-200";
                          break;
                      }

                      return (
                        <div
                          key={alert.id}
                          className={`rounded-lg border p-4 ${alertStyle} ${!alert.isRead ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold mb-1">{alert.title}</h3>
                              <p className="text-sm text-muted-foreground mb-2">
                                {new Date(alert.createdAt).toLocaleString('fr-FR')}
                              </p>
                              <p className="text-sm">{alert.message}</p>
                            </div>
                            {!alert.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAlertAsRead(alert.id)}
                                className="mt-2"
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Marquer comme lu
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Profil */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mon Profil Guide de Chasse</CardTitle>
                <CardDescription>
                  Consultez et gérez vos informations personnelles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="md:w-1/3 flex flex-col items-center">
                    <Avatar className="h-32 w-32 mb-4">
                      <AvatarFallback className="text-4xl bg-green-100 text-green-800">
                        {user?.firstName?.[0] || "G"}{user?.lastName?.[0] || "C"}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-xl font-medium">
                      {user?.firstName || "Mamadou"} {user?.lastName || "Diallo"}
                    </h3>
                    <p className="text-muted-foreground">Guide de Chasse</p>

                    <div className="mt-6 w-full max-w-xs">
                      <div className="rounded-md border p-3 mb-3">
                        <h4 className="font-medium mb-2">Région d'activité</h4>
                        <p>Tambacounda</p>
                      </div>

                      <div className="rounded-md border p-3 mb-3">
                        <h4 className="font-medium mb-2">Numéro d'agrément</h4>
                        <p>GC-2025-145</p>
                      </div>

                      <div className="rounded-md border p-3">
                        <h4 className="font-medium mb-2">Date d'agrément</h4>
                        <p>15/01/2025</p>
                      </div>
                    </div>
                  </div>

                  <div className="md:w-2/3">
                    <h3 className="text-lg font-medium mb-4">Informations personnelles</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <Label>Prénom</Label>
                        <Input value={user?.firstName || "Mamadou"} disabled />
                      </div>
                      <div className="space-y-1">
                        <Label>Nom</Label>
                        <Input value={user?.lastName || "Diallo"} disabled />
                      </div>
                      <div className="space-y-1">
                        <Label>Email</Label>
                        <Input value={user?.email || "mamadou.diallo@example.com"} disabled />
                      </div>
                      <div className="space-y-1">
                        <Label>Téléphone</Label>
                        <Input value={user?.phone || "+221 77 123 45 67"} disabled />
                      </div>
                      <div className="space-y-1 col-span-2">
                        <Label>Adresse</Label>
                        <Input value="Quartier Nourou, Tambacounda, Sénégal" disabled />
                      </div>

                      <div className="space-y-1">
                        <Label>Expérience (années)</Label>
                        <Input value="8" disabled />
                      </div>
                      <div className="space-y-1">
                        <Label>Langues parlées</Label>
                        <Input value="Français, Wolof, Pulaar" disabled />
                      </div>

                      <div className="space-y-1 col-span-2">
                        <Label>Spécialités</Label>
                        <Input value="Chasse au phacochère, pistage, grande faune" disabled />
                      </div>
                    </div>

                    <h3 className="text-lg font-medium mt-8 mb-4">Statistiques</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-base">Chasseurs accompagnés</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <p className="text-3xl font-bold">{hunters.length}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-base">Déclarations soumises</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <p className="text-3xl font-bold">{activities.length}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-base">Taux d'approbation</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <p className="text-3xl font-bold">
                            {activities.length > 0
                              ? Math.round((activities.filter(a => a.status === "approved").length / activities.length) * 100)
                              : 0}%
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="outline">
                  <PenLine className="h-4 w-4 mr-2" />
                  Demander une mise à jour du profil
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}