import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Check,
  ChevronDown,
  Edit2,
  Eye,
  FileText,
  Filter,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Shield,
  Trash2,
  User,
  UserPlus
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";

// Types pour les guides de chasse
type Guide = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  region: string;
  licenseNumber: string;
  status: "active" | "inactive" | "suspended";
  experience: number;
  createdAt: string;
  hunterCount: number;
};

export default function GuidesList() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [newGuideData, setNewGuideData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    region: "",
    experience: "",
  });

  // Simuler un chargement des données
  const { data: guides = [], isLoading } = useQuery({
    queryKey: ["guides"],
    queryFn: async () => {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Données simulées
      return [
        {
          id: 1,
          firstName: "Mamadou",
          lastName: "Diallo",
          email: "mamadou.diallo@example.com",
          phone: "+221 77 123 45 67",
          region: "Tambacounda",
          licenseNumber: "GC-2025-145",
          status: "active",
          experience: 8,
          createdAt: "2023-05-12",
          hunterCount: 4
        },
        {
          id: 2,
          firstName: "Ibrahim",
          lastName: "Sow",
          email: "ibrahim.sow@example.com",
          phone: "+221 76 234 56 78",
          region: "Kédougou",
          licenseNumber: "GC-2025-089",
          status: "active",
          experience: 12,
          createdAt: "2020-11-03",
          hunterCount: 7
        },
        {
          id: 3,
          firstName: "Jean",
          lastName: "Mendy",
          email: "jean.mendy@example.com",
          phone: "+221 78 345 67 89",
          region: "Ziguinchor",
          licenseNumber: "GC-2025-217",
          status: "inactive",
          experience: 5,
          createdAt: "2024-01-15",
          hunterCount: 2
        },
        {
          id: 4,
          firstName: "Moussa",
          lastName: "Gueye",
          email: "moussa.gueye@example.com",
          phone: "+221 70 456 78 90",
          region: "Fatick",
          licenseNumber: "GC-2025-132",
          status: "suspended",
          experience: 3,
          createdAt: "2024-02-28",
          hunterCount: 0
        },
        {
          id: 5,
          firstName: "Amadou",
          lastName: "Balde",
          email: "amadou.balde@example.com",
          phone: "+221 75 567 89 01",
          region: "Kolda",
          licenseNumber: "GC-2025-178",
          status: "active",
          experience: 10,
          createdAt: "2022-07-19",
          hunterCount: 6
        }
      ] as Guide[];
    }
  });

  // Filtrage des guides
  const filteredGuides = guides.filter(guide => {
    const matchesSearch =
      guide.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || guide.status === statusFilter;
    const matchesRegion = regionFilter === "all" || guide.region === regionFilter;

    return matchesSearch && matchesStatus && matchesRegion;
  });

  // Liste de toutes les régions uniques
  const regions = Array.from(new Set(guides.map(guide => guide.region))).sort();

  const handleAddGuide = () => {
    // Validation des champs
    if (!newGuideData.firstName || !newGuideData.lastName || !newGuideData.email || !newGuideData.region) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    // Simuler l'ajout
    toast({
      title: "Guide de chasse ajouté",
      description: `${newGuideData.firstName} ${newGuideData.lastName} a été ajouté avec succès.`,
    });

    // Réinitialiser et fermer
    setNewGuideData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      region: "",
      experience: "",
    });
    setIsAddDialogOpen(false);
  };

  const handleEditGuide = () => {
    if (!selectedGuide) return;

    toast({
      title: "Guide de chasse modifié",
      description: `Les informations de ${selectedGuide.firstName} ${selectedGuide.lastName} ont été mises à jour.`,
    });

    setIsEditDialogOpen(false);
    setSelectedGuide(null);
  };

  const handleStatusChange = (guideId: number, newStatus: "active" | "inactive" | "suspended") => {
    const guide = guides.find(g => g.id === guideId);
    if (!guide) return;

    toast({
      title: "Statut mis à jour",
      description: `Le statut de ${guide.firstName} ${guide.lastName} a été changé en "${newStatus === "active" ? "Actif" :
          newStatus === "inactive" ? "Inactif" :
            "Suspendu"
        }".`,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Actif</Badge>;
      case "inactive":
        return <Badge variant="outline">Inactif</Badge>;
      case "suspended":
        return <Badge variant="destructive">Suspendu</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">
            Gestion des Guides de Chasse
          </h2>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Ajouter un guide
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Guides de Chasse</CardTitle>
            <CardDescription>
              Gérez les guides de chasse enregistrés dans le système
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
              <div className="relative max-w-md">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, email ou numéro de licence..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex flex-col md:flex-row gap-2 md:gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="statusFilter" className="whitespace-nowrap">Statut:</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="statusFilter" className="w-[120px]">
                      <SelectValue placeholder="Tous" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="active">Actifs</SelectItem>
                      <SelectItem value="inactive">Inactifs</SelectItem>
                      <SelectItem value="suspended">Suspendus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Label htmlFor="regionFilter" className="whitespace-nowrap">Région:</Label>
                  <Select value={regionFilter} onValueChange={setRegionFilter}>
                    <SelectTrigger id="regionFilter" className="w-[150px]">
                      <SelectValue placeholder="Toutes les régions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les régions</SelectItem>
                      {regions.map(region => (
                        <SelectItem key={region} value={region}>{region}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guide</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Région</TableHead>
                    <TableHead>№ Licence</TableHead>
                    <TableHead>Expérience</TableHead>
                    <TableHead>Chasseurs</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-sm text-muted-foreground">Chargement des guides...</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredGuides.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                        <FileText className="h-8 w-8 mx-auto mb-2" />
                        <p>Aucun guide de chasse trouvé</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredGuides.map(guide => (
                      <TableRow key={guide.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-yellow-100 text-yellow-800">
                                {guide.firstName[0]}{guide.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{guide.firstName} {guide.lastName}</div>
                              <div className="text-xs text-muted-foreground">Ajouté le {new Date(guide.createdAt).toLocaleDateString('fr-FR')}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{guide.email}</div>
                          <div className="text-xs text-muted-foreground">{guide.phone}</div>
                        </TableCell>
                        <TableCell>{guide.region}</TableCell>
                        <TableCell><code className="px-1 py-0.5 bg-muted rounded text-xs">{guide.licenseNumber}</code></TableCell>
                        <TableCell>{guide.experience} ans</TableCell>
                        <TableCell>{guide.hunterCount}</TableCell>
                        <TableCell>{getStatusBadge(guide.status)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedGuide(guide);
                                setIsEditDialogOpen(true);
                              }}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                Voir détails
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <User className="h-4 w-4 mr-2" />
                                Chasseurs associés
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {guide.status === "active" ? (
                                <DropdownMenuItem onClick={() => handleStatusChange(guide.id, "inactive")}>
                                  <Shield className="h-4 w-4 mr-2 text-amber-500" />
                                  Désactiver
                                </DropdownMenuItem>
                              ) : guide.status === "inactive" ? (
                                <DropdownMenuItem onClick={() => handleStatusChange(guide.id, "active")}>
                                  <Check className="h-4 w-4 mr-2 text-green-500" />
                                  Activer
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleStatusChange(guide.id, "active")}>
                                  <Check className="h-4 w-4 mr-2 text-green-500" />
                                  Réactiver
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
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
      </div>

      {/* Dialog pour ajouter un guide */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[475px]">
          <DialogHeader>
            <DialogTitle>Ajouter un nouveau guide de chasse</DialogTitle>
            <DialogDescription>
              Remplissez le formulaire ci-dessous pour créer un nouveau compte guide.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  value={newGuideData.firstName}
                  onChange={(e) => setNewGuideData({ ...newGuideData, firstName: e.target.value })}
                  placeholder="Prénom"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  value={newGuideData.lastName}
                  onChange={(e) => setNewGuideData({ ...newGuideData, lastName: e.target.value })}
                  placeholder="Nom"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newGuideData.email}
                onChange={(e) => setNewGuideData({ ...newGuideData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={newGuideData.phone}
                onChange={(e) => setNewGuideData({ ...newGuideData, phone: e.target.value })}
                placeholder="+221 XX XXX XX XX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Région *</Label>
              <Select
                value={newGuideData.region}
                onValueChange={(value) => setNewGuideData({ ...newGuideData, region: value })}
              >
                <SelectTrigger id="region">
                  <SelectValue placeholder="Sélectionner une région" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dakar">Dakar</SelectItem>
                  <SelectItem value="Thiès">Thiès</SelectItem>
                  <SelectItem value="Saint-Louis">Saint-Louis</SelectItem>
                  <SelectItem value="Louga">Louga</SelectItem>
                  <SelectItem value="Fatick">Fatick</SelectItem>
                  <SelectItem value="Kaolack">Kaolack</SelectItem>
                  <SelectItem value="Kaffrine">Kaffrine</SelectItem>
                  <SelectItem value="Matam">Matam</SelectItem>
                  <SelectItem value="Tambacounda">Tambacounda</SelectItem>
                  <SelectItem value="Kédougou">Kédougou</SelectItem>
                  <SelectItem value="Kolda">Kolda</SelectItem>
                  <SelectItem value="Sédhiou">Sédhiou</SelectItem>
                  <SelectItem value="Ziguinchor">Ziguinchor</SelectItem>
                  <SelectItem value="Diourbel">Diourbel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">Expérience (années)</Label>
              <Input
                id="experience"
                type="number"
                min="0"
                value={newGuideData.experience}
                onChange={(e) => setNewGuideData({ ...newGuideData, experience: e.target.value })}
                placeholder="Années d'expérience"
              />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Switch id="sendCredsEmail" />
              <Label htmlFor="sendCredsEmail">Envoyer un email avec les identifiants de connexion</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleAddGuide}>Créer le compte</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pour modifier un guide */}
      {selectedGuide && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[475px]">
            <DialogHeader>
              <DialogTitle>Modifier le guide de chasse</DialogTitle>
              <DialogDescription>
                Modifiez les informations de {selectedGuide.firstName} {selectedGuide.lastName}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName">Prénom</Label>
                  <Input
                    id="edit-firstName"
                    defaultValue={selectedGuide.firstName}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastName">Nom</Label>
                  <Input
                    id="edit-lastName"
                    defaultValue={selectedGuide.lastName}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  defaultValue={selectedGuide.email}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Téléphone</Label>
                <Input
                  id="edit-phone"
                  defaultValue={selectedGuide.phone}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-region">Région</Label>
                <Select defaultValue={selectedGuide.region}>
                  <SelectTrigger id="edit-region">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dakar">Dakar</SelectItem>
                    <SelectItem value="Thiès">Thiès</SelectItem>
                    <SelectItem value="Saint-Louis">Saint-Louis</SelectItem>
                    <SelectItem value="Louga">Louga</SelectItem>
                    <SelectItem value="Fatick">Fatick</SelectItem>
                    <SelectItem value="Kaolack">Kaolack</SelectItem>
                    <SelectItem value="Kaffrine">Kaffrine</SelectItem>
                    <SelectItem value="Matam">Matam</SelectItem>
                    <SelectItem value="Tambacounda">Tambacounda</SelectItem>
                    <SelectItem value="Kédougou">Kédougou</SelectItem>
                    <SelectItem value="Kolda">Kolda</SelectItem>
                    <SelectItem value="Sédhiou">Sédhiou</SelectItem>
                    <SelectItem value="Ziguinchor">Ziguinchor</SelectItem>
                    <SelectItem value="Diourbel">Diourbel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-experience">Expérience (années)</Label>
                <Input
                  id="edit-experience"
                  type="number"
                  min="0"
                  defaultValue={selectedGuide.experience}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Statut</Label>
                <Select defaultValue={selectedGuide.status}>
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                    <SelectItem value="suspended">Suspendu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleEditGuide}>Enregistrer les modifications</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </MainLayout>
  );
}