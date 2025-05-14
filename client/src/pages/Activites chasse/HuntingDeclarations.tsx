import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, FilePenLine, AlertCircle, Check, HelpCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Types
type Hunter = { id: number; lastName: string; firstName: string };
type Permit = { id: number; permitNumber: string; permitType: string; status: string; expiryDate: string };
type PhacoTax = {
  id: number;
  hunterId: number;
  permitId: number;
  quantity: number;
  huntingDate: string;
  location: string;
  amount: number;
  paymentStatus: string;
  createdAt: string;
};

// Schéma de validation pour la déclaration d'abattage
const huntingDeclarationSchema = z.object({
  permitId: z.string().min(1, "Veuillez sélectionner un permis"),
  quantity: z.string().min(1, "Veuillez indiquer le nombre d'animaux abattus"),
  huntingDate: z.date({
    required_error: "Veuillez sélectionner une date de chasse",
  }),
  location: z.string().min(3, "Veuillez indiquer le lieu de chasse"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof huntingDeclarationSchema>;

export default function HuntingDeclarationsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [_, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("declare");

  // Récupérer les informations du chasseur connecté
  const { data: hunter, isLoading: isLoadingHunter } = useQuery<Hunter>({
    queryKey: ["/api/hunters/me"],
    queryFn: () => apiRequest({ url: "/api/hunters/me", method: "GET" }),
    enabled: !!user && user.role === "hunter",
  });

  // Récupérer les permis actifs du chasseur
  const { data: activePermits = [], isLoading: isLoadingPermits } = useQuery<Permit[]>({
    queryKey: ["/api/permits/active"],
    queryFn: () => apiRequest({ url: "/api/permits/hunter/active", method: "GET" }),
    enabled: !!hunter?.id,
  });

  // Récupérer les déclarations d'abattage (taxes) du chasseur
  const { data: taxDeclarations = [], isLoading: isLoadingTaxes } = useQuery<PhacoTax[]>({
    queryKey: ["/api/taxes/my"],
    queryFn: () => apiRequest({ url: `/api/taxes/hunter/${hunter?.id}`, method: "GET" }),
    enabled: !!hunter?.id,
  });

  // Configuration du formulaire avec validation Zod
  const form = useForm<FormValues>({
    resolver: zodResolver(huntingDeclarationSchema),
    defaultValues: {
      permitId: "",
      quantity: "",
      huntingDate: undefined,
      location: "",
      notes: "",
    },
  });

  // Mutation pour créer une nouvelle déclaration d'abattage
  const createDeclarationMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest({
        url: "/api/taxes",
        method: "POST",
        data: {
          ...data,
          hunterId: hunter?.id,
          // Le montant sera calculé côté serveur en fonction du nombre d'animaux
          paymentStatus: "pending",
        },
      }),
    onSuccess: () => {
      toast({
        title: "Déclaration enregistrée",
        description: "Votre déclaration d'abattage a été enregistrée avec succès.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/taxes/my"] });
      form.reset();
      setActiveTab("history");
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement de votre déclaration.",
        variant: "destructive",
      });
      console.error("Erreur lors de la création de la déclaration:", error);
    },
  });

  const onSubmit = (formData: FormValues) => {
    const data = {
      ...formData,
      permitId: parseInt(formData.permitId),
      quantity: parseInt(formData.quantity),
      huntingDate: format(formData.huntingDate, "yyyy-MM-dd"),
    };
    createDeclarationMutation.mutate(data);
  };

  // Formater le type de permis pour l'affichage
  const formatPermitType = (type: string) => {
    switch (type) {
      case "sportif_petite_chasse": return "Permis sportif de petite chasse";
      case "grande_chasse": return "Permis de grande chasse";
      case "gibier_eau": return "Permis spécial gibier d'eau";
      default: return type;
    }
  };
  
  // Formater le statut de paiement pour l'affichage
  const formatPaymentStatus = (status: string) => {
    switch (status) {
      case "paid": return "Payé";
      case "pending": return "En attente";
      case "overdue": return "En retard";
      default: return status;
    }
  };

  if (isLoadingHunter || isLoadingPermits || isLoadingTaxes) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Vérifier si l'utilisateur est bien un chasseur
  if (!hunter) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Accès refusé</CardTitle>
            <CardDescription>
              Vous devez être enregistré comme chasseur pour accéder à cette page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Veuillez contacter un agent des Eaux et Forêts pour créer votre profil de chasseur.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => setLocation("/dashboard")}>
              Retour au tableau de bord
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Déclarations d'abattage</h1>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="max-w-4xl mx-auto">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="declare">Nouvelle déclaration</TabsTrigger>
          <TabsTrigger value="history">Historique ({taxDeclarations.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="declare">
          <Card>
            <CardHeader>
              <CardTitle>Déclarer un abattage</CardTitle>
              <CardDescription>
                Déclarez les phacochères abattus lors de vos activités de chasse pour être en règle avec la législation.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {activePermits.length === 0 ? (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Aucun permis actif</AlertTitle>
                  <AlertDescription>
                    Vous n'avez pas de permis de chasse actif. Vous devez avoir un permis valide pour déclarer un abattage.
                  </AlertDescription>
                </Alert>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="permitId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Permis utilisé</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un permis" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {activePermits.map((permit) => (
                                <SelectItem key={permit.id} value={permit.id.toString()}>
                                  {permit.permitNumber} - {formatPermitType(permit.permitType)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Sélectionnez le permis utilisé lors de la chasse.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="huntingDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date de chasse</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: fr })
                                  ) : (
                                    <span>Choisir une date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => {
                                  // Désactiver les dates futures
                                  return date > new Date();
                                }}
                                initialFocus
                                locale={fr}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            La date à laquelle l'abattage a eu lieu.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre de phacochères abattus</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                placeholder="Exemple: 2"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Indiquez le nombre total d'animaux abattus.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lieu de chasse</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Exemple: Forêt de Bandia"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Précisez l'endroit où l'abattage a eu lieu.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (facultatif)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Informations supplémentaires..."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Ajoutez des détails supplémentaires si nécessaire.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Alert className="bg-amber-50 border-amber-200">
                      <HelpCircle className="h-4 w-4 text-amber-600" />
                      <AlertTitle>Information importante</AlertTitle>
                      <AlertDescription className="text-amber-800">
                        Les taxes d'abattage sont à régler auprès de votre agent régional ou secteur. 
                        Le tarif est de 15000 FCFA par phacochère abattu. Cette déclaration
                        est obligatoire dans les 48 heures suivant l'abattage.
                      </AlertDescription>
                    </Alert>
                  </form>
                </Form>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setLocation("/dashboard")}>
                Annuler
              </Button>
              
              <Button 
                type="button" 
                onClick={form.handleSubmit(onSubmit)}
                disabled={createDeclarationMutation.isPending || activePermits.length === 0}
              >
                <FilePenLine className="mr-2 h-4 w-4" />
                Soumettre la déclaration
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historique des déclarations</CardTitle>
              <CardDescription>
                Suivi de vos déclarations d'abattage et des paiements associés.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {taxDeclarations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Vous n'avez pas encore effectué de déclaration d'abattage.
                  </p>
                  <Button variant="outline" onClick={() => setActiveTab("declare")}>
                    Faire une déclaration
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableCaption>Liste de vos déclarations d'abattage</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date de chasse</TableHead>
                      <TableHead>Lieu</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut paiement</TableHead>
                      <TableHead>Date déclaration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxDeclarations.map((tax) => (
                      <TableRow key={tax.id}>
                        <TableCell>
                          {format(new Date(tax.huntingDate), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell>{tax.location}</TableCell>
                        <TableCell>{tax.quantity}</TableCell>
                        <TableCell>{tax.amount.toLocaleString()} FCFA</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              tax.paymentStatus === "paid" ? "default" : 
                              tax.paymentStatus === "pending" ? "outline" : "destructive"
                            }
                          >
                            {formatPaymentStatus(tax.paymentStatus)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(tax.createdAt), "dd/MM/yyyy")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}