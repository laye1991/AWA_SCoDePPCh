import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { regionEnum } from "@/lib/constants";

// Schema de validation
const addAgentFormSchema = z.object({
  username: z.string().min(1, "Le nom d'utilisateur est requis"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  email: z.string().email("Email invalide"),
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  phone: z.string().min(1, "Le numéro de téléphone est requis"),
  matricule: z.string().min(1, "Le matricule est requis"),
  region: z.string().min(1, "La région est requise"),
  serviceLocation: z.string().optional()
  // assignmentPost supprimé selon la demande
});

type AddAgentFormValues = z.infer<typeof addAgentFormSchema>;

interface AddAgentFormProps {
  open: boolean;
  onClose: () => void;
}

export default function AddAgentForm({ open, onClose }: AddAgentFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  // Définir les valeurs par défaut du formulaire
  const defaultValues: Partial<AddAgentFormValues> = {
    username: "",
    password: "",
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    matricule: "",
    region: "",
    serviceLocation: ""
    // assignmentPost supprimé selon la demande
  };

  // Initialiser le formulaire
  const form = useForm<AddAgentFormValues>({
    resolver: zodResolver(addAgentFormSchema),
    defaultValues
  });

  // Mutation pour créer un agent
  const createAgentMutation = useMutation({
    mutationFn: async (data: AddAgentFormValues) => {
      console.log(`🔄 Tentative de création d'un nouvel agent`, data);
      setIsSaving(true);
      
      try {
        // Ajouter le rôle agent
        const agentData = {
          ...data,
          role: "agent"
        };
        
        // Utilisez l'URL complète à partir de la racine
        const response = await apiRequest({
          url: `/api/users`,
          method: "POST",
          data: agentData
        });
        console.log(`✅ Réponse de création:`, response);
        return response;
      } catch (error) {
        console.error(`❌ Erreur lors de la création de l'agent:`, error);
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    onSuccess: (data) => {
      console.log("✅ Création réussie:", data);
      toast({
        title: "Succès",
        description: "L'agent a été créé avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      console.error("❌ Erreur détaillée lors de la création:", error);
      
      // Log détaillé pour le débogage
      try {
        console.error("Détails de l'erreur:", JSON.stringify(error, null, 2));
        console.error("Response data:", error.response?.data);
        console.error("Status:", error.response?.status);
      } catch (e) {
        console.error("Erreur lors de la journalisation des détails de l'erreur");
      }
      
      // Message d'erreur personnalisé
      let errorMessage = "Impossible de créer l'agent.";
      
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
  const onSubmit = (data: AddAgentFormValues) => {
    console.log("📝 Données du formulaire:", data);
    createAgentMutation.mutate(data);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Ajouter un Agent des Eaux et Forêts</DialogTitle>
          <DialogDescription>
            Créez un nouveau compte pour un agent des Eaux et Forêts
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Région</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une région" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {regionEnum.map((region) => (
                          <SelectItem key={region.value} value={region.value}>
                            {region.label}
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
                name="serviceLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lieu de service</FormLabel>
                    <FormControl>
                      <Input placeholder="Lieu de service (optionnel)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Champ assignmentPost supprimé selon la demande */}
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isSaving}>
                {isSaving ? "Création en cours..." : "Créer l'agent"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}