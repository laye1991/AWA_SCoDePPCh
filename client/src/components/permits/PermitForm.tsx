import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format, addYears } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Hunter } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

// Custom types for permit categories and prices
interface PermitCategory {
  id: string;
  name: string;
  price: number;
  durationYears: number;
}

// Initialiser avec des valeurs selon le tableau des tarifs fourni
const defaultPermitCategories: PermitCategory[] = [
  // Catégorie Coutumier Petite Chasse
  { id: "coutumier-petite-chasse", name: "Coutumier Petite Chasse", price: 3000, durationYears: 1 },
  
  // Catégorie Résident Petite Chasse
  { id: "resident-petite-chasse", name: "Résident Petite Chasse", price: 15000, durationYears: 1 },
  
  // Catégorie Résident Grande Chasse
  { id: "resident-grande-chasse", name: "Résident Grande Chasse", price: 45000, durationYears: 1 },
  
  // Catégorie Résident Gibier-Eau
  { id: "resident-gibier-eau", name: "Résident Gibier d'Eau", price: 30000, durationYears: 1 },
  
  // Catégorie Touriste Petite Chasse
  { id: "touriste-petite-chasse-1semaine", name: "Touriste Petite Chasse (1 semaine)", price: 15000, durationYears: 1/52 },
  { id: "touriste-petite-chasse-2semaines", name: "Touriste Petite Chasse (2 semaines)", price: 25000, durationYears: 2/52 },
  { id: "touriste-petite-chasse-1mois", name: "Touriste Petite Chasse (1 mois)", price: 45000, durationYears: 1/12 },
  
  // Catégorie Touriste Grande Chasse
  { id: "touriste-grande-chasse-1semaine", name: "Touriste Grande Chasse (1 semaine)", price: 30000, durationYears: 1/52 },
  { id: "touriste-grande-chasse-2semaines", name: "Touriste Grande Chasse (2 semaines)", price: 50000, durationYears: 2/52 },
  { id: "touriste-grande-chasse-1mois", name: "Touriste Grande Chasse (1 mois)", price: 90000, durationYears: 1/12 },
  
  // Catégorie Touriste Gibier-Eau
  { id: "touriste-gibier-eau-1semaine", name: "Touriste Gibier d'Eau (1 semaine)", price: 15000, durationYears: 1/52 },
  { id: "touriste-gibier-eau-1mois", name: "Touriste Gibier d'Eau (1 mois)", price: 45000, durationYears: 1/12 },
];

const permitFormSchema = z.object({
  permitNumber: z.string().min(3, { message: "Numéro de permis invalide" }),
  hunterId: z.coerce.number().min(1, { message: "Veuillez sélectionner un chasseur" }),
  categoryId: z.string().min(1, { message: "Veuillez sélectionner une catégorie" }),
  issueDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Date d'émission invalide" }),
  price: z.coerce.number().min(1, { message: "Le prix doit être positif" }),
});

type PermitFormData = z.infer<typeof permitFormSchema>;

interface PermitFormProps {
  permitId?: number;
  open: boolean;
  onClose: () => void;
}

