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

// Schema de validation
const agentFormSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  phone: z.string().min(1, "Le numéro de téléphone est requis"),
  matricule: z.string().min(1, "Le matricule est requis"),
  region: z.string().min(1, "La région est requise"),
  // Poste d'affectation supprimé selon la demande
});

type AgentFormValues = z.infer<typeof agentFormSchema>;

interface User {
  id: number;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  matricule: string | null;
  region: string | null;
  role: string;
  serviceLocation?: string | null;
  assignmentPost?: string | null;
}

interface AgentFormProps {
  open: boolean;
  onClose: () => void;
  agent: User;
}

export default function AgentForm({ open, onClose, agent }: AgentFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  // Définir les valeurs par défaut du formulaire
  const defaultValues: Partial<AgentFormValues> = {
    firstName: agent.firstName || "",
    lastName: agent.lastName || "",
    phone: agent.phone || "",
    matricule: agent.matricule || "",
    region: agent.region || "",
  };

  // Initialiser le formulaire
  const form = useForm<AgentFormValues>({
    resolver: zodResolver(agentFormSchema),
    defaultValues,
  });

  // Mutation pour mettre à jour l'agent
  const updateAgentMutation = useMutation({
    mutationFn: async (data: AgentFormValues) => {
      console.log(`🔄 Tentative de mise à jour de l'agent ${agent.id}`, data);
      setIsSaving(true);
      
      try {
        // Utilisez l'URL complète à partir de la racine
        const response = await apiRequest({
          url: `/api/users/${agent.id}`,
          method: "PATCH",
          data
        });
        console.log(`✅ Réponse de mise à jour:`, response);
        return response;
      } catch (error) {
        console.error(`❌ Erreur lors de la mise à jour de l'agent:`, error);
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    onSuccess: (data) => {
      console.log("✅ Mise à jour réussie:", data);
      toast({
        title: "Succès",
        description: "Les informations de l'agent ont été mises à jour avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      onClose();
    },
    onError: (error: any) => {
      console.error("❌ Erreur détaillée lors de la mise à jour:", error);
      
      // Log détaillé pour le débogage
      try {
        console.error("Détails de l'erreur:", JSON.stringify(error, null, 2));
        console.error("Response data:", error.response?.data);
        console.error("Status:", error.response?.status);
      } catch (e) {
        console.error("Erreur lors de la journalisation des détails de l'erreur");
      }
      
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Échec de la mise à jour des informations de l'agent.",
      });
    },
  });

  // Soumission du formulaire
  const onSubmit = (data: AgentFormValues) => {
    console.log("📝 Données du formulaire:", data);
    updateAgentMutation.mutate(data);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifier les informations de l'agent</DialogTitle>
          <DialogDescription>
            Mettez à jour les détails de l'agent {agent.username}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 77 123 45 67" {...field} />
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
                    <Input placeholder="Ex: 740 364/B" {...field} />
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une région" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="dakar">DAKAR</SelectItem>
                      <SelectItem value="thies">THIÈS</SelectItem>
                      <SelectItem value="saint-louis">SAINT-LOUIS</SelectItem>
                      <SelectItem value="louga">LOUGA</SelectItem>
                      <SelectItem value="fatick">FATICK</SelectItem>
                      <SelectItem value="kaolack">KAOLACK</SelectItem>
                      <SelectItem value="kaffrine">KAFFRINE</SelectItem>
                      <SelectItem value="matam">MATAM</SelectItem>
                      <SelectItem value="tambacounda">TAMBACOUNDA</SelectItem>
                      <SelectItem value="kedougou">KÉDOUGOU</SelectItem>
                      <SelectItem value="kolda">KOLDA</SelectItem>
                      <SelectItem value="sedhiou">SÉDHIOU</SelectItem>
                      <SelectItem value="ziguinchor">ZIGUINCHOR</SelectItem>
                      <SelectItem value="diourbel">DIOURBEL</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSaving}
              >
                Annuler
              </Button>
              <Button 
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}