import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Hunter, Permit } from "@shared/schema";
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

// Define animal types and prices
interface AnimalType {
  id: string;
  name: string;
  price: number;
}

const animalTypes: AnimalType[] = [
  { id: "phacochère (ier)", name: "Phacochère (1ier)", price: 15000 },
  { id: "céphalophe", name: "Céphalophe", price: 40000 },
  { id: "phacochère (2ième)", name: "Phacochère (2ième)", price: 20000 },
  { id: "gazelle front roux", name: "Gazelle front roux", price: 50000 },
  { id: "phacochère (3ième)", name: "Phacochère (3ième)", price: 25000 },
  { id: "buffle", name: "Buffle", price: 200000 },
  { id: "cobe", name: "Cobe de Buffon", price: 100000 },
  { id: "ourébi", name: "Ourébi", price: 40000 },
  { id: "guib", name: "Guib harnaché", price: 60000 },
  { id: "hippotrague", name: "Hippotrague", price: 200000 },
  { id: "bubale", name: "Bubale", price: 100000 },
];

const taxFormSchema = z.object({
  taxNumber: z.string().min(3, { message: "Numéro de taxe invalide" }),
  hunterId: z.coerce.number().min(1, { message: "Veuillez sélectionner un chasseur" }),
  permitId: z.coerce.number().min(1, { message: "Veuillez sélectionner un permis" }),
  animalTypeId: z.string().min(1, { message: "Veuillez sélectionner un type d'animal" }),
  quantity: z.coerce.number().min(1, { message: "La quantité doit être d'au moins 1" }),
  location: z.string().min(3, { message: "Veuillez spécifier le lieu d'abattage" }),
  issueDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Date d'émission invalide" }),
  amount: z.coerce.number().min(1, { message: "Le montant doit être positif" }),
});

type TaxFormData = z.infer<typeof taxFormSchema>;

interface TaxFormProps {
  taxId?: number;
  open: boolean;
  onClose: () => void;
}

export default function TaxForm({ taxId, open, onClose }: TaxFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hunters, setHunters] = useState<Hunter[]>([]);
  const [permits, setPermits] = useState<Permit[]>([]);
  const [loading, setLoading] = useState(true);
  const isEditing = !!taxId;

  const form = useForm<TaxFormData>({
    resolver: zodResolver(taxFormSchema),
    defaultValues: {
      taxNumber: generateTaxNumber(),
      hunterId: 0,
      permitId: 0,
      animalTypeId: "",
      quantity: 1,
      location: "",
      issueDate: format(new Date(), "yyyy-MM-dd"),
      amount: 0,
    },
  });

  // Watch for changes to quantity and animal type
  const quantity = form.watch("quantity");
  const animalTypeId = form.watch("animalTypeId");
  const hunterId = form.watch("hunterId");

  useEffect(() => {
    // Update amount when quantity or animal type changes
    if (animalTypeId) {
      const animalType = animalTypes.find(a => a.id === animalTypeId);
      if (animalType) {
        const amount = animalType.price * quantity;
        form.setValue("amount", amount);
      }
    }
  }, [quantity, animalTypeId, form]);

  useEffect(() => {
    // Fetch hunters for the select dropdown
    const fetchHunters = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/hunters");
        if (!res.ok) throw new Error("Failed to fetch hunters");
        const data = await res.json();
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

  useEffect(() => {
    // When hunter changes, fetch their permits
    const fetchPermits = async () => {
      if (hunterId > 0) {
        try {
          const res = await fetch(`/api/permits/hunter/${hunterId}`);
          if (!res.ok) throw new Error("Failed to fetch permits");
          const allPermits = await res.json();
          
          // Filter to only show active permits
          const today = new Date();
          const activePermits = allPermits.filter((permit: Permit) => 
            permit.status === 'active' && new Date(permit.expiryDate) >= today
          );
          
          setPermits(activePermits);
          
          // Reset permit selection if previous selection is no longer valid
          const currentPermitId = form.getValues("permitId");
          if (currentPermitId && !activePermits.some(p => p.id === currentPermitId)) {
            form.setValue("permitId", 0);
          }
        } catch (err) {
          console.error("Error fetching permits:", err);
          toast({
            title: "Erreur",
            description: "Impossible de charger les permis du chasseur",
            variant: "destructive",
          });
        }
      } else {
        setPermits([]);
        form.setValue("permitId", 0);
      }
    };

    fetchPermits();
  }, [hunterId, form, toast]);

  // Function to generate a tax number
  function generateTaxNumber() {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `T-SN-${year}-${random}`;
  }

  async function onSubmit(data: TaxFormData) {
    setIsSubmitting(true);
    try {
      // Prepare data for API
      const taxData = {
        taxNumber: data.taxNumber,
        hunterId: data.hunterId,
        permitId: data.permitId,
        amount: data.amount,
        issueDate: new Date(data.issueDate).toISOString().split('T')[0],
        animalType: data.animalTypeId,
        quantity: data.quantity,
        location: data.location,
      };
      
      const endpoint = isEditing ? `/api/taxes/${taxId}` : "/api/taxes";
      const method = isEditing ? "PUT" : "POST";
      
      // Utiliser fetch directement au lieu de apiRequest pour éviter les problèmes d'URL
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taxData)
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} ${await response.text()}`);
      }
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/taxes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
      toast({
        title: isEditing ? "Taxe mise à jour" : "Taxe créée",
        description: `La taxe ${data.taxNumber} a été ${isEditing ? "mise à jour" : "créée"} avec succès.`,
        variant: "default",
      });
      
      onClose();
    } catch (error) {
      console.error("Error saving tax:", error);
      toast({
        title: "Erreur",
        description: `Une erreur est survenue lors de l'enregistrement de la taxe. ${error instanceof Error ? error.message : ''}`,
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
            {isEditing ? "Modifier une Taxe d'Abattage" : "Ajouter une Taxe d'Abattage"}
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
                name="taxNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro de Taxe</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly={isEditing} />
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
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
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
                name="permitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Permis</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                      disabled={permits.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un permis" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {permits.length > 0 ? (
                          permits.map((permit) => (
                            <SelectItem key={permit.id} value={permit.id.toString()}>
                              {permit.permitNumber} (expire: {format(new Date(permit.expiryDate), "dd/MM/yyyy")})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-permit" disabled>
                            Aucun permis actif disponible
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {permits.length === 0 && hunterId > 0 && (
                      <p className="text-sm text-destructive">Ce chasseur n'a pas de permis actif</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="animalTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type d'Animal</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un type d'animal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {animalTypes.map((animal) => (
                          <SelectItem key={animal.id} value={animal.id}>
                            {animal.name} - {animal.price.toLocaleString()} FCFA
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
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantité</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lieu d'Abattage</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Lieu où l'animal a été abattu" 
                        className="bg-yellow-50 border-yellow-200 focus:border-yellow-300" 
                        {...field} 
                      />
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
                    <FormLabel>Date d'Abattage</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Montant Total (FCFA)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} readOnly />
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