export default function PermitForm({ permitId, open, onClose }: PermitFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hunters, setHunters] = useState<Hunter[]>([]);
  const [loading, setLoading] = useState(true);
  const isEditing = !!permitId;

  // État pour stocker la catégorie du chasseur
  const [hunterCategory, setHunterCategory] = useState<string>("");
  // État pour stocker les catégories de permis chargées depuis l'API
  const [permitCategories, setPermitCategories] = useState<PermitCategory[]>(defaultPermitCategories);
  // État pour stocker les catégories filtrées
  const [filteredCategories, setFilteredCategories] = useState<PermitCategory[]>(defaultPermitCategories);
  
  // Fonction pour générer un numéro de permis basé sur l'ID en utilisant l'API
  const generatePermitNumber = async (hunterId: number): Promise<string> => {
    try {
      // Utiliser la nouvelle API dédiée pour générer le numéro de permis
      const response = await fetch(`/api/permits/generate-number/${hunterId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erreur API:", errorData);
        throw new Error(errorData.message || "Échec de la génération du numéro de permis");
      }
      
      const data = await response.json();
      
      // Stocker la catégorie du chasseur et filtrer les catégories de permis
      if (data.hunterCategory) {
        setHunterCategory(data.hunterCategory);
        filterPermitCategories(data.hunterCategory);
      }
      
      return data.permitNumber;
    } catch (error) {
      console.error("Erreur dans generatePermitNumber:", error);
      // Générer un numéro de secours si l'API échoue
      const currentYear = new Date().getFullYear();
      const timestamp = Date.now().toString().slice(-6);
      return `SN-${currentYear}-${timestamp}-${hunterId}`;
    }
  };
  
  // Fonction pour filtrer les catégories de permis en fonction du type de chasseur
  const filterPermitCategories = (category: string) => {
    let filtered: PermitCategory[] = [];
    
    switch(category) {
      case "resident":
        // Un résident ne peut pas choisir un permis coutumier ou touriste
        filtered = permitCategories.filter((c: PermitCategory) => 
          c.id.includes("resident") && 
          !c.id.includes("coutumier") && 
          !c.id.includes("touriste")
        );
        break;
      case "coutumier":
        // Un chasseur coutumier ne peut choisir que le permis coutumier
        filtered = permitCategories.filter((c: PermitCategory) => 
          c.id.includes("coutumier")
        );
        break;
      case "touristique":
        // Un touriste ne peut choisir que les permis touristes
        filtered = permitCategories.filter((c: PermitCategory) => 
          c.id.includes("touriste")
        );
        break;
      default:
        // Par défaut, afficher toutes les catégories
        filtered = [...permitCategories];
    }
    
    setFilteredCategories(filtered);
    
    // Si la liste filtrée n'est pas vide, sélectionner par défaut la première option
    if (filtered.length > 0) {
      form.setValue("categoryId", filtered[0].id);
      form.setValue("price", filtered[0].price);
    }
  };

  const form = useForm<PermitFormData>({
    resolver: zodResolver(permitFormSchema),
    defaultValues: {
      permitNumber: "",
      hunterId: 0,
      categoryId: defaultPermitCategories[0].id,
      issueDate: format(new Date(), "yyyy-MM-dd"),
      price: defaultPermitCategories[0].price,
    },
  });

  useEffect(() => {
    // Set initial permit number
    const initPermitNumber = async () => {
      try {
        const hunterId = form.getValues("hunterId");
        if (hunterId) {
          const number = await generatePermitNumber(hunterId);
          form.setValue("permitNumber", number);
        }
      } catch (error) {
        console.error("Error generating permit number:", error);
        toast({
          title: "Erreur",
          description: "Impossible de générer le numéro de permis",
          variant: "destructive",
        });
      }
    };

    if (!isEditing) {
      initPermitNumber();
    }
    
    // Fonction pour charger les tarifs de permis
    const fetchPermitFees = async () => {
      try {
        const response = await fetch("/api/settings/permit-fees");
        if (!response.ok) {
          throw new Error("Échec du chargement des tarifs");
        }
        
        const fees = await response.json();
        
        // Mettre à jour les catégories de permis avec les tarifs officiels
        const updatedCategories: PermitCategory[] = [
          // Catégorie Coutumier Petite Chasse
          { id: "coutumier-petite-chasse", name: "Coutumier Petite Chasse", price: fees.coutumierPetiteChasse || 3000, durationYears: 1 },
          
          // Catégorie Résident Petite Chasse
          { id: "resident-petite-chasse", name: "Résident Petite Chasse", price: fees.residentPetiteChasse || 15000, durationYears: 1 },
          
          // Catégorie Résident Grande Chasse
          { id: "resident-grande-chasse", name: "Résident Grande Chasse", price: fees.residentGrandeChasse || 45000, durationYears: 1 },
          
          // Catégorie Résident Gibier-Eau
          { id: "resident-gibier-eau", name: "Résident Gibier d'Eau", price: fees.residentGibierEau || 30000, durationYears: 1 },
          
          // Catégorie Touriste Petite Chasse
          { id: "touriste-petite-chasse-1semaine", name: "Touriste Petite Chasse (1 semaine)", price: fees.touristePetiteChasse1Semaine || 15000, durationYears: 1/52 },
          { id: "touriste-petite-chasse-2semaines", name: "Touriste Petite Chasse (2 semaines)", price: fees.touristePetiteChasse2Semaines || 25000, durationYears: 2/52 },
          { id: "touriste-petite-chasse-1mois", name: "Touriste Petite Chasse (1 mois)", price: fees.touristePetiteChasse1Mois || 45000, durationYears: 1/12 },
          
          // Catégorie Touriste Grande Chasse
          { id: "touriste-grande-chasse-1semaine", name: "Touriste Grande Chasse (1 semaine)", price: fees.touristeGrandeChasse1Semaine || 30000, durationYears: 1/52 },
          { id: "touriste-grande-chasse-2semaines", name: "Touriste Grande Chasse (2 semaines)", price: fees.touristeGrandeChasse2Semaines || 50000, durationYears: 2/52 },
          { id: "touriste-grande-chasse-1mois", name: "Touriste Grande Chasse (1 mois)", price: fees.touristeGrandeChasse1Mois || 90000, durationYears: 1/12 },
          
          // Catégorie Touriste Gibier-Eau
          { id: "touriste-gibier-eau-1semaine", name: "Touriste Gibier d'Eau (1 semaine)", price: fees.touristeGibierEau1Semaine || 15000, durationYears: 1/52 },
          { id: "touriste-gibier-eau-1mois", name: "Touriste Gibier d'Eau (1 mois)", price: fees.touristeGibierEau1Mois || 45000, durationYears: 1/12 },
        ];
        
        setPermitCategories(updatedCategories);
        setFilteredCategories(updatedCategories);
        
        // Si on a déjà une catégorie sélectionnée, mettre à jour son prix
        const categoryId = form.getValues("categoryId");
        if (categoryId) {
          const selectedCategory = updatedCategories.find(c => c.id === categoryId);
          if (selectedCategory) {
            form.setValue("price", selectedCategory.price);
          }
        } else {
          // Sinon, initialiser avec la première catégorie
          form.setValue("categoryId", updatedCategories[0].id);
          form.setValue("price", updatedCategories[0].price);
        }
        
      } catch (error) {
        console.error("Erreur lors du chargement des tarifs:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les tarifs des permis. Les tarifs par défaut seront utilisés.",
          variant: "destructive",
        });
      }
    };

    // Fetch hunters for the select dropdown
    const fetchHunters = async () => {
      setLoading(true);
      try {
        // Charger les chasseurs et les tarifs en parallèle
        const [huntersResponse] = await Promise.all([
          fetch("/api/hunters"),
          fetchPermitFees() // Cette fonction ne retourne pas de valeur, donc on ne la déstructure pas
        ]);
        
        if (!huntersResponse.ok) throw new Error("Failed to fetch hunters");
        const data = await huntersResponse.json();
        setHunters(data);
      } catch (err) {
        console.error("Error fetching hunters:", err);
        toast({
          title: "Erreur",
          description: "Impossible de charger la liste des chasseurs",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHunters();
  }, [toast]);


  // Handle category change to update price automatically
  const handleCategoryChange = (categoryId: string) => {
    const category = permitCategories.find((c: PermitCategory) => c.id === categoryId);
    if (category) {
      form.setValue("price", category.price);

      // Calculate expiry date (not part of the form but will be used in submission)
      const issueDate = form.getValues("issueDate");
      if (issueDate) {
        const expiryDate = addYears(new Date(issueDate), category.durationYears);
        // We'll use this when submitting
      }
    }
  };

  async function onSubmit(data: PermitFormData) {
    setIsSubmitting(true);
    try {
      // Valider les données requises
      if (!data.hunterId || !data.categoryId || !data.issueDate) {
        throw new Error("Veuillez remplir tous les champs obligatoires");
      }

      // S'assurer que le numéro de permis est défini
      if (!data.permitNumber || data.permitNumber.trim() === "") {
        // Générer un numéro de permis si non défini
        try {
          const generatedNumber = await generatePermitNumber(data.hunterId);
          form.setValue("permitNumber", generatedNumber);
          data.permitNumber = generatedNumber;
        } catch (error) {
          throw new Error("Impossible de générer le numéro de permis");
        }
      }

      // Find the selected category
      const category = permitCategories.find((c: PermitCategory) => c.id === data.categoryId);
      if (!category) {
        throw new Error("Catégorie de permis invalide");
      }

      // Vérifier si le chasseur existe
      const hunterResponse = await fetch(`/api/hunters/${data.hunterId}`);
      if (!hunterResponse.ok) {
        throw new Error("Chasseur non trouvé");
      }

      // Calculate expiry date based on permit type and hunting season settings
      const issueDate = new Date(data.issueDate);
      let expiryDate;

      if (category.id.includes('special-gibier-eau')) {
        // Pour la chasse au gibier d'eau, utiliser la date de fermeture spéciale
        const response = await fetch('/api/settings/campaign');
        const campaign = await response.json();
        expiryDate = new Date(campaign.waterGameEndDate || "2024-04-30"); // Date par défaut si non définie
      } else {
        // Pour les autres types, utiliser la date de fermeture générale
        const response = await fetch('/api/settings/campaign');
        const campaign = await response.json();
        expiryDate = new Date(campaign.endDate || "2024-04-30"); // Date par défaut si non définie
      }

      // Préparer les valeurs pour type basé sur la catégorie
      let permitType = "petite-chasse";
      if (category.id.includes('grande-chasse')) {
        permitType = "grande-chasse";
      } else if (category.id.includes('special-gibier-eau')) {
        permitType = "gibier-eau";
      }

      // Prepare data for API - We should match exactly what the server schema expects
      const permitData = {
        permitNumber: data.permitNumber,
        hunterId: parseInt(data.hunterId.toString()),
        issueDate: format(new Date(data.issueDate), 'yyyy-MM-dd'),
        expiryDate: format(expiryDate, 'yyyy-MM-dd'),
        status: "active",
        price: parseFloat(data.price.toString()),
        type: permitType,
        categoryId: category.id, // Stocke l'ID de la catégorie pour afficher "Coutumier"
        area: "Sénégal", // Valeur par défaut
        // Autres champs optionnels
        receiptNumber: `REC-${Math.floor(Math.random() * 1000)}-${new Date().getFullYear()}`,
        weapons: category.id.includes('grande-chasse') ? "Carabine" : "Fusil",
      };

      // Log pour debug
      console.log("Envoi des données du permis:", permitData);

      const endpoint = isEditing ? `/api/permits/${permitId}` : "/api/permits";
      const method = isEditing ? "PUT" : "POST";

      // Log the data being sent to the API
      console.log("Sending permit data:", permitData);

      try {
        // Utiliser fetch directement pour pouvoir gérer mieux les erreurs
        const response = await fetch(endpoint, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(permitData)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Erreur API détaillée:", errorData);
          throw new Error(errorData.message || "Échec de la création du permis");
        }
        
        const result = await response.json();
        console.log("Réponse API réussie:", result);
        
        // Invalidate queries directement ici
        queryClient.invalidateQueries({ queryKey: ["/api/permits"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        
        return result;
      } catch (error) {
        console.error("Erreur lors de l'envoi de la requête:", error);
        throw error;
      }

      toast({
        title: isEditing ? "Permis mis à jour" : "Permis créé",
        description: `Le permis ${data.permitNumber} a été ${isEditing ? "mis à jour" : "créé"} avec succès.`,
        variant: "default",
      });

      onClose();
    } catch (error) {
      console.error("Error saving permit:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'enregistrement du permis",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90%] md:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center">
            {isEditing ? "Modifier un Permis" : "Ajouter un Permis"}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-4 text-center">Chargement des données...</div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="permitNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro de Permis</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly={!isEditing} placeholder="Auto-généré après sélection du chasseur" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="hunterId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chasseur</FormLabel>
                    <Select 
                      onValueChange={async (value) => {
                        const hunterId = parseInt(value);
                        field.onChange(hunterId);
                        
                        // Chercher le chasseur pour déterminer son type (résident, coutumier, etc.)
                        const selectedHunter = hunters.find(h => h.id === hunterId);
                        if (selectedHunter) {
                          // Filtrer les catégories de permis en fonction du type de chasseur
                          // On utilise la catégorie du chasseur (category) pour déterminer le type
                          filterPermitCategories(selectedHunter.category.toLowerCase());
                        }
                        
                        // Générer automatiquement le numéro de permis lors de la sélection du chasseur
                        if (hunterId && !isEditing) {
                          try {
                            const permitNumber = await generatePermitNumber(hunterId);
                            form.setValue("permitNumber", permitNumber);
                          } catch (error) {
                            console.error("Erreur de génération du numéro de permis:", error);
                            toast({
                              title: "Erreur",
                              description: "Impossible de générer le numéro de permis",
                              variant: "destructive",
                            });
                          }
                        }
                      }}
                      defaultValue={field.value > 0 ? field.value.toString() : ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un chasseur" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {hunters.map((hunter) => (
                          <SelectItem key={hunter.id} value={hunter.id.toString()}>
                            {hunter.firstName} {hunter.lastName} - {hunter.idNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de Permis</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleCategoryChange(value);
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un type de permis" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix (FCFA)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} readOnly />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date d'Émission</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} readOnly />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}