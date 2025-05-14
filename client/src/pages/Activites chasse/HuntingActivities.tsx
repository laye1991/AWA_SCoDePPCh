import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Plus, Minus, Edit, Check, AlertCircle, Filter, RefreshCcw, MapPin, Calendar, Users, Eye, FileSpreadsheet, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

// Types pour les activités de chasse
interface HuntingSpecies {
  id: string;
  name: string;
  category: string;
  count: number;
}

interface HuntingActivity {
  id: string;
  date: string;
  zone: string;
  region?: string;
  permitNumber: string;
  species: HuntingSpecies[];
  guideId?: string;
  guideName?: string;
  status?: string;
  coordinates?: string;
  notes?: string;
  type?: string; // Pour différencier les déclarations d'abattage
}

interface GuideActivity {
  id: string;
  date: string;
  zone: string;
  guideName: string;
  hunterCount: number;
  species: HuntingSpecies[];
  status: string; // 'verified' ou 'rejected'
  createdAt: string; // Date de création pour calculer les 48h
}

interface FilterState {
  region: string;
  date: string;
  species: string;
}

export default function HuntingActivities() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedActivity, setSelectedActivity] = useState<HuntingActivity | null>(null);
  const [selectedGuideActivity, setSelectedGuideActivity] = useState<GuideActivity | null>(null);
  const [showSpeciesDetails, setShowSpeciesDetails] = useState<{[key: string]: boolean}>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editedSpecies, setEditedSpecies] = useState<HuntingSpecies[]>([]);
  const [editReason, setEditReason] = useState('');
  
  // État pour les filtres
  const [filters, setFilters] = useState<FilterState>({
    region: '',
    date: '',
    species: '',
  });

  useEffect(() => {
    document.title = 'Mes Activités de Chasse | SCoDePP_Ch';
  }, []);

  // Récupérer les activités de chasse de l'utilisateur
  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ['/api/hunting-activities', user?.id],
    queryFn: async () => {
      // Dans une version réelle, on ferait un appel API ici
      return [];
    },
    enabled: !!user,
  });
  
  // Récupérer les déclarations d'abattage pour les afficher automatiquement
  const { data: huntingReports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ['/api/hunting-reports', user?.id],
    queryFn: async () => {
      // Dans une version réelle, on ferait un appel API ici
      return [];
    },
    enabled: !!user,
  });
  
  // Récupérer les activités des guides associés à l'utilisateur
  const { data: guideActivities = [], isLoading: guidesLoading } = useQuery({
    queryKey: ['/api/guide-activities', user?.id],
    queryFn: async () => {
      // Dans une version réelle, on ferait un appel API ici
      return [];
    },
    enabled: !!user,
  });
  
  // Fonction pour basculer l'affichage des détails d'espèces
  const toggleSpeciesDetails = (activityId: string) => {
    setShowSpeciesDetails(prev => ({
      ...prev,
      [activityId]: !prev[activityId]
    }));
  };
  
  // Combiner les activités et les déclarations d'abattage
  const allActivities = [...activities, ...huntingReports.map((report: any) => ({
    id: `REPORT-${report.id}`,
    date: report.date,
    zone: report.zone,
    region: report.region,
    permitNumber: report.permitNumber,
    species: report.species,
    coordinates: report.coordinates,
    notes: report.notes,
    status: 'verified',
    type: 'report' // Indiquer qu'il s'agit d'une déclaration d'abattage
  }))].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Fonction pour filtrer les activités
  const filteredActivities = allActivities.filter((activity) => {
    return (
      (filters.region === '' || (activity.region && activity.region.toLowerCase().includes(filters.region.toLowerCase()))) &&
      (filters.date === '' || activity.date.includes(filters.date)) &&
      (filters.species === '' || activity.species.some(s => s.name.toLowerCase().includes(filters.species.toLowerCase())))
    );
  });
  
  // Fonction pour réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      region: '',
      date: '',
      species: '',
    });
    
    // Notification pour confirmer la réinitialisation
    toast({
      title: 'Filtres réinitialisés',
      description: 'Tous les filtres ont été réinitialisés avec succès.',
    });
  };
  
  // Vérifier si une activité est modifiable (moins de 48h)
  const isActivityEditable = (createdAt: string): boolean => {
    const creationDate = new Date(createdAt).getTime();
    const now = new Date().getTime();
    const hoursDiff = (now - creationDate) / (1000 * 60 * 60);
    return hoursDiff < 48;
  };
  
  // Fonction pour obtenir le statut affiché
  const getDisplayStatus = (activity: GuideActivity): string => {
    // Si plus de 48h, tout est automatiquement vérifié
    if (!isActivityEditable(activity.createdAt)) {
      return 'Vérifié';
    }
    
    // Sinon, afficher le statut réel
    if (activity.status === 'rejected') {
      return 'Rejeté';
    }
    return 'Vérifié';
  };
  
  // Fonction pour obtenir la couleur du badge de statut
  const getStatusBadgeClass = (activity: GuideActivity): string => {
    if (!isActivityEditable(activity.createdAt)) {
      return 'bg-green-100 text-green-800';
    }
    
    if (activity.status === 'rejected') {
      return 'bg-red-100 text-red-800';
    }
    
    return 'bg-green-100 text-green-800';
  };
  
  // Fonction pour commencer l'édition d'une activité
  const startEditing = (activity: GuideActivity) => {
    setSelectedGuideActivity(activity);
    setEditedSpecies([...activity.species]);
    setEditReason('');
    setIsEditing(true);
  };
  
  // Fonction pour mettre à jour la quantité d'une espèce
  const updateSpeciesCount = (id: string, count: number) => {
    setEditedSpecies(prev => 
      prev.map(species => 
        species.id === id ? { ...species, count: Math.max(0, count) } : species
      )
    );
  };
  
  // Type pour l'événement de changement d'input
  type InputChangeEvent = React.ChangeEvent<HTMLInputElement>;
  type TextareaChangeEvent = React.ChangeEvent<HTMLTextAreaElement>;
  
  // Fonction pour sauvegarder les modifications
  const saveChanges = () => {
    if (!selectedGuideActivity) return;
    
    if (!editReason.trim()) {
      toast({
        title: 'Raison requise',
        description: 'Veuillez indiquer la raison de votre modification.',
        variant: 'destructive'
      });
      return;
    }
    
    // Dans une version réelle, on ferait un appel API ici pour sauvegarder les modifications
    toast({
      title: 'Modifications enregistrées',
      description: 'Les modifications ont été enregistrées avec succès.',
    });
    
    setIsEditing(false);
    setSelectedGuideActivity(null);
    setEditReason('');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Mes Activités de Chasse</h1>
        <Link href="/hunting-reports">
          <Button className="bg-green-600 hover:bg-green-700">
            Déclarer une activité
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="activities" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="activities">Mes activités</TabsTrigger>
          <TabsTrigger value="guide-activities">Activités avec guide</TabsTrigger>
        </TabsList>
        
        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mes déclarations d'abattage</CardTitle>
              <CardDescription>
                Consultez l'historique de vos activités de chasse déclarées.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filtres */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">Région</label>
                  <Input 
                    type="text" 
                    placeholder="Filtrer par région" 
                    className="w-full"
                    value={filters.region}
                    onChange={(e: InputChangeEvent) => setFilters({...filters, region: e.target.value})}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">Date</label>
                  <Input 
                    type="text" 
                    placeholder="AAAA-MM-JJ" 
                    className="w-full"
                    value={filters.date}
                    onChange={(e: InputChangeEvent) => setFilters({...filters, date: e.target.value})}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">Espèce</label>
                  <Input 
                    type="text" 
                    placeholder="Filtrer par espèce" 
                    className="w-full"
                    value={filters.species}
                    onChange={(e: InputChangeEvent) => setFilters({...filters, species: e.target.value})}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-1"
                    onClick={resetFilters}
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Réinitialiser
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {activitiesLoading || reportsLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">Aucune activité ne correspond à vos critères de recherche.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableCaption>Liste de vos activités de chasse déclarées</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead>Région</TableHead>
                    <TableHead>Espèces</TableHead>
                    <TableHead>Détails</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivities.map((activity: HuntingActivity) => (
                    <React.Fragment key={activity.id}>
                      <TableRow className="hover:bg-gray-50">
                        <TableCell>{format(new Date(activity.date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>{activity.zone}</TableCell>
                        <TableCell>{activity.region}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span className="mr-2">{activity.species.reduce((sum, s) => sum + s.count, 0)} espèce(s)</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => toggleSpeciesDetails(activity.id)}
                            >
                              {showSpeciesDetails[activity.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => setSelectedActivity(activity)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>Détails de l'activité de chasse</DialogTitle>
                                <DialogDescription>
                                  Activité #{activity.id} - {format(new Date(activity.date), 'dd/MM/yyyy')}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                  <h3 className="font-medium mb-2">Informations générales</h3>
                                  <div className="space-y-2">
                                    <div className="flex items-start">
                                      <Calendar className="h-4 w-4 mr-2 mt-1" />
                                      <div>
                                        <span className="font-medium">Date:</span> {format(new Date(activity.date), 'dd/MM/yyyy')}
                                      </div>
                                    </div>
                                    <div className="flex items-start">
                                      <MapPin className="h-4 w-4 mr-2 mt-1" />
                                      <div>
                                        <span className="font-medium">Zone:</span> {activity.zone}<br />
                                        <span className="font-medium">Région:</span> {activity.region}
                                      </div>
                                    </div>
                                    {activity.coordinates && (
                                      <div className="flex items-start">
                                        <Target className="h-4 w-4 mr-2 mt-1" />
                                        <div>
                                          <span className="font-medium">Coordonnées GPS:</span> {activity.coordinates}
                                        </div>
                                      </div>
                                    )}
                                    {activity.guideName && (
                                      <div className="flex items-start">
                                        <User className="h-4 w-4 mr-2 mt-1" />
                                        <div>
                                          <span className="font-medium">Guide:</span> {activity.guideName}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <h3 className="font-medium mb-2">Espèces prélevées</h3>
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Espèce</TableHead>
                                        <TableHead>Catégorie</TableHead>
                                        <TableHead>Quantité</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {activity.species.map((species) => (
                                        <TableRow key={species.id}>
                                          <TableCell>{species.name}</TableCell>
                                          <TableCell>
                                            <Badge variant="outline">
                                              {species.category === 'small' && 'Petite chasse'}
                                              {species.category === 'large' && 'Grande chasse'}
                                              {species.category === 'water' && 'Gibier d\'eau'}
                                            </Badge>
                                          </TableCell>
                                          <TableCell>{species.count}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                              {activity.notes && (
                                <div className="mt-4">
                                  <h3 className="font-medium mb-2">Notes</h3>
                                  <p className="text-sm text-gray-600">{activity.notes}</p>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                      {showSpeciesDetails[activity.id] && (
                        <TableRow className="bg-gray-50">
                          <TableCell colSpan={5} className="p-0">
                            <div className="p-4">
                              <h4 className="text-sm font-medium mb-2">Espèces prélevées:</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                {activity.species.map((species) => (
                                  <div key={species.id} className="flex items-center space-x-2">
                                    <Badge variant="outline">
                                      {species.category === 'small' && 'Petite'}
                                      {species.category === 'large' && 'Grande'}
                                      {species.category === 'water' && 'Eau'}
                                    </Badge>
                                    <span>{species.name}:</span>
                                    <span className="font-medium">{species.count}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="guide-activities">
          <Card>
            <CardHeader>
              <CardTitle>Activités avec guide</CardTitle>
              <CardDescription>
                Consultez les activités de chasse déclarées par vos guides.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filtres */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">Région</label>
                  <Input 
                    type="text" 
                    placeholder="Filtrer par région" 
                    className="w-full"
                    value={filters.region}
                    onChange={(e: InputChangeEvent) => setFilters({...filters, region: e.target.value})}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">Date</label>
                  <Input 
                    type="text" 
                    placeholder="AAAA-MM-JJ" 
                    className="w-full"
                    value={filters.date}
                    onChange={(e: InputChangeEvent) => setFilters({...filters, date: e.target.value})}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">Espèce</label>
                  <Input 
                    type="text" 
                    placeholder="Filtrer par espèce" 
                    className="w-full"
                    value={filters.species}
                    onChange={(e: InputChangeEvent) => setFilters({...filters, species: e.target.value})}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-1"
                    onClick={resetFilters}
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Réinitialiser
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {guidesLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
          ) : guideActivities.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">Aucune activité ne correspond à vos critères de recherche.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Activités organisées par vos guides
                  </CardTitle>
                  <CardDescription>
                    Ces activités ont été enregistrées par vos guides de chasse
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Zone</TableHead>
                        <TableHead>Guide</TableHead>
                        <TableHead>Participants</TableHead>
                        <TableHead>Espèces</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {guideActivities.map((activity: GuideActivity) => (
                        <TableRow key={activity.id}>
                          <TableCell>{format(new Date(activity.date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>{activity.zone}</TableCell>
                          <TableCell>{activity.guideName}</TableCell>
                          <TableCell>{activity.hunterCount} chasseur(s)</TableCell>
                          <TableCell>
                            <div className="flex flex-col space-y-1">
                              {activity.species.map((species) => (
                                <div key={species.id} className="flex items-center space-x-1">
                                  <Badge variant="outline" className="text-xs">
                                    {species.category === 'small' && 'P'}
                                    {species.category === 'large' && 'G'}
                                    {species.category === 'water' && 'E'}
                                  </Badge>
                                  <span className="text-xs">{species.name}: {species.count}</span>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeClass(activity)}>
                              {getDisplayStatus(activity)}
                            </Badge>
                            {!isActivityEditable(activity.createdAt) && (
                              <div className="flex items-center mt-1 text-xs text-gray-500">
                                <Check className="h-3 w-3 mr-1" />
                                Finalisé
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {isActivityEditable(activity.createdAt) ? (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => startEditing(activity)}
                                className="flex items-center"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Modifier
                              </Button>
                            ) : (
                              <div className="text-xs text-gray-500 flex items-center">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Délai dépassé
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Dialogue de modification d'une activité avec guide */}
      {isEditing && selectedGuideActivity && (
        <Dialog open={isEditing} onOpenChange={(open) => !open && setIsEditing(false)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Modifier l'activité de chasse</DialogTitle>
              <DialogDescription>
                Vous pouvez corriger cette activité dans les 48 heures suivant sa création.
                <div className="mt-1 text-amber-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Après ce délai, aucune modification ne sera possible.
                </div>
              </DialogDescription>
            </DialogHeader>
            
            {selectedGuideActivity && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium mb-1">Date</h3>
                    <p className="text-gray-700">{selectedGuideActivity.date}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-1">Zone</h3>
                    <p className="text-gray-700">{selectedGuideActivity.zone}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-1">Guide</h3>
                    <p className="text-gray-700">{selectedGuideActivity.guideName}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-1">Nombre de chasseurs</h3>
                    <p className="text-gray-700">{selectedGuideActivity.hunterCount}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-md font-medium mb-3">Espèces prélevées</h3>
                  <div className="space-y-4">
                    {editedSpecies.map((species) => (
                      <div key={species.id} className="border p-3 rounded-md">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{species.name}</h4>
                            <p className="text-xs text-gray-500">
                              {species.category === 'small' && 'Petite chasse'}
                              {species.category === 'large' && 'Grande chasse'}
                              {species.category === 'water' && "Gibier d'eau"}
                            </p>
                          </div>
                          <div className="flex items-center">
                            <Button 
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-r-none"
                              onClick={() => updateSpeciesCount(species.id, species.count - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input 
                              type="number" 
                              className="h-8 w-16 rounded-none text-center" 
                              min="0"
                              value={species.count}
                              onChange={(e: InputChangeEvent) => updateSpeciesCount(species.id, parseInt(e.target.value) || 0)}
                            />
                            <Button 
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-l-none"
                              onClick={() => updateSpeciesCount(species.id, species.count + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Raison de la modification</label>
                  <Textarea 
                    placeholder="Veuillez indiquer la raison de votre modification..."
                    className="w-full"
                    rows={3}
                    value={editReason}
                    onChange={(e: TextareaChangeEvent) => setEditReason(e.target.value)}
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Annuler
              </Button>
              <Button onClick={saveChanges} className="bg-green-600 hover:bg-green-700">
                Enregistrer les modifications
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
