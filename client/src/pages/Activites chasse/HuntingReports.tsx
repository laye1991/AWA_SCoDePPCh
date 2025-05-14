import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Target, CalendarDays, Info, MapPin, Calendar, Clock, Save, Send, ArrowLeft, Plus, Minus, Navigation, Loader } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Définition des types pour les espèces
interface Species {
  id: string;
  name: string;
  category: 'water' | 'small' | 'large'; // Catégorie: Gibier d'eau, Petite chasse, Grande chasse
  count: number;
}

// Liste des espèces disponibles
const availableSpecies: Species[] = [
  // Gibier d'eau
  { id: 'oie_gambie', name: 'Oie de Gambie', category: 'water', count: 0 },
  { id: 'oie_egypte', name: 'Oie d\'Egypte', category: 'water', count: 0 },
  { id: 'sarcelle_oreillon', name: 'Sarcelle à oreillon', category: 'water', count: 0 },
  { id: 'sarcelle_ete', name: 'Sarcelle d\'été', category: 'water', count: 0 },
  { id: 'dendrocygne_veuf', name: 'Dendrocygne veuf', category: 'water', count: 0 },
  { id: 'dendrocygne_fauve', name: 'Dendrocygne fauve', category: 'water', count: 0 },
  { id: 'canard_pilet', name: 'Canard pilet', category: 'water', count: 0 },
  { id: 'canard_souchet', name: 'Canard souchet', category: 'water', count: 0 },
  { id: 'canard_siffleur', name: 'Canard siffleur', category: 'water', count: 0 },
  { id: 'becassines_marais', name: 'Bécassines marais', category: 'water', count: 0 },
  { id: 'becassines_sourdes', name: 'Bécassines sourdes', category: 'water', count: 0 },
  { id: 'barge_queue_noire', name: 'Barge à queue noire', category: 'water', count: 0 },
  { id: 'chevalier_combattant', name: 'Chevalier combattant', category: 'water', count: 0 },
  
  // Petite chasse
  { id: 'phacochere', name: 'Phacochère', category: 'small', count: 0 },
  { id: 'lievre', name: 'Lièvre', category: 'small', count: 0 },
  { id: 'gangas', name: 'Gangas', category: 'small', count: 0 },
  { id: 'caille', name: 'Caille', category: 'small', count: 0 },
  { id: 'pigeon_vert', name: 'Pigeon vert', category: 'small', count: 0 },
  { id: 'pigeon_spp', name: 'Pigeon spp', category: 'small', count: 0 },
  { id: 'pigeon_ronier', name: 'Pigeon rônier', category: 'small', count: 0 },
  { id: 'tourterelles_spp', name: 'Tourterelles spp', category: 'small', count: 0 },
  { id: 'pintade', name: 'Pintade', category: 'small', count: 0 },
  { id: 'francolin', name: 'Francolin', category: 'small', count: 0 },
  { id: 'poule_roche', name: 'Poule roche', category: 'small', count: 0 },
  
  // Grande chasse
  { id: 'buffle', name: 'Buffle', category: 'large', count: 0 },
  { id: 'guib_harnache', name: 'Guib harnaché', category: 'large', count: 0 },
  { id: 'cephalophe', name: 'Céphalophe', category: 'large', count: 0 },
  { id: 'hippotrague', name: 'Hippotrague', category: 'large', count: 0 },
];

