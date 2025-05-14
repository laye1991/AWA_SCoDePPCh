import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { departmentsByRegion } from "@/lib/constants";

// Schema de validation
const addSubAccountFormSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  username: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères"),
  email: z.string().email("L'email doit être valide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  phone: z.string().min(1, "Le numéro de téléphone est requis"),
  matricule: z.string().min(1, "Le matricule est requis"),
  sector: z.string().min(1, "Le secteur est requis"),
});

type AddSubAccountFormValues = z.infer<typeof addSubAccountFormSchema>;

interface AddSubAccountFormProps {
  open: boolean;
  onClose: () => void;
}

export default function AddAgentSubAccountForm({ open, onClose }: AddSubAccountFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  // Définir les valeurs par défaut du formulaire
  const defaultValues: Partial<AddSubAccountFormValues> = {
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    phone: "",
    matricule: "",
    sector: "",
  };

  // Initialiser le formulaire
  const form = useForm<AddSubAccountFormValues>({
    resolver: zodResolver(addSubAccountFormSchema),
    defaultValues
  });

  // Mutation pour créer un sous-compte agent
  const createSubAccountMutation = useMutation({
    mutationFn: async (data: AddSubAccountFormValues) => {
      console.log(`🔄 Tentative de création d'un sous-compte agent`, data);
      setIsSaving(true);
      
      try {
        // Utiliser les données fournies par l'utilisateur
        const username = data.username;
        const password = data.password;
        const email = data.email;
        
        // Récupérer la région actuelle de l'agent
        const region = user?.region || "";
        
        // Préparer les données de l'agent
        const agentData = {
          username,
          password,
          email,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          matricule: data.matricule,
          region,
          serviceLocation: data.sector, // Utiliser le secteur comme lieu de service
          role: "sub-agent", // Rôle spécifique pour les agents secteur
          isActive: true,
          isSuspended: false,
          hunterId: null // Pas de chasseur associé pour ce type de compte
        };
        
        // Envoyer la requête de création
        const response = await apiRequest({
          url: `/api/users`,
          method: "POST",
          data: agentData
        });
        console.log(`✅ Réponse de création du sous-compte:`, response);
        return response;
      } catch (error) {
        console.error(`❌ Erreur lors de la création du sous-compte:`, error);
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    onSuccess: (data) => {
      console.log("✅ Création de l'Agent Secteur réussie:", data);
      toast({
        title: "Succès",
        description: "L'Agent Secteur a été créé avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      console.error("❌ Erreur détaillée lors de la création du sous-compte:", error);
      
      // Log détaillé pour le débogage
      try {
        console.error("Détails de l'erreur:", JSON.stringify(error, null, 2));
        console.error("Response data:", error.response?.data);
        console.error("Status:", error.response?.status);
      } catch (e) {
        console.error("Erreur lors de la journalisation des détails de l'erreur");
      }
      
      // Message d'erreur personnalisé
      let errorMessage = "Impossible de créer l'Agent Secteur.";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast({
        variant: "destructive",
        title: "Erreur",
        description: errorMessage,
      });
    },
  });

  // Soumission du formulaire
  const onSubmit = (data: AddSubAccountFormValues) => {
    console.log("📝 Données du formulaire sous-compte:", data);
    createSubAccountMutation.mutate(data);
  };

  // Récupération des secteurs de la région de l'agent connecté
  const getAgentRegionSectors = () => {
    if (!user) return null;
    
    // Récupérer la région de l'agent connecté
    // Utilisation de user.region s'il est défini, sinon vérifier d'autres propriétés
    let regionKey = "";
    
    // Si l'utilisateur a une région définie directement
    if (user.region) {
      regionKey = user.region;
      console.log(`Agent région directe: ${regionKey}`);
    } 
    // Si l'utilisateur est un chasseur avec une région définie dans le profil chasseur
    else if (user.hunter?.region) {
      regionKey = user.hunter.region;
      console.log(`Agent région via hunter: ${regionKey}`);
    }
    // Utiliser Dakar par défaut si aucune région n'est trouvée (pour démo)
    else {
      console.log("Aucune région trouvée pour l'agent. Utilisation de Dakar par défaut.");
      regionKey = "dakar";
    }
    
    // Convertir la clé de région en minuscules pour correspondre aux clés dans departmentsByRegion
    regionKey = regionKey.toLowerCase();
    
    // Vérifier si la région existe dans notre mapping
    if (!departmentsByRegion[regionKey as keyof typeof departmentsByRegion]) {
      console.warn(`Région non trouvée: ${regionKey}. Utilisation de Dakar par défaut.`);
      regionKey = "dakar";
    }
    
    console.log(`Chargement des secteurs pour la région: ${regionKey}`);
    console.log(departmentsByRegion[regionKey as keyof typeof departmentsByRegion]);
    
    return departmentsByRegion[regionKey as keyof typeof departmentsByRegion] || [];
  };
  
  const sectors = getAgentRegionSectors();

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Ajouter un Agent Secteur</DialogTitle>
          <DialogDescription>
            Créez un nouvel Agent Secteur dans votre région
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom</FormLabel>
                    <FormControl>
                      <Input placeholder="Prénom" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom d'utilisateur</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom d'utilisateur" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Mot de passe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input placeholder="Téléphone" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="matricule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Matricule</FormLabel>
                    <FormControl>
                      <Input placeholder="Matricule" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sector"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Secteur</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un secteur" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sectors && sectors.map((sector) => (
                          <SelectItem key={sector.value} value={sector.value}>
                            {sector.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Création en cours..." : "Créer l'Agent Secteur"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}