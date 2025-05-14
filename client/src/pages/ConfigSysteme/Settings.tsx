import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Plus, Trash2, RefreshCw, MapPin, CreditCard, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Settings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("hunting-season");
  const [loading, setLoading] = useState(false);
  const [zones, setZones] = useState<Record<string, any>>({});

  // Gestion de la campagne cynégétique
  const [huntingSeason, setHuntingSeason] = useState({
    startDate: new Date("2025-01-04"), // 4 Janvier 2025
    endDate: new Date("2025-06-25"),   // 25 Juin 2025
    bigGameStartDate: new Date("2025-01-15"), // 15 Janvier 2025
    bigGameEndDate: new Date("2025-05-15"),   // 15 Mai 2025
    waterGameStartDate: new Date("2025-02-01"), // 1 Février 2025
    waterGameEndDate: new Date("2025-04-30"),   // 30 Avril 2025
    year: "2025",
    isActive: true,
  });

  // Charger les paramètres de la campagne à partir de l'API au chargement de la page
  useEffect(() => {
    setLoading(true);
    fetch("/api/huntingCampaign")
      .then(res => {
        if (!res.ok) throw new Error("Erreur lors de la récupération des paramètres de campagne");
        return res.json();
      })
      .then(data => {
        console.log("Campaign data loaded:", data);
        if (data && data.startDate && data.endDate) {
          setHuntingSeason(prevState => ({
            ...prevState,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            year: data.year || new Date().getFullYear().toString(),
            isActive: data.isActive !== undefined ? data.isActive : true,
          }));
        }
      })
      .catch(err => {
        console.error("Error loading campaign settings:", err);
        toast({
          title: "Erreur",
          description: "Impossible de charger les paramètres de la campagne",
          variant: "destructive"
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [toast]);

  const [permitPrices, setPermitPrices] = useState({
    smallGameSportResident: "15000",
    smallGameSportTourist1Week: "15000",
    smallGameSportTourist2Weeks: "25000",
    smallGameSportTourist1Month: "45000",
    smallGameTraditional: "3000",
    bigGameResident: "45000",
    bigGameTourist1Week: "30000",
    bigGameTourist2Weeks: "50000",
    bigGameTourist1Month: "90000",
    waterGameResident: "30000",
    waterGameTourist1Week: "15000",
    waterGameTourist1Month: "45000",
  });

  // État pour les taxes d'abattage
  const [huntingTaxes, setHuntingTaxes] = useState([
    { id: "phacochère-1", name: "Phacochère (1)", price: 15000 },
    { id: "céphalophe", name: "Céphalophe", price: 40000 },
    { id: "phacochère-2", name: "Phacochère (2)", price: 20000 },
    { id: "phacochère-3", name: "Phacochère (3)", price: 25000 },
    { id: "gazelle-front-roux", name: "Gazelle front roux", price: 50000 },
    { id: "buffle", name: "Buffle", price: 200000 },
    { id: "cobe", name: "Cobe de Buffon", price: 100000 },
    { id: "ourébi", name: "Ourébi", price: 40000 },
    { id: "guib", name: "Guib harnaché", price: 60000 },
    { id: "hippotrague", name: "Hippotrague", price: 200000 },
    { id: "bubale", name: "Bubale", price: 100000 },
  ]);

  // États pour le nouvel animal à ajouter
  const [newSpeciesName, setNewSpeciesName] = useState("");
  const [newSpeciesPrice, setNewSpeciesPrice] = useState("");

  // État pour gérer les zones de chasse
  const [zonesList, setZonesList] = useState([
    "ZIC de Djeuss",
    "ZIC de Niombato",
    "ZIC de Baobolong",
    "ZIC de la Falémé",
    "Zones amodiées",
    "Sur le territoire national",
  ]);

  const regions = [
    "Dakar", "Diourbel", "Fatick", "Kaolack", "Kédougou", "Kolda", "Louga", "Matam", "Saint-Louis", "Sédhiou", "Tambacounda", "Thiès", "Ziguinchor", "Casamance" // Placeholder region data
  ];

  const inspections = [
    "Inspection Régionale des Eaux et Forêts de Dakar", "Inspection Régionale des Eaux et Forêts de Diourbel", "Inspection Régionale des Eaux et Forêts de Fatick", "Inspection Régionale des Eaux et Forêts de Kaolack", "Inspection Régionale des Eaux et Forêts de Kédougou", "Inspection Régionale des Eaux et Forêts de Kolda", "Inspection Régionale des Eaux et Forêts de Louga", "Inspection Régionale des Eaux et Forêts de Matam", "Inspection Régionale des Eaux et Forêts de Saint-Louis", "Inspection Régionale des Eaux et Forêts de Sédhiou", "Inspection Régionale des Eaux et Forêts de Tambacounda", "Inspection Régionale des Eaux et Forêts de Thiès", "Inspection Régionale des Eaux et Forêts de Ziguinchor", "DEFCCS" // Placeholder inspection data
  ];

  // Chargement initial des données des zones
  useEffect(() => {
    if (activeTab === "regions-zones") {
      // Charger les données des zones sans initialiser de carte
      import('../../components/data/data').then(({ regionsData, zicsData, amodieesData }) => {
        setZones({ ...zicsData, ...Object.fromEntries(amodieesData.map(z => [z.name, z])) });

        // Populer les sélecteurs
        setTimeout(() => {
          populateZoneSelect();
          populateRegionSelect();
        }, 500);
      });
    }
  }, [activeTab]);

  // Fonctions pour gérer les données de la carte
  const populateZoneSelect = () => {
    const select = document.getElementById('zoneSelect') as HTMLSelectElement;
    if (!select) return;

    select.innerHTML = '';
    for (const zone in zones) {
      const option = document.createElement('option');
      option.value = zone;
      option.textContent = zone;
      select.appendChild(option);
    }
  };

  const populateRegionSelect = () => {
    import('../../components/data/data').then(({ regionsData }) => {
      const select = document.getElementById('regionSelect') as HTMLSelectElement;
      if (!select) return;

      select.innerHTML = '';
      for (const region in regionsData) {
        const option = document.createElement('option');
        option.value = region;
        option.textContent = region;
        select.appendChild(option);
      }
    });
  };

  const addCoordInput = (containerId: string, coords: [number, number][]) => {
    const container = document.getElementById(containerId) as HTMLDivElement;
    if (!container) return;

    container.innerHTML = '';
    coords.forEach((coord, index) => {
      const div = document.createElement('div');
      div.className = 'coord-input mb-2';
      div.dataset.index = index.toString();
      div.innerHTML = `
        <span class="mr-2">Point ${index + 1}:</span>
        <span class="mr-2" data-lat="${coord[0]}" data-lng="${coord[1]}">${coord[0].toFixed(4)}, ${coord[1].toFixed(4)}</span>
        <button type="button" class="remove-point-btn text-red-500">Supprimer</button>
      `;
      container.appendChild(div);
    });
  };

  const handleAddZone = (e: React.FormEvent) => {
    e.preventDefault();

    const zoneName = (document.getElementById('zoneName') as HTMLInputElement)?.value;
    const region = (document.getElementById('region') as HTMLInputElement)?.value;
    const department = (document.getElementById('department') as HTMLInputElement)?.value;
    const zoneType = (document.getElementById('zoneType') as HTMLSelectElement)?.value;
    const status = (document.getElementById('status') as HTMLSelectElement)?.value;

    // Vérifier les valeurs requises
    if (!zoneName || !region || !department || !zoneType || !status) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs requis",
        variant: "destructive"
      });
      return;
    }

    // Collecter les coordonnées
    const coordInputs = document.querySelectorAll('#coordsInputsAdd .coord-input');
    const coords: [number, number][] = [];
    coordInputs.forEach(input => {
      const lat = parseFloat((input.querySelector('[data-lat]') as HTMLElement)?.dataset.lat || '0');
      const lng = parseFloat((input.querySelector('[data-lng]') as HTMLElement)?.dataset.lng || '0');
      if (lat && lng) coords.push([lat, lng]);
    });

    // Vérifier qu'il y a au moins 3 points pour former un polygone
    if (coords.length < 3) {
      toast({
        title: "Erreur",
        description: "Veuillez ajouter au moins 3 points pour former une zone valide",
        variant: "destructive"
      });
      return;
    }

    // Ajouter la nouvelle zone
    import('../../components/data/data').then(({ updateZone }) => {
      updateZone(zoneName, {
        name: zoneName,
        region,
        department,
        type: zoneType,
        status,
        coords
      });

      toast({
        title: "Succès",
        description: `La zone ${zoneName} a été ajoutée avec succès`,
        variant: "default"
      });

      // Actualiser les données
      handleRefreshData();
    });
  };

  const handleAddPoint = (containerId: string, latId: string, lngId: string) => {
    const lat = parseFloat((document.getElementById(latId) as HTMLInputElement)?.value || '0');
    const lng = parseFloat((document.getElementById(lngId) as HTMLInputElement)?.value || '0');

    if (isNaN(lat) || isNaN(lng)) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer des coordonnées valides",
        variant: "destructive"
      });
      return;
    }

    const container = document.getElementById(containerId) as HTMLDivElement;
    const index = container.children.length;
    const div = document.createElement('div');
    div.className = 'coord-input mb-2';
    div.dataset.index = index.toString();
    div.innerHTML = `
      <span class="mr-2">Point ${index + 1}:</span>
      <span class="mr-2" data-lat="${lat}" data-lng="${lng}">${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
      <button type="button" class="remove-point-btn text-red-500">Supprimer</button>
    `;
    container.appendChild(div);

    // Réinitialiser les champs
    (document.getElementById(latId) as HTMLInputElement).value = '';
    (document.getElementById(lngId) as HTMLInputElement).value = '';
  };

  const handleRemovePoint = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('remove-point-btn')) {
      const point = (e.target as HTMLElement).closest('.coord-input');
      if (point) {
        point.remove();
      }
    }
  };

  const handleUpdateZone = () => {
    const name = (document.getElementById('zoneSelect') as HTMLSelectElement)?.value;
    const status = (document.getElementById('newStatus') as HTMLSelectElement)?.value;

    // Vérifier les valeurs requises
    if (!name || !status) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une zone et spécifier son statut",
        variant: "destructive"
      });
      return;
    }

    // Collecter les coordonnées
    const coordInputs = document.querySelectorAll('#coordsInputsMod .coord-input');
    const coords: [number, number][] = [];
    coordInputs.forEach(input => {
      const lat = parseFloat((input.querySelector('[data-lat]') as HTMLElement)?.dataset.lat || '0');
      const lng = parseFloat((input.querySelector('[data-lng]') as HTMLElement)?.dataset.lng || '0');
      if (lat && lng) coords.push([lat, lng]);
    });

    // Vérifier qu'il y a au moins 3 points pour former un polygone
    if (coords.length < 3) {
      toast({
        title: "Erreur",
        description: "Veuillez ajouter au moins 3 points pour former une zone valide",
        variant: "destructive"
      });
      return;
    }

    // Mettre à jour la zone
    import('../../components/data/data').then(({ updateZone }) => {
      // Récupérer les données existantes
      const zone = zones[name];
      updateZone(name, {
        ...zone,
        status,
        coords
      });

      toast({
        title: "Succès",
        description: `La zone ${name} a été mise à jour avec succès`,
        variant: "default"
      });

      // Actualiser les données
      handleRefreshData();
    });
  };

  const handleUpdateRegion = () => {
    const regionName = (document.getElementById('regionSelect') as HTMLSelectElement)?.value;
    const status = (document.getElementById('regionStatus') as HTMLSelectElement)?.value;

    // Vérifier les valeurs requises
    if (!regionName || !status) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une région et spécifier son statut",
        variant: "destructive"
      });
      return;
    }

    // Collecter les coordonnées (pour les régions, nous avons besoin de seulement 2 points pour définir les limites)
    const coordInputs = document.querySelectorAll('#coordsInputsRegion .coord-input');
    const coords: [number, number][] = [];
    coordInputs.forEach(input => {
      const lat = parseFloat((input.querySelector('[data-lat]') as HTMLElement)?.dataset.lat || '0');
      const lng = parseFloat((input.querySelector('[data-lng]') as HTMLElement)?.dataset.lng || '0');
      if (lat && lng) coords.push([lat, lng]);
    });

    // Vérifier qu'il y a au moins 2 points pour former un rectangle (bounds)
    if (coords.length < 2) {
      toast({
        title: "Erreur",
        description: "Veuillez ajouter au moins 2 points pour définir les limites de la région",
        variant: "destructive"
      });
      return;
    }

    // Pour les régions, on prend le premier et le dernier point pour définir les bounds
    const bounds: [[number, number], [number, number]] = [
      [coords[0][0], coords[0][1]],
      [coords[coords.length - 1][0], coords[coords.length - 1][1]]
    ];

    // Mettre à jour la région
    import('../../components/data/data').then(({ updateRegion }) => {
      // Créer la fonction updateRegion si elle n'existe pas encore
      const updateRegionImpl = updateRegion || ((name: string, data: any) => {
        // @ts-ignore
        if (regionsData[name]) {
          // @ts-ignore
          regionsData[name] = { ...regionsData[name], ...data };
          return true;
        }
        return false;
      });

      // Mettre à jour la région
      const updated = updateRegionImpl(regionName, {
        status,
        bounds
      });

      if (updated) {
        toast({
          title: "Succès",
          description: `La région ${regionName} a été mise à jour avec succès`,
          variant: "default"
        });
      } else {
        toast({
          title: "Erreur",
          description: `Impossible de mettre à jour la région ${regionName}`,
          variant: "destructive"
        });
      }

      // Actualiser les données
      handleRefreshData();
    });
  };

  const handleDeleteZone = () => {
    const name = (document.getElementById('zoneSelect') as HTMLSelectElement)?.value;

    // Vérifier qu'une zone est sélectionnée
    if (!name) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une zone à supprimer",
        variant: "destructive"
      });
      return;
    }

    // Confirmation
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la zone ${name} ? Cette action est irréversible.`)) {
      return;
    }

    // Supprimer la zone
    import('../../components/data/data').then(({ deleteZone }) => {
      deleteZone(name);

      toast({
        title: "Succès",
        description: `La zone ${name} a été supprimée avec succès`,
        variant: "default"
      });

      // Actualiser les données
      handleRefreshData();
    });
  };

  const handleRefreshData = () => {
    toast({
      title: "Actualisation",
      description: "Les données sont en cours d'actualisation...",
      variant: "default"
    });

    // Simulation d'une actualisation (dans une application réelle, ce serait un appel API)
    setTimeout(() => {
      toast({
        title: "Succès",
        description: "Les données ont été actualisées avec succès",
        variant: "default"
      });
    }, 1000);
  };
  // Ajout d'une fonction pour vérifier si une date est valide par rapport aux dates de la campagne
  const isDateWithinCampaignRange = (date: Date | null, fieldName: string): boolean => {
    // Si on est en train de modifier les dates de la campagne elle-même, pas besoin de vérification
    if (fieldName === "startDate" || fieldName === "endDate") {
      return true;
    }

    // Si les dates de début ou de fin de la campagne ne sont pas définies, on ne peut pas vérifier
    if (!huntingSeason.startDate || !huntingSeason.endDate) {
      toast({
        title: "Dates de campagne non définies",
        description: "Veuillez d'abord définir les dates d'ouverture et de fermeture de la campagne cynégétique dans l'onglet 'Régions et Zones'.",
        variant: "destructive",
      });
      return false;
    }

    // Si la date à vérifier n'est pas définie, elle est considérée comme valide
    if (!date) {
      return true;
    }

    // Vérifier si la date est comprise entre les dates de la campagne
    if (date < huntingSeason.startDate || date > huntingSeason.endDate) {
      toast({
        title: "Date non valide",
        description: `La date sélectionnée doit être comprise entre le ${format(huntingSeason.startDate, "dd/MM/yyyy")} et le ${format(huntingSeason.endDate, "dd/MM/yyyy")}, dates officielles de la campagne cynégétique.`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleHuntingSeasonChange = (field: string, value: string | Date | null) => {
    // Pour les dates, vérifier qu'elles sont valides par rapport aux dates de la campagne
    if (field.includes("Date") && typeof value === "object") {
      if (!isDateWithinCampaignRange(value, field)) {
        return; // Ne pas mettre à jour si la date n'est pas valide
      }
    }

    setHuntingSeason({ ...huntingSeason, [field]: value });
  };

  const handlePermitPriceChange = (field: string, value: string) => {
    setPermitPrices({ ...permitPrices, [field]: value });
  };

  // Fonction pour ajouter une nouvelle espèce
  const addNewSpecies = () => {
    if (!newSpeciesName.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un nom d'espèce",
        variant: "destructive",
      });
      return;
    }

    if (!newSpeciesPrice || isNaN(Number(newSpeciesPrice)) || Number(newSpeciesPrice) <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un prix valide (nombre positif)",
        variant: "destructive",
      });
      return;
    }

    const newSpecies = {
      id: newSpeciesName.toLowerCase().replace(/\s+/g, '-'),
      name: newSpeciesName,
      price: Number(newSpeciesPrice)
    };

    setHuntingTaxes([...huntingTaxes, newSpecies]);
    setNewSpeciesName("");
    setNewSpeciesPrice("");

    toast({
      title: "Succès",
      description: `L'espèce ${newSpeciesName} a été ajoutée avec une taxe de ${newSpeciesPrice} FCFA`,
    });
  };

  // Fonction pour supprimer une espèce
  const deleteSpecies = (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette espèce ?")) {
      const updatedTaxes = huntingTaxes.filter(species => species.id !== id);
      setHuntingTaxes(updatedTaxes);

      toast({
        title: "Espèce supprimée",
        description: "L'espèce a été supprimée avec succès",
      });
    }
  };

  const saveSettings = (type: string) => {
    setLoading(true);
    if (type === "hunting-season") {
      // Création d'un objet avec les données à envoyer à l'API
      const campaignData = {
        startDate: huntingSeason.startDate?.toISOString().split('T')[0],
        endDate: huntingSeason.endDate?.toISOString().split('T')[0],
        year: huntingSeason.year,
        isActive: true
      };

      // Appel à l'API pour sauvegarder les dates de campagne
      fetch("/api/huntingCampaign", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(campaignData)
      })
        .then(res => {
          if (!res.ok) throw new Error("Erreur lors de la mise à jour des dates de campagne");
          return res.json();
        })
        .then(data => {
          console.log("Campaign data saved successfully:", data);
          toast({
            title: "Paramètres sauvegardés",
            description: `Les dates de la campagne de chasse ont été sauvegardées`,
          });
        })
        .catch(err => {
          console.error("Error saving campaign settings:", err);
          toast({
            title: "Erreur",
            description: err.message,
            variant: "destructive"
          });
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (type === "hunting-taxes") {
      console.log("Saving hunting taxes:", huntingTaxes);
      // Ici, vous feriez un appel API pour sauvegarder les taxes d'abattage
      toast({
        title: "Paramètres sauvegardés",
        description: `Les taxes d'abattage ont été sauvegardées`,
      });
      setLoading(false);
    } else if (type === "permit-fees") {
      console.log(`Saving permit fees:`, permitPrices);
      // Ici, vous feriez un appel API pour sauvegarder les tarifs des permis
      toast({
        title: "Paramètres sauvegardés",
        description: `Les tarifs des permis ont été sauvegardés`,
      });
      setLoading(false);
    }
  };
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Paramètres</h1>

      <Tabs defaultValue="hunting-season" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="hunting-season">
            <CalendarIcon className="w-4 h-4 mr-2" />
            Campagne de Chasse
          </TabsTrigger>
          <TabsTrigger value="permit-fees">
            <CreditCard className="w-4 h-4 mr-2" />
            Tarifs des Permis
          </TabsTrigger>
          <TabsTrigger value="hunting-taxes">
            <Coins className="w-4 h-4 mr-2" />
            Taxe d'Abattage
          </TabsTrigger>
          <TabsTrigger value="regions-zones">
            <MapPin className="w-4 h-4 mr-2" />
            Régions et Zones
          </TabsTrigger>
        </TabsList>

        {/* Campagne de Chasse */}
        <TabsContent value="hunting-season" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campagne Cynégétique de Chasse</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 p-4 rounded-md border border-green-200">
                <p className="text-gray-700">
                  Ces dates définissent la période officielle de la campagne cynégétique de chasse. Elles peuvent être modifiées uniquement par l'administrateur. Une fois enregistrées, les dates sont sauvegardées dans le système jusqu'à ce qu'une nouvelle modification soit effectuée. La date d'ouverture permet automatiquement aux chasseurs et guides de chasse de soumettre leurs demandes de permis.
                </p>
              </div>

              <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
                <p className="font-medium text-amber-800 mb-1">Important :</p>
                <p className="text-gray-700">
                  Les dates des périodes spécifiques de chasse (petite chasse, grande chasse, gibier d'eau) configurées dans l'onglet "Campagne de Chasse" doivent obligatoirement être comprises entre ces dates de campagne cynégétique. Ces dates seront automatiquement synchronisées avec les comptes des chasseurs et guides de chasse.
                </p>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-10 w-10 animate-spin text-green-600" />
                  <span className="ml-3 text-green-700">Chargement des paramètres de campagne...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Date d'ouverture de la Campagne</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {huntingSeason.startDate ? (
                            format(huntingSeason.startDate, "dd/MM/yyyy")
                          ) : (
                            <span>Sélectionner une date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={huntingSeason.startDate || undefined}
                          onSelect={(date) => handleHuntingSeasonChange("startDate", date || null)}
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="text-sm text-muted-foreground">Date officielle d'ouverture de la campagne cynégétique</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Date de fermeture de la Campagne</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {huntingSeason.endDate ? (
                            format(huntingSeason.endDate, "dd/MM/yyyy")
                          ) : (
                            <span>Sélectionner une date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={huntingSeason.endDate || undefined}
                          onSelect={(date) => handleHuntingSeasonChange("endDate", date || null)}
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="text-sm text-muted-foreground">Date officielle de fermeture de la campagne cynégétique</p>
                  </div>
                </div>
              )}

              <div className="pt-6">
                <Button
                  className="bg-green-700 hover:bg-green-800"
                  onClick={() => saveSettings("hunting-season")}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Chargement...
                    </>
                  ) : (
                    "Enregistrer les dates de la campagne"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tarifs des Permis */}
        <TabsContent value="permit-fees" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration des Tarifs des Permis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Permis Sportif Petite Chasse */}
              <div>
                <h3 className="text-lg font-medium mb-4">Permis Sportif Petite Chasse</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smallGameSportResident">Résident</Label>
                    <Input
                      id="smallGameSportResident"
                      type="number"
                      value={permitPrices.smallGameSportResident}
                      onChange={(e) => handlePermitPriceChange("smallGameSportResident", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Prix en FCFA</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smallGameSportTourist1Week">Touriste 1 semaine</Label>
                    <Input
                      id="smallGameSportTourist1Week"
                      type="number"
                      value={permitPrices.smallGameSportTourist1Week}
                      onChange={(e) => handlePermitPriceChange("smallGameSportTourist1Week", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Prix en FCFA</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smallGameSportTourist2Weeks">Touriste 2 semaines</Label>
                    <Input
                      id="smallGameSportTourist2Weeks"
                      type="number"
                      value={permitPrices.smallGameSportTourist2Weeks}
                      onChange={(e) => handlePermitPriceChange("smallGameSportTourist2Weeks", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Prix en FCFA</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smallGameSportTourist1Month">Touriste 1 mois</Label>
                    <Input
                      id="smallGameSportTourist1Month"
                      type="number"
                      value={permitPrices.smallGameSportTourist1Month}
                      onChange={(e) => handlePermitPriceChange("smallGameSportTourist1Month", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Prix en FCFA</p>
                  </div>
                </div>
              </div>

              {/* Permis Petite Chasse Coutumier */}
              <div>
                <h3 className="text-lg font-medium mb-4">Permis Petite Chasse Coutumier</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smallGameTraditional">Tarif unique</Label>
                    <Input
                      id="smallGameTraditional"
                      type="number"
                      value={permitPrices.smallGameTraditional}
                      onChange={(e) => handlePermitPriceChange("smallGameTraditional", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Prix en FCFA</p>
                  </div>
                </div>
              </div>

              {/* Permis Grande Chasse */}
              <div>
                <h3 className="text-lg font-medium mb-4">Permis Grande Chasse</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bigGameResident">Résident</Label>
                    <Input
                      id="bigGameResident"
                      type="number"
                      value={permitPrices.bigGameResident}
                      onChange={(e) => handlePermitPriceChange("bigGameResident", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Prix en FCFA</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bigGameTourist1Week">Touriste 1 semaine</Label>
                    <Input
                      id="bigGameTourist1Week"
                      type="number"
                      value={permitPrices.bigGameTourist1Week}
                      onChange={(e) => handlePermitPriceChange("bigGameTourist1Week", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Prix en FCFA</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bigGameTourist2Weeks">Touriste 2 semaines</Label>
                    <Input
                      id="bigGameTourist2Weeks"
                      type="number"
                      value={permitPrices.bigGameTourist2Weeks}
                      onChange={(e) => handlePermitPriceChange("bigGameTourist2Weeks", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Prix en FCFA</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bigGameTourist1Month">Touriste 1 mois</Label>
                    <Input
                      id="bigGameTourist1Month"
                      type="number"
                      value={permitPrices.bigGameTourist1Month}
                      onChange={(e) => handlePermitPriceChange("bigGameTourist1Month", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Prix en FCFA</p>
                  </div>
                </div>
              </div>

              {/* Permis Spécial Gibier d'Eau */}
              <div>
                <h3 className="text-lg font-medium mb-4">Permis Spécial Chasse au Gibier d'Eau</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="waterGameResident">Résident</Label>
                    <Input
                      id="waterGameResident"
                      type="number"
                      value={permitPrices.waterGameResident}
                      onChange={(e) => handlePermitPriceChange("waterGameResident", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Prix en FCFA</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="waterGameTourist1Week">Touriste 1 semaine</Label>
                    <Input
                      id="waterGameTourist1Week"
                      type="number"
                      value={permitPrices.waterGameTourist1Week}
                      onChange={(e) => handlePermitPriceChange("waterGameTourist1Week", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Prix en FCFA</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="waterGameTourist1Month">Touriste 1 mois</Label>
                    <Input
                      id="waterGameTourist1Month"
                      type="number"
                      value={permitPrices.waterGameTourist1Month}
                      onChange={(e) => handlePermitPriceChange("waterGameTourist1Month", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Prix en FCFA</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={() => saveSettings("permit-fees")}
                  className="bg-green-700 hover:bg-green-800"
                >
                  Enregistrer les tarifs
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Taxe d'Abattage */}
        <TabsContent value="hunting-taxes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration des Taxes d'Abattage</CardTitle>
              <CardDescription>Configurez les tarifs des taxes d'abattage pour chaque espèce</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* En-tête avec description */}
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
                <h4 className="font-medium text-amber-800 mb-2">Gestion des taxes d'abattage</h4>
                <p className="text-sm text-gray-700">
                  Ces taxes s'appliquent à toutes les espèces chassées et doivent être payées pour chaque animal prélevé.
                  Les modifications effectuées ici sont appliquées dans tout le système.
                </p>
              </div>

              {/* Tableau des taxes d'abattage */}
              <div className="overflow-hidden border rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Espèce
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Taxe d'abattage (FCFA)
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Liste dynamique des espèces */}
                    {huntingTaxes.map((species) => (
                      <tr key={species.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            className="border-none focus:ring-0 w-full"
                            value={species.name}
                            onChange={(e) => {
                              const updatedTaxes = huntingTaxes.map(s =>
                                s.id === species.id ? { ...s, name: e.target.value } : s
                              );
                              setHuntingTaxes(updatedTaxes);
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Input
                            type="number"
                            className="w-32"
                            value={species.price}
                            onChange={(e) => {
                              const price = e.target.value === "" ? 0 : Number(e.target.value);
                              const updatedTaxes = huntingTaxes.map(s =>
                                s.id === species.id ? { ...s, price } : s
                              );
                              setHuntingTaxes(updatedTaxes);
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            className="text-red-600 hover:text-red-900 mr-3"
                            onClick={() => deleteSpecies(species.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {/* Ligne d'ajout de nouvelle espèce */}
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          className="border-gray-300 rounded-md w-full"
                          placeholder="Nouvelle espèce..."
                          value={newSpeciesName}
                          onChange={(e) => setNewSpeciesName(e.target.value)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Input
                          type="number"
                          className="w-32"
                          placeholder="Prix"
                          value={newSpeciesPrice}
                          onChange={(e) => setNewSpeciesPrice(e.target.value)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700"
                          onClick={addNewSpecies}
                        >
                          <Plus className="h-4 w-4 inline-block mr-1" />
                          Ajouter
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="pt-4 flex space-x-4">
                <Button
                  className="bg-green-700 hover:bg-green-800"
                  onClick={() => saveSettings("hunting-taxes")}
                >
                  Enregistrer les modifications
                </Button>
                <Button
                  variant="outline"
                  className="border-amber-500 text-amber-700 hover:bg-amber-50"
                  onClick={() => {
                    if (window.confirm("Cette action va réinitialiser tous les changements non sauvegardés. Continuer ?")) {
                      // Recharger les données d'origine (dans une vraie application, ce serait un appel API)
                      toast({
                        title: "Réinitialisation",
                        description: "Les taxes d'abattage ont été réinitialisées",
                      });
                    }
                  }}
                >
                  Réinitialiser
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Régions et Zones */}
        <TabsContent value="regions-zones" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Régions et Zones de Chasse</CardTitle>
              <CardDescription>Modifier les coordonnées et le statut des zones et régions de chasse</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* En-tête avec explication */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
                <h4 className="font-medium text-blue-800 mb-2">Gestion des zones géographiques</h4>
                <p className="text-sm text-gray-700">
                  Cette section vous permet de gérer les contours géographiques des zones de chasse et des régions administratives. Les modifications effectuées ici affecteront la carte interactive et la validité des permis dans ces zones.
                </p>
              </div>

              {/* Tabs pour les différentes actions */}
              <Tabs defaultValue="add-zone" className="w-full">
                <TabsList className="w-full grid grid-cols-4">
                  <TabsTrigger value="add-zone">Ajouter une zone</TabsTrigger>
                  <TabsTrigger value="modify-zone">Modifier une zone</TabsTrigger>
                  <TabsTrigger value="modify-region">Modifier une région</TabsTrigger>
                  <TabsTrigger value="delete-zone">Supprimer une zone</TabsTrigger>
                </TabsList>

                {/* Ajouter une zone */}
                <TabsContent value="add-zone" className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="zoneName">Nom de la zone</Label>
                      <Input id="zoneName" placeholder="Ex: ZIC du Djeuss" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="region">Région</Label>
                      <Select defaultValue="">
                        <SelectTrigger id="region">
                          <SelectValue placeholder="Sélectionner une région" />
                        </SelectTrigger>
                        <SelectContent>
                          {regions.map((region) => (
                            <SelectItem key={region} value={region}>{region}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Département</Label>
                      <Input id="department" placeholder="Ex: Dagana" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zoneType">Type de zone</Label>
                      <Select defaultValue="ZIC">
                        <SelectTrigger id="zoneType">
                          <SelectValue placeholder="Sélectionner un type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ZIC">ZIC - Zone d'Intérêt Cynégétique</SelectItem>
                          <SelectItem value="AMODIEE">Zone Amodiée</SelectItem>
                          <SelectItem value="RESERVE">Réserve Naturelle</SelectItem>
                          <SelectItem value="PARC">Parc National</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Statut</Label>
                      <Select defaultValue="OPEN">
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Sélectionner un statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OPEN">Ouverte à la chasse</SelectItem>
                          <SelectItem value="CLOSED">Fermée à la chasse</SelectItem>
                          <SelectItem value="RESTRICTED">Restrictions spéciales</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-md p-4 mt-4">
                    <h4 className="font-medium text-gray-700 mb-3">Coordonnées du polygone de la zone</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label htmlFor="latitudeAdd">Latitude</Label>
                        <Input id="latitudeAdd" placeholder="Ex: 14.7167" type="number" step="0.0001" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="longitudeAdd">Longitude</Label>
                        <Input id="longitudeAdd" placeholder="Ex: -17.4677" type="number" step="0.0001" />
                      </div>
                    </div>
                    <Button type="button" variant="outline" onClick={() => handleAddPoint('coordsInputsAdd', 'latitudeAdd', 'longitudeAdd')} className="mb-4">
                      <Plus className="h-4 w-4 mr-2" /> Ajouter un point
                    </Button>
                    <div id="coordsInputsAdd" className="mt-2" onClick={handleRemovePoint}></div>
                  </div>

                  <div className="flex space-x-3 mt-6">
                    <Button onClick={handleAddZone} className="bg-green-700 hover:bg-green-800">
                      <Plus className="h-4 w-4 mr-2" /> Ajouter cette zone
                    </Button>
                    <Button variant="outline" onClick={handleRefreshData}>
                      <RefreshCw className="h-4 w-4 mr-2" /> Actualiser les données
                    </Button>
                  </div>
                </TabsContent>

                {/* Modifier une zone */}
                <TabsContent value="modify-zone" className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="zoneSelect">Sélectionner une zone</Label>
                      <Select defaultValue="">
                        <SelectTrigger id="zoneSelect">
                          <SelectValue placeholder="Choisir une zone à modifier" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(zones).map((zone) => (
                            <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newStatus">Nouveau statut</Label>
                      <Select defaultValue="OPEN">
                        <SelectTrigger id="newStatus">
                          <SelectValue placeholder="Sélectionner un statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OPEN">Ouverte à la chasse</SelectItem>
                          <SelectItem value="CLOSED">Fermée à la chasse</SelectItem>
                          <SelectItem value="RESTRICTED">Restrictions spéciales</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-md p-4 mt-4">
                    <h4 className="font-medium text-gray-700 mb-3">Coordonnées du polygone de la zone</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label htmlFor="latitudeMod">Latitude</Label>
                        <Input id="latitudeMod" placeholder="Ex: 14.7167" type="number" step="0.0001" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="longitudeMod">Longitude</Label>
                        <Input id="longitudeMod" placeholder="Ex: -17.4677" type="number" step="0.0001" />
                      </div>
                    </div>
                    <Button type="button" variant="outline" onClick={() => handleAddPoint('coordsInputsMod', 'latitudeMod', 'longitudeMod')} className="mb-4">
                      <Plus className="h-4 w-4 mr-2" /> Ajouter un point
                    </Button>
                    <div id="coordsInputsMod" className="mt-2" onClick={handleRemovePoint}></div>
                  </div>

                  <div className="flex space-x-3 mt-6">
                    <Button onClick={handleUpdateZone} className="bg-amber-600 hover:bg-amber-700">
                      Mettre à jour cette zone
                    </Button>
                    <Button variant="outline" onClick={handleRefreshData}>
                      <RefreshCw className="h-4 w-4 mr-2" /> Actualiser les données
                    </Button>
                  </div>
                </TabsContent>

                {/* Modifier une région */}
                <TabsContent value="modify-region" className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="regionSelect">Sélectionner une région</Label>
                      <Select defaultValue="">
                        <SelectTrigger id="regionSelect">
                          <SelectValue placeholder="Choisir une région à modifier" />
                        </SelectTrigger>
                        <SelectContent>
                          {regions.map((region) => (
                            <SelectItem key={region} value={region}>{region}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="regionStatus">Statut de la région</Label>
                      <Select defaultValue="ACTIVE">
                        <SelectTrigger id="regionStatus">
                          <SelectValue placeholder="Sélectionner un statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="INACTIVE">Inactive</SelectItem>
                          <SelectItem value="SPECIAL">Régime spécial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-md p-4 mt-4">
                    <h4 className="font-medium text-gray-700 mb-3">Points limites de la région</h4>
                    <p className="text-sm text-gray-500 mb-4">Ajouter au moins deux points pour définir les limites de la région (Nord-Ouest et Sud-Est)</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label htmlFor="latitudeRegion">Latitude</Label>
                        <Input id="latitudeRegion" placeholder="Ex: 14.7167" type="number" step="0.0001" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="longitudeRegion">Longitude</Label>
                        <Input id="longitudeRegion" placeholder="Ex: -17.4677" type="number" step="0.0001" />
                      </div>
                    </div>
                    <Button type="button" variant="outline" onClick={() => handleAddPoint('coordsInputsRegion', 'latitudeRegion', 'longitudeRegion')} className="mb-4">
                      <Plus className="h-4 w-4 mr-2" /> Ajouter un point limite
                    </Button>
                    <div id="coordsInputsRegion" className="mt-2" onClick={handleRemovePoint}></div>
                  </div>

                  <div className="flex space-x-3 mt-6">
                    <Button onClick={handleUpdateRegion} className="bg-amber-600 hover:bg-amber-700">
                      Mettre à jour cette région
                    </Button>
                    <Button variant="outline" onClick={handleRefreshData}>
                      <RefreshCw className="h-4 w-4 mr-2" /> Actualiser les données
                    </Button>
                  </div>
                </TabsContent>

                {/* Supprimer une zone */}
                <TabsContent value="delete-zone" className="pt-4 space-y-4">
                  <div className="bg-red-50 border border-red-200 p-4 rounded-md mb-4">
                    <p className="text-red-700 font-medium">Attention : Cette action est irréversible</p>
                    <p className="text-gray-700 text-sm mt-1">La suppression d'une zone de chasse entraînera également la suppression de toutes les données associées à cette zone. Cette action ne peut pas être annulée.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zoneToDelete">Sélectionner une zone à supprimer</Label>
                    <Select defaultValue="">
                      <SelectTrigger id="zoneToDelete">
                        <SelectValue placeholder="Choisir une zone à supprimer" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(zones).map((zone) => (
                          <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex space-x-3 mt-6">
                    <Button onClick={handleDeleteZone} variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" /> Supprimer définitivement
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