export default function HuntingReports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm'),
    location: '',
    coordinates: '',
    region: '',
    zone: '',
    permitNumber: '',
    notes: '',
    species: [...availableSpecies],
  });
  
  // Récupérer les permis actifs du chasseur
  const { data: userPermits = [], isLoading: permitsLoading } = useQuery({
    queryKey: ['/api/permits/user', user?.id],
    queryFn: async () => {
      // Dans une version réelle, on ferait un appel API ici
      // Simulation de données de permis
      return [
        { id: 'P2025-001', number: 'P2025-001', type: 'Petite chasse', status: 'active', expiryDate: '2025-12-31' },
        { id: 'P2025-002', number: 'P2025-002', type: 'Grande chasse', status: 'active', expiryDate: '2025-12-31' },
        { id: 'P2024-003', number: 'P2024-003', type: 'Gibier d\'eau', status: 'expired', expiryDate: '2024-12-31' },
      ];
    },
    enabled: !!user && showForm,
  });
  
  // Filtrer uniquement les permis actifs
  const activePermits = userPermits.filter(permit => permit.status === 'active');

  useEffect(() => {
    document.title = 'Déclaration d\'abattage | SCoDePP_Ch';
  }, []);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['/api/hunting-reports', user?.id],
    queryFn: async () => {
      // Dans une version réelle, on ferait un appel API ici
      return [];
    },
    enabled: !!user,
  });

  // Mutation pour soumettre le rapport
  const submitReportMutation = useMutation({
    mutationFn: async (data: any) => {
      // Dans une version réelle, on ferait un appel API ici
      console.log('Submitting report:', data);
      return { success: true, id: Math.floor(Math.random() * 1000) };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hunting-reports'] });
      toast({
        title: 'Déclaration soumise avec succès',
        description: 'Votre déclaration d\'abattage a été enregistrée.',
      });
      setShowForm(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur lors de la soumission',
        description: error.message || 'Une erreur est survenue. Veuillez réessayer.',
        variant: 'destructive',
      });
    },
  });

  // Gérer le changement de valeur pour une espèce
  const handleSpeciesCountChange = (id: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      species: prev.species.map(species => 
        species.id === id ? { ...species, count: Math.max(0, value) } : species
      ),
    }));
  };

  // Fonction pour obtenir la géolocalisation
  const getGeolocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Géolocalisation non supportée',
        description: 'Votre navigateur ne supporte pas la géolocalisation.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsGeolocating(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coords = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        
        // Essayer de faire une géolocalisation inverse pour obtenir l'adresse
        // Dans une version réelle, on utiliserait un service comme Google Maps ou OpenStreetMap
        setFormData({
          ...formData,
          coordinates: coords,
          location: formData.location || `Position GPS capturée à ${format(new Date(), 'HH:mm:ss')}`
        });
        
        toast({
          title: 'Position capturée',
          description: `Coordonnées GPS: ${coords}`,
        });
        
        setIsGeolocating(false);
      },
      (error) => {
        console.error('Erreur de géolocalisation:', error);
        let errorMessage = 'Impossible d\'obtenir votre position.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Vous avez refusé l\'accès à votre position.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Information de position non disponible.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Délai d\'attente dépassé pour obtenir la position.';
            break;
        }
        
        toast({
          title: 'Erreur de géolocalisation',
          description: errorMessage,
          variant: 'destructive',
        });
        
        setIsGeolocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Soumettre le formulaire
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Vérifier si au moins une espèce a été déclarée
    const hasSpecies = formData.species.some(species => species.count > 0);
    
    if (!hasSpecies) {
      toast({
        title: 'Aucune espèce déclarée',
        description: 'Veuillez déclarer au moins une espèce abattue.',
        variant: 'destructive',
      });
      return;
    }
    
    // Vérifier si un permis a été sélectionné
    if (!formData.permitNumber) {
      toast({
        title: 'Permis requis',
        description: 'Veuillez sélectionner un permis de chasse valide.',
        variant: 'destructive',
      });
      return;
    }
    
    // Préparer les données pour l'envoi
    const reportData = {
      ...formData,
      species: formData.species.filter(species => species.count > 0),
      userId: user?.id,
      submittedAt: new Date().toISOString(),
    };
    
    submitReportMutation.mutate(reportData);
  };

  return (
    <div className="container py-6 space-y-6">
      {!showForm ? (
        // Liste des déclarations
        <>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Déclaration d'abattage</h1>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setShowForm(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle déclaration
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
          ) : reports.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Aucune déclaration d'abattage</CardTitle>
                <CardDescription>
                  Vous n'avez effectué aucune déclaration d'abattage.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Pour déclarer un abattage, cliquez sur le bouton "Nouvelle déclaration".
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle déclaration
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {reports.map((report: any) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex justify-between">
                      <span>Déclaration #{report.id}</span>
                      <span className="text-sm bg-green-100 text-green-800 py-1 px-2 rounded-full">
                        {report.status || 'Soumis'}
                      </span>
                    </CardTitle>
                    <CardDescription>
                      <div className="flex items-center">
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {report.date || 'Date non spécifiée'}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <MapPin className="mr-2 h-4 w-4 text-red-500" />
                        <span>{report.location || report.zone || 'Lieu non spécifié'}</span>
                      </div>
                      <div className="flex items-center">
                        <Target className="mr-2 h-4 w-4 text-blue-500" />
                        <span>{report.species?.length || 0} espèce(s) déclarée(s)</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" onClick={() => console.log('View details', report.id)}>
                      Voir les détails
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        // Formulaire de déclaration
        <>
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => setShowForm(false)} className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <h1 className="text-3xl font-bold">Nouvelle déclaration d'abattage</h1>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
                <CardDescription>
                  Veuillez fournir les détails de votre activité de chasse
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date de l'activité</Label>
                    <Input 
                      id="date" 
                      type="date" 
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="time">Heure approximative</Label>
                    <Input 
                      id="time" 
                      type="time" 
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="region">Région</Label>
                    <Select 
                      value={formData.region} 
                      onValueChange={(value) => setFormData({...formData, region: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une région" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dakar">Dakar</SelectItem>
                        <SelectItem value="thies">Thiès</SelectItem>
                        <SelectItem value="diourbel">Diourbel</SelectItem>
                        <SelectItem value="fatick">Fatick</SelectItem>
                        <SelectItem value="kaolack">Kaolack</SelectItem>
                        <SelectItem value="louga">Louga</SelectItem>
                        <SelectItem value="matam">Matam</SelectItem>
                        <SelectItem value="saint-louis">Saint-Louis</SelectItem>
                        <SelectItem value="tambacounda">Tambacounda</SelectItem>
                        <SelectItem value="kedougou">Kédougou</SelectItem>
                        <SelectItem value="kolda">Kolda</SelectItem>
                        <SelectItem value="sedhiou">Sédhiou</SelectItem>
                        <SelectItem value="ziguinchor">Ziguinchor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="zone">Zone de chasse</Label>
                    <Input 
                      id="zone" 
                      placeholder="Zone ou secteur de chasse" 
                      value={formData.zone}
                      onChange={(e) => setFormData({...formData, zone: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="permitNumber">Numéro de permis</Label>
                    {permitsLoading ? (
                      <div className="flex items-center space-x-2">
                        <Loader className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Chargement des permis...</span>
                      </div>
                    ) : activePermits.length === 0 ? (
                      <div className="p-2 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">Aucun permis actif trouvé. Vous devez avoir un permis valide pour déclarer un abattage.</p>
                      </div>
                    ) : activePermits.length === 1 ? (
                      <div className="flex flex-col space-y-1">
                        <Input 
                          id="permitNumber" 
                          value={activePermits[0].number}
                          readOnly
                          className="bg-gray-50"
                        />
                        <p className="text-xs text-muted-foreground">Type: {activePermits[0].type} - Expire le: {activePermits[0].expiryDate}</p>
                      </div>
                    ) : (
                      <Select 
                        value={formData.permitNumber} 
                        onValueChange={(value) => setFormData({...formData, permitNumber: value})}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un permis" />
                        </SelectTrigger>
                        <SelectContent>
                          {activePermits.map(permit => (
                            <SelectItem key={permit.id} value={permit.number}>
                              {permit.number} - {permit.type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="location">Lieu précis</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => getGeolocation()}
                      disabled={isGeolocating}
                    >
                      {isGeolocating ? (
                        <>
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                          Localisation...
                        </>
                      ) : (
                        <>
                          <Navigation className="mr-2 h-4 w-4" />
                          Utiliser ma position
                        </>
                      )}
                    </Button>
                  </div>
                  <Input 
                    id="location" 
                    placeholder="Description précise du lieu de chasse" 
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                  {formData.coordinates && (
                    <div className="text-xs text-muted-foreground mt-1">
                      <span className="font-medium">Coordonnées GPS:</span> {formData.coordinates}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Espèces prélevées</CardTitle>
                <CardDescription>
                  Indiquez le nombre d'individus prélevés pour chaque espèce
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="water" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="water">Gibier d'eau</TabsTrigger>
                    <TabsTrigger value="small">Petite chasse</TabsTrigger>
                    <TabsTrigger value="large">Grande chasse</TabsTrigger>
                  </TabsList>
                  
                  {/* Gibier d'eau */}
                  <TabsContent value="water" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {formData.species
                        .filter(species => species.category === 'water')
                        .map(species => (
                          <div key={species.id} className="flex items-center justify-between p-3 border rounded-md">
                            <Label htmlFor={species.id} className="flex-grow">{species.name}</Label>
                            <div className="flex items-center">
                              <Button 
                                type="button"
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8 rounded-r-none"
                                onClick={() => handleSpeciesCountChange(species.id, species.count - 1)}
                                disabled={species.count <= 0}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <Input 
                                id={species.id}
                                type="number" 
                                className="h-8 w-16 rounded-none text-center" 
                                min="0"
                                value={species.count}
                                onChange={(e) => handleSpeciesCountChange(species.id, parseInt(e.target.value) || 0)}
                              />
                              <Button 
                                type="button"
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8 rounded-l-none"
                                onClick={() => handleSpeciesCountChange(species.id, species.count + 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </TabsContent>
                  
                  {/* Petite chasse */}
                  <TabsContent value="small" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {formData.species
                        .filter(species => species.category === 'small')
                        .map(species => (
                          <div key={species.id} className="flex items-center justify-between p-3 border rounded-md">
                            <Label htmlFor={species.id} className="flex-grow">{species.name}</Label>
                            <div className="flex items-center">
                              <Button 
                                type="button"
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8 rounded-r-none"
                                onClick={() => handleSpeciesCountChange(species.id, species.count - 1)}
                                disabled={species.count <= 0}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <Input 
                                id={species.id}
                                type="number" 
                                className="h-8 w-16 rounded-none text-center" 
                                min="0"
                                value={species.count}
                                onChange={(e) => handleSpeciesCountChange(species.id, parseInt(e.target.value) || 0)}
                              />
                              <Button 
                                type="button"
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8 rounded-l-none"
                                onClick={() => handleSpeciesCountChange(species.id, species.count + 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </TabsContent>
                  
                  {/* Grande chasse */}
                  <TabsContent value="large" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {formData.species
                        .filter(species => species.category === 'large')
                        .map(species => (
                          <div key={species.id} className="flex items-center justify-between p-3 border rounded-md">
                            <Label htmlFor={species.id} className="flex-grow">{species.name}</Label>
                            <div className="flex items-center">
                              <Button 
                                type="button"
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8 rounded-r-none"
                                onClick={() => handleSpeciesCountChange(species.id, species.count - 1)}
                                disabled={species.count <= 0}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <Input 
                                id={species.id}
                                type="number" 
                                className="h-8 w-16 rounded-none text-center" 
                                min="0"
                                value={species.count}
                                onChange={(e) => handleSpeciesCountChange(species.id, parseInt(e.target.value) || 0)}
                              />
                              <Button 
                                type="button"
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8 rounded-l-none"
                                onClick={() => handleSpeciesCountChange(species.id, species.count + 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Informations complémentaires</CardTitle>
                <CardDescription>
                  Ajoutez des détails supplémentaires sur votre activité de chasse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes et observations</Label>
                  <Textarea 
                    id="notes" 
                    placeholder="Précisions sur les conditions de chasse, observations particulières..." 
                    className="min-h-[100px]"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Annuler
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  <Send className="mr-2 h-4 w-4" />
                  Soumettre la déclaration
                </Button>
              </CardFooter>
            </Card>
          </form>
        </>
      )}
    </div>
  );
}
