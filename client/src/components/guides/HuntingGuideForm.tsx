import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CreateHuntingGuideWithUser, regionDisplayNames } from "@shared/schema";
import { createHuntingGuideWithUserSchema } from "@shared/schema";
import { departmentsByRegion } from "@/lib/constants";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Eye, EyeOff, Paperclip, X } from "lucide-react";

export function HuntingGuideForm() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [departments, setDepartments] = useState<Array<{value: string, label: string}>>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CreateHuntingGuideWithUser>({
    resolver: zodResolver(createHuntingGuideWithUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      zone: "",
      region: "",
      idNumber: "",
      photo: "",
      username: "",
      password: "",
      email: "manager@example.com", // Valeur par défaut valide pour éviter l'erreur "Adresse email invalide"
    },
  });
  
  // Mettre à jour les départements quand la région change
  const watchRegion = form.watch("region");
  useEffect(() => {
    if (watchRegion) {
      const regionDepartments = departmentsByRegion[watchRegion as keyof typeof departmentsByRegion] || [];
      setDepartments(regionDepartments.map(dept => ({
        value: dept.value,
        // Retirer "Secteur " du label pour un affichage plus propre
        label: dept.label.replace("Secteur ", "")
      })));
      // Réinitialiser la zone quand la région change
      form.setValue("zone", "");
    } else {
      setDepartments([]);
    }
  }, [watchRegion, form]);

  // Gérer le téléchargement de photo
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedPhoto(file);
      // Créer une URL pour l'aperçu
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setPhotoPreview(reader.result.toString());
          form.setValue("photo", reader.result.toString());
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Supprimer la photo sélectionnée
  const handleRemovePhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview("");
    form.setValue("photo", "");
    // Réinitialiser l'input file
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  // Déclencheur pour l'input de fichier caché
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const onSubmit = async (data: CreateHuntingGuideWithUser) => {
    console.log("Données du formulaire soumises:", data);
    setSubmitting(true);
    try {
      // Les informations du responsable de zone ne sont plus collectées
      
      // Assurez-vous que l'email a une valeur valide s'il n'a pas été rempli
      if (!data.email || data.email === "manager@example.com") {
        data.email = `${data.username}@chassesenegal.sn`;
      }
      
      const response = await apiRequest({
        url: "/api/guides",
        method: "POST",
        data: data
      });
      
      console.log("Réponse API:", response);
      
      toast({
        title: "Guide de chasse créé",
        description: "Le guide de chasse a été ajouté avec succès.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/guides"] });
      form.reset();
      setSelectedPhoto(null);
      setPhotoPreview("");
    } catch (error: any) {
      console.error("Erreur lors de la création du guide de chasse:", error);
      
      // Message d'erreur plus détaillé
      let errorMessage = "Une erreur est survenue lors de la création du guide de chasse. Veuillez réessayer.";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Convertir l'objet regionDisplayNames en tableau pour le Select
  const regionOptions = Object.entries(regionDisplayNames).map(([key, value]) => ({
    value: key,
    label: value,
  }));

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Ajouter un nouveau Guide de Chasse</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Informations personnelles */}
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom de famille" {...field} />
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
                    <FormLabel>Numéro de téléphone</FormLabel>
                    <FormControl>
                      <Input placeholder="Téléphone" {...field} />
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
                    <FormLabel>N° de pièce d'identité</FormLabel>
                    <FormControl>
                      <Input placeholder="Numéro de pièce d'identité" {...field} />
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
                          <SelectValue placeholder="Sélectionnez une région" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {regionOptions.map((region) => (
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
                name="zone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zone (Département)</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={departments.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={departments.length === 0 ? 
                            "Sélectionnez d'abord une région" : 
                            "Sélectionnez un département"} 
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.value} value={dept.value}>
                            {dept.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choisissez le département où le guide opérera
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Informations de compte */}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom d'utilisateur</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom d'utilisateur pour la connexion" {...field} />
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
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"}
                          placeholder="Mot de passe" 
                          {...field} 
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="photo"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Photo du guide (optionnelle)</FormLabel>
                    <div className="flex items-center gap-4">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handlePhotoUpload}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        onClick={triggerFileInput}
                        className="cursor-pointer h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <Paperclip className="h-5 w-5" />
                      </Button>
                      <div className="flex-1 relative">
                        <Input 
                          placeholder="Aucun fichier sélectionné"
                          value={selectedPhoto ? selectedPhoto.name : ""}
                          readOnly
                          className="pr-10"
                        />
                        {selectedPhoto && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full"
                            onClick={handleRemovePhoto}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {photoPreview && (
                      <div className="mt-2">
                        <img 
                          src={photoPreview} 
                          alt="Aperçu de la photo" 
                          className="max-h-40 rounded-md border border-gray-200 dark:border-gray-800 object-contain" 
                        />
                      </div>
                    )}
                    <FormDescription>
                      Téléchargez une photo du guide de chasse (cliquez sur le trombone)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <CardFooter className="flex justify-end border-t pt-4 px-0">
              <Button 
                type="submit" 
                disabled={submitting} 
                className="ml-auto bg-green-600 hover:bg-green-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  "Créer le guide de chasse"
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}