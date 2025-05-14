import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { regionEnum, regionDisplayNames } from "@shared/schema";

const permitRequestSchema = z.object({
  permitType: z.enum(["sportifPetiteChasse", "coutumierPetiteChasse", "grandeChase", "specialGibierEau"]),
  duration: z.enum(["resident", "tourriste1Week", "tourriste2Weeks", "tourriste1Month"]).optional(),
  region: z.enum([...regionEnum.enumValues]),
  weapons: z.string().min(1, "Veuillez décrire votre arme de chasse"),
  area: z.string().min(1, "Veuillez décrire la zone de chasse"),
  motivation: z.string().min(10, "Veuillez fournir une motivation détaillée"),
});

type FormValues = z.infer<typeof permitRequestSchema>;

export function PermitRequestPage() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Charger les permis actifs du chasseur
  const { data: activePermits = [] } = useQuery({
    queryKey: ["/api/permits/hunter", user?.id, "active"],
    queryFn: async () => {
      if (!user) return [];
      const response = await fetch(`/api/permits/hunter/${user.id}/active`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(permitRequestSchema),
    defaultValues: {
      permitType: "sportifPetiteChasse",
      region: "dakar",
      weapons: "",
      area: "",
      motivation: "",
    },
  });

  const permitType = form.watch("permitType");
  const showDuration = permitType !== "coutumierPetiteChasse";

  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Vous devez être connecté pour soumettre une demande de permis.",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Récupérer d'abord les infos du chasseur associé à cet utilisateur
      const huntersResponse = await fetch("/api/hunters");
      if (!huntersResponse.ok) {
        throw new Error("Erreur lors de la récupération des informations du chasseur");
      }
      
      const hunters = await huntersResponse.json();
      // Trouver le chasseur associé à cet utilisateur
      const hunter = hunters.find((h: any) => h.userId === user?.id);
      
      if (!hunter) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Aucun profil chasseur associé à votre compte. Veuillez contacter un administrateur.",
        });
        return;
      }
      
      await apiRequest({
        method: "POST",
        url: "/api/permit-requests",
        data: {
          userId: user.id,
          hunterId: hunter.id,
          permitType: data.permitType,
          duration: data.duration || "resident",
          region: data.region,
          weapons: data.weapons,
          area: data.area,
          motivation: data.motivation,
          status: "pending",
        },
      });
      
      toast({
        title: "Demande soumise",
        description: "Votre demande de permis a été soumise avec succès. Vous serez notifié lorsqu'elle sera traitée.",
      });
      
      form.reset();
    } catch (error) {
      console.error("Erreur lors de la soumission de la demande de permis:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur s'est produite lors de la soumission de votre demande. Veuillez réessayer.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-3xl font-bold">Demande de Permis de Chasse</h1>
      
      {activePermits.length > 0 ? (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-yellow-800">Vous avez déjà des permis actifs</CardTitle>
            <CardDescription className="text-yellow-700">
              Vous avez {activePermits.length} permis actifs. Vous pouvez tout de même faire une nouvelle demande, mais elle sera soumise à approbation.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}
      
      <Card>
        <CardHeader>
          <CardTitle>Formulaire de demande</CardTitle>
          <CardDescription>
            Remplissez ce formulaire pour soumettre une demande de permis de chasse.
            Votre demande sera examinée par nos agents, et vous serez notifié de sa validation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="permitType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de permis</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner le type de permis" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sportifPetiteChasse">Permis sportif de petite chasse</SelectItem>
                          <SelectItem value="coutumierPetiteChasse">Permis coutumier de petite chasse</SelectItem>
                          <SelectItem value="grandeChase">Permis de grande chasse</SelectItem>
                          <SelectItem value="specialGibierEau">Permis spécial pour gibier d'eau</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {showDuration && (
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Durée du permis</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner la durée" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="resident">Résident (saison entière)</SelectItem>
                            <SelectItem value="tourriste1Week">Touriste - 1 semaine</SelectItem>
                            <SelectItem value="tourriste2Weeks">Touriste - 2 semaines</SelectItem>
                            <SelectItem value="tourriste1Month">Touriste - 1 mois</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Région de chasse</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner la région" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(regionDisplayNames).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
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
                  name="weapons"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Armes de chasse</FormLabel>
                      <FormControl>
                        <Input placeholder="Décrivez les armes que vous utiliserez" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zone de chasse spécifique</FormLabel>
                    <FormControl>
                      <Input placeholder="Précisez la zone de chasse" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="motivation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivation</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Décrivez votre motivation pour la chasse et les espèces ciblées"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Soumission en cours..." : "Soumettre la demande"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="border-t pt-6">
          <p className="text-sm text-muted-foreground">
            En soumettant cette demande, vous certifiez que toutes les informations fournies sont exactes et complètes.
            Toute fausse déclaration peut entraîner le refus ou la révocation de votre permis.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default PermitRequestPage;