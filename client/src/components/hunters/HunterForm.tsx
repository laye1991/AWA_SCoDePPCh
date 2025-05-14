import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

const hunterFormSchema = z.object({
  lastName: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
  firstName: z.string().min(2, { message: "Le prénom doit contenir au moins 2 caractères" }),
  dateOfBirth: z.string()
    .refine(val => !isNaN(Date.parse(val)), { message: "Date de naissance invalide" }),
  idNumber: z.string().min(3, { message: "Numéro de pièce d'identité invalide" }),
  phone: z.string().min(8, { message: "Numéro de téléphone invalide" }),
  address: z.string().min(5, { message: "Adresse invalide" }),
  experience: z.coerce.number().min(0, { message: "L'expérience ne peut pas être négative" }),
  profession: z.string().min(2, { message: "Profession invalide" }),
  category: z.enum(["resident", "coutumier", "touristique"], { message: "Veuillez sélectionner une catégorie" }),
  region: z.string().optional(),
  zone: z.string().optional()
});

type HunterFormData = z.infer<typeof hunterFormSchema>;

interface HunterFormProps {
  hunterId?: number;
  open: boolean;
  onClose: () => void;
}

export default function HunterForm({ hunterId, open, onClose }: HunterFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!hunterId;

  const form = useForm<HunterFormData>({
    resolver: zodResolver(hunterFormSchema),
    defaultValues: {
      lastName: "",
      firstName: "",
      dateOfBirth: format(new Date(), "yyyy-MM-dd"),
      idNumber: "",
      phone: "",
      address: "",
      experience: 0,
      profession: "",
      category: "resident",
      region: "",
      zone: "",
    },
  });

  // If hunterId is provided, fetch hunter data for editing
  const [isLoading, setIsLoading] = useState(isEditing);

  // Charger les données du chasseur pour l'édition
  useEffect(() => {
    if (isEditing && hunterId) {
      setIsLoading(true);
      fetch(`/api/hunters/${hunterId}`)
        .then(res => res.json())
        .then(hunterData => {
          // Format de la date pour l'input date
          const formattedDate = hunterData.dateOfBirth 
            ? format(new Date(hunterData.dateOfBirth), "yyyy-MM-dd")
            : format(new Date(), "yyyy-MM-dd");

          form.reset({
            lastName: hunterData.lastName || "",
            firstName: hunterData.firstName || "",
            dateOfBirth: formattedDate,
            idNumber: hunterData.idNumber || "",
            phone: hunterData.phone || "",
            address: hunterData.address || "",
            experience: hunterData.experience || 0,
            profession: hunterData.profession || "",
            category: hunterData.category || "resident",
            region: hunterData.region || "",
            zone: hunterData.zone || "",
          });
        })
        .catch(error => {
          console.error("Erreur lors du chargement des données du chasseur:", error);
          toast({
            title: "Erreur",
            description: "Impossible de charger les informations du chasseur",
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [hunterId, isEditing, form, toast]);

  async function onSubmit(data: HunterFormData) {
    setIsSubmitting(true);
    try {
      const endpoint = isEditing ? `/api/hunters/${hunterId}` : "/api/hunters";
      const method = isEditing ? "PUT" : "POST";
      
      await apiRequest({
        url: endpoint,
        method: method,
        data: data
      });
      
      // Invalidate hunters query cache
      queryClient.invalidateQueries({ queryKey: ["/api/hunters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      toast({
        title: isEditing ? "Chasseur mis à jour" : "Chasseur créé",
        description: `${data.lastName} ${data.firstName} a été ${isEditing ? "mis à jour" : "ajouté"} avec succès.`,
        variant: "default",
      });
      
      onClose();
    } catch (error) {
      console.error("Error saving hunter:", error);
      toast({
        title: "Erreur",
        description: `Une erreur est survenue lors de l'enregistrement du chasseur.`,
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
            {isEditing ? "Modifier un Chasseur" : "Ajouter un Chasseur"}
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de Naissance</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="idNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numéro de Pièce d'Identité ou de passeport</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Numéro de Pièce d'Identité ou de passeport" 
                      {...field} 
                      onChange={(e) => {
                        // Filtrer pour n'accepter que des caractères alphanumériques
                        const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                        field.onChange(value);
                      }}
                    />
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
                    <Input placeholder="+221 XX XXX XX XX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Adresse" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="experience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Années d'expérience de chasse</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="profession"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profession</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Profession" 
                      {...field} 
                      className="capitalize"
                      onChange={(e) => {
                        // Filtrer pour n'accepter que des lettres, espaces et tirets
                        const value = e.target.value.replace(/[^A-Za-z\u00C0-\u017F\s\-]/g, '');
                        // Convertir la première lettre en majuscule
                        const capitalized = value && value.length > 0 ? value.charAt(0).toUpperCase() + value.slice(1) : value;
                        field.onChange(capitalized);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catégorie</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="resident">Résident</SelectItem>
                      <SelectItem value="coutumier">Coutumier</SelectItem>
                      <SelectItem value="touristique">Touriste</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Région de résidence</FormLabel>
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
              <FormField
                control={form.control}
                name="zone"
                render={({ field }) => (
                  <FormItem>
                    {/* Champ Zone supprimé */}
                  </FormItem>
                )}
              />
            </div>

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
      </DialogContent>
    </Dialog>
  );
}
