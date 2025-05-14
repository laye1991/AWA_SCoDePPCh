import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CalendarIcon, FilePlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Schéma de validation pour la demande de permis
const permitRequestSchema = z.object({
  permitType: z.enum(["sportif_petite_chasse", "grande_chasse", "gibier_eau"], {
    required_error: "Veuillez sélectionner un type de permis",
  }),
  permitCategory: z.enum(["resident", "touriste", "coutumier"], {
    required_error: "Veuillez sélectionner une catégorie",
  }),
  duration: z.enum(["season", "one_month", "two_weeks", "one_week"], {
    required_error: "Veuillez sélectionner une durée",
  }),
  startDate: z.date({
    required_error: "Veuillez sélectionner une date de début",
  }),
  reason: z.string().min(10, "Veuillez fournir une raison d'au moins 10 caractères").max(500, "La raison ne doit pas dépasser 500 caractères"),
  previousExperience: z.string().optional(),
  additionalNotes: z.string().optional(),
});

type FormValues = z.infer<typeof permitRequestSchema>;

export default function PermitRequestPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [_, setLocation] = useLocation();
  const [step, setStep] = useState<number>(1);
  const [totalSteps, setTotalSteps] = useState<number>(3);
  const [permitFee, setPermitFee] = useState<number | null>(null);

  // Récupérer les informations du chasseur connecté
  const { data: hunter, isLoading: isLoadingHunter } = useQuery({
    queryKey: ["/api/hunters/me"],
    queryFn: () => apiRequest({ url: "/api/hunters/me", method: "GET" }),
    enabled: !!user && user.role === "hunter",
  });

  // Récupérer les tarifs des permis
  const { data: permitFees, isLoading: isLoadingFees } = useQuery({
    queryKey: ["/api/settings/permit-fees"],
    queryFn: () => apiRequest({ url: "/api/settings/permit-fees", method: "GET" }),
  });

  // Récupérer la campagne de chasse actuelle - directement depuis les paramètres généraux définis par l'administrateur
  const { data: campaign, isLoading: isLoadingCampaign } = useQuery({
    queryKey: ["/api/settings/hunting-campaign"],
    queryFn: () => apiRequest({ url: "/api/settings/hunting-campaign", method: "GET" }),
    refetchInterval: 60000, // Actualiser toutes les minutes pour avoir les derniers paramètres
  });

  // Formulaire avec validation Zod
  const form = useForm<FormValues>({
    resolver: zodResolver(permitRequestSchema),
    defaultValues: {
      permitType: undefined,
      permitCategory: undefined,
      duration: undefined,
      startDate: undefined,
      reason: "",
      previousExperience: "",
      additionalNotes: "",
    },
  });

  // Observer les changements pour calculer le tarif
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (
        (name === "permitType" || name === "permitCategory" || name === "duration") &&
        value.permitType && value.permitCategory && value.duration && permitFees
      ) {
        calculateFee(value.permitType, value.permitCategory, value.duration);
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch, permitFees]);

  // Mutation pour soumettre la demande de permis
  const createPermitRequestMutation = useMutation({
    mutationFn: (data: FormValues) => 
      apiRequest({
        url: "/api/permit-requests",
        method: "POST",
        data: {
          ...data, 
          hunterId: hunter?.id,
          userId: user?.id,
          status: "pending",
          estimatedFee: permitFee,
        },
      }),
    onSuccess: () => {
      toast({
        title: "Demande soumise avec succès",
        description: "Votre demande de permis a été enregistrée et sera traitée par un agent.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/permit-requests/my"] });
      setLocation("/my-permits");
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la soumission de votre demande. Veuillez réessayer.",
        variant: "destructive",
      });
      console.error("Erreur lors de la soumission de la demande:", error);
    },
  });

  const onSubmit = (data: FormValues) => {
    createPermitRequestMutation.mutate(data);
  };

  // Calculer le tarif en fonction des sélections
  const calculateFee = (type: string, category: string, duration: string) => {
    if (!permitFees) return;

    let fee = 0;
    
    // Logique de calcul des tarifs basée sur les sélections
    if (type === "sportif_petite_chasse") {
      if (category === "resident") {
        fee = parseInt(permitFees.sportifPetiteChasseResident, 10);
      } else if (category === "touriste") {
        if (duration === "one_week") {
          fee = parseInt(permitFees.sportifPetiteChasseTourriste1Week, 10);
        } else if (duration === "two_weeks") {
          fee = parseInt(permitFees.sportifPetiteChasseTourriste2Weeks, 10);
        } else if (duration === "one_month" || duration === "season") {
          fee = parseInt(permitFees.sportifPetiteChasseTourriste1Month, 10);
        }
      } else if (category === "coutumier") {
        fee = parseInt(permitFees.coutumierPetiteChasse, 10);
      }
    } else if (type === "grande_chasse") {
      if (category === "resident") {
        fee = parseInt(permitFees.grandeChaseResident, 10);
      } else if (category === "touriste") {
        if (duration === "one_week") {
          fee = parseInt(permitFees.grandeChasseTourriste1Week, 10);
        } else if (duration === "two_weeks") {
          fee = parseInt(permitFees.grandeChasseTourriste2Weeks, 10);
        } else if (duration === "one_month" || duration === "season") {
          fee = parseInt(permitFees.grandeChasseTourriste1Month, 10);
        }
      }
    } else if (type === "gibier_eau") {
      if (category === "resident") {
        fee = parseInt(permitFees.specialGibierEauResident, 10);
      } else if (category === "touriste") {
        if (duration === "one_week") {
          fee = parseInt(permitFees.specialGibierEauTourriste1Week, 10);
        } else if (duration === "one_month" || duration === "season" || duration === "two_weeks") {
          fee = parseInt(permitFees.specialGibierEauTourriste1Month, 10);
        }
      }
    }

    setPermitFee(fee);
  };

  // Gérer les étapes du formulaire
  const nextStep = () => {
    const currentFields = step === 1 
      ? ["permitType", "permitCategory", "duration"] 
      : ["startDate", "reason"];
      
    form.trigger(currentFields as any).then((isValid) => {
      if (isValid) setStep(prev => Math.min(prev + 1, totalSteps));
    });
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
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

  // Formater la catégorie de permis pour l'affichage
  const formatPermitCategory = (category: string) => {
    switch (category) {
      case "resident": return "Résident";
      case "touriste": return "Touriste";
      case "coutumier": return "Coutumier";
      default: return category;
    }
  };

  // Formater la durée du permis pour l'affichage
  const formatDuration = (duration: string) => {
    switch (duration) {
      case "season": return "Saison complète";
      case "one_month": return "1 mois";
      case "two_weeks": return "2 semaines";
      case "one_week": return "1 semaine";
      default: return duration;
    }
  };

  if (isLoadingHunter || isLoadingFees || isLoadingCampaign) {
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
              Vous devez être enregistré comme chasseur pour demander un permis.
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

  // Vérifier si une campagne de chasse est actuellement active
  if (!campaign || !campaign.isActive) {
    // Déterminer l'état actuel de la campagne (pas encore commencée ou déjà terminée)
    const today = new Date();
    const startDate = campaign ? new Date(campaign.startDate) : null;
    const endDate = campaign ? new Date(campaign.endDate) : null;
    
    const campaignNotStartedYet = startDate && today < startDate;
    const campaignAlreadyEnded = endDate && today > endDate;
    
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Campagne de chasse {campaignNotStartedYet ? "à venir" : "fermée"}</CardTitle>
            <CardDescription>
              Aucune campagne de chasse n'est actuellement ouverte.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Il n'est pas possible de demander un permis de chasse en dehors d'une campagne active.</p>
            {campaignNotStartedYet && startDate && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-blue-700">
                  La campagne cynégétique de chasse débutera le{" "}
                  <strong>{format(startDate, "d MMMM yyyy", { locale: fr })}</strong> et se terminera le{" "}
                  <strong>{format(endDate || new Date(), "d MMMM yyyy", { locale: fr })}</strong>.
                </p>
                <p className="text-blue-600 mt-2">
                  Vous pourrez soumettre votre demande de permis dès l'ouverture de la campagne.
                </p>
              </div>
            )}
            
            {campaignAlreadyEnded && endDate && (
              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-md">
                <p className="text-orange-700">
                  La dernière campagne cynégétique s'est terminée le{" "}
                  <strong>{format(endDate, "d MMMM yyyy", { locale: fr })}</strong>.
                </p>
                <p className="text-orange-600 mt-2">
                  Les dates de la prochaine campagne seront annoncées prochainement.
                </p>
              </div>
            )}
            
            {!campaign && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-700">
                  Aucune information sur la prochaine campagne de chasse n'est disponible pour le moment.
                </p>
              </div>
            )}
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
        <h1 className="text-3xl font-bold">Demande de permis de chasse</h1>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Formulaire de demande de permis</CardTitle>
          <CardDescription>
            Veuillez remplir ce formulaire pour demander un nouveau permis de chasse.
            {campaign && (
              <span className="block mt-2">
                Campagne de chasse en cours: <strong>{campaign.name}</strong> (
                {format(new Date(campaign.startDate), "d MMM yyyy", { locale: fr })} au{" "}
                {format(new Date(campaign.endDate), "d MMM yyyy", { locale: fr })})
              </span>
            )}
          </CardDescription>
          
          {/* Indicateur de progression */}
          <div className="flex items-center mt-4">
            <div className="w-full bg-muted rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full transition-all" 
                style={{ width: `${(step / totalSteps) * 100}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium ml-2">
              Étape {step}/{totalSteps}
            </span>
          </div>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {step === 1 && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="permitType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de permis</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un type de permis" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="sportif_petite_chasse">Permis sportif de petite chasse</SelectItem>
                            <SelectItem value="grande_chasse">Permis de grande chasse</SelectItem>
                            <SelectItem value="gibier_eau">Permis spécial gibier d'eau</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choisissez le type de permis correspondant à votre activité de chasse.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="permitCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catégorie</FormLabel>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="resident" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Résident
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="touriste" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Touriste
                            </FormLabel>
                          </FormItem>
                          {form.watch("permitType") === "sportif_petite_chasse" && (
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="coutumier" />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Coutumier
                              </FormLabel>
                            </FormItem>
                          )}
                        </RadioGroup>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Durée du permis</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une durée" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(form.watch("permitCategory") === "resident" || form.watch("permitCategory") === "coutumier") && (
                              <SelectItem value="season">Saison complète</SelectItem>
                            )}
                            {form.watch("permitCategory") === "touriste" && (
                              <>
                                <SelectItem value="one_month">1 mois</SelectItem>
                                <SelectItem value="two_weeks">2 semaines</SelectItem>
                                <SelectItem value="one_week">1 semaine</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choisissez la durée de validité de votre permis.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {permitFee !== null && (
                    <div className="rounded-md bg-muted p-4 mt-4">
                      <h3 className="font-medium">Tarif estimé</h3>
                      <p className="text-2xl font-bold mt-1">{permitFee.toLocaleString()} FCFA</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Ce tarif est indicatif et pourra être ajusté par l'agent traitant votre demande.
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {step === 2 && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date de début souhaitée</FormLabel>
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
                                // Désactiver les dates avant aujourd'hui et après la fin de la campagne
                                return (
                                  date < new Date() || 
                                  (campaign && date > new Date(campaign.endDate))
                                );
                              }}
                              initialFocus
                              locale={fr}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          La date à partir de laquelle vous souhaitez que votre permis soit valide.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motif de la demande</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Expliquez brièvement pourquoi vous demandez ce permis de chasse..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Cette information aidera les agents à évaluer votre demande.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="previousExperience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expérience de chasse antérieure (facultatif)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Décrivez votre expérience passée en matière de chasse..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Indiquez si vous avez déjà chassé au Sénégal ou ailleurs.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              {step === 3 && (
                <div className="space-y-6">
                  <div className="bg-muted rounded-md p-4 space-y-3">
                    <h3 className="font-medium text-lg">Récapitulatif de votre demande</h3>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Type de permis</h4>
                        <p>{formatPermitType(form.getValues("permitType"))}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Catégorie</h4>
                        <p>{formatPermitCategory(form.getValues("permitCategory"))}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Durée</h4>
                        <p>{formatDuration(form.getValues("duration"))}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Date de début souhaitée</h4>
                        <p>{format(form.getValues("startDate"), "d MMMM yyyy", { locale: fr })}</p>
                      </div>
                      
                      <div className="col-span-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Motif de la demande</h4>
                        <p className="text-sm">{form.getValues("reason")}</p>
                      </div>
                      
                      {form.getValues("previousExperience") && (
                        <div className="col-span-2">
                          <h4 className="text-sm font-medium text-muted-foreground">Expérience antérieure</h4>
                          <p className="text-sm">{form.getValues("previousExperience")}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium text-muted-foreground">Tarif estimé</h4>
                      <p className="text-2xl font-bold">{permitFee?.toLocaleString()} FCFA</p>
                    </div>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="additionalNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes supplémentaires (facultatif)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Informations complémentaires pour les agents traitant votre demande..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="rounded-md bg-amber-50 p-4 border border-amber-200">
                    <p className="text-sm text-amber-800">
                      En soumettant cette demande, vous certifiez que les informations fournies sont exactes.
                      Après traitement par un agent, vous recevrez une notification concernant l'approbation
                      ou le rejet de votre demande.
                    </p>
                  </div>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          {step > 1 ? (
            <Button type="button" variant="outline" onClick={prevStep}>
              Précédent
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={() => setLocation("/my-permits")}>
              Annuler
            </Button>
          )}
          
          {step < totalSteps ? (
            <Button type="button" onClick={nextStep}>
              Suivant
            </Button>
          ) : (
            <Button 
              type="button" 
              onClick={form.handleSubmit(onSubmit)}
              disabled={createPermitRequestMutation.isPending}
              className="gap-2"
            >
              {createPermitRequestMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Traitement en cours...
                </>
              ) : (
                <>
                  <FilePlus className="h-4 w-4" />
                  Soumettre la demande
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}