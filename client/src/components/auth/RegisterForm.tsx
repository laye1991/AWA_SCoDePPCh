import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Eye, EyeOff } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { debounce } from "lodash";
import { Textarea } from "@/components/ui/textarea";

interface RegisterFormProps {
  userType: string;
}

// Créer le schéma Zod pour le formulaire
const registerSchema = z.object({
  username: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères"),
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  confirmPassword: z.string(),
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères").regex(/^[A-Za-zÀ-ſ\s\-]+$/, { message: "Le prénom ne doit contenir que des lettres" }).transform(val => val.charAt(0).toUpperCase() + val.slice(1).toLowerCase()),
  lastName: z.string().min(2, "Le nom de famille doit contenir au moins 2 caractères").regex(/^[A-Za-zÀ-ſ\s\-]+$/, { message: "Le nom de famille ne doit contenir que des lettres" }).transform(val => val.charAt(0).toUpperCase() + val.slice(1).toLowerCase()),
  role: z.string().default("hunter")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

// Schéma pour les informations du tuteur (si le chasseur est mineur)
const tutorInfoSchema = z.object({
  tutorFirstName: z.string().min(1, "Prénom du tuteur requis"),
  tutorLastName: z.string().min(1, "Nom du tuteur requis"),
  tutorIdNumber: z.string().min(1, "Numéro de pièce du tuteur requis"),
  tutorPhone: z.string().min(9, "Numéro de téléphone du tuteur invalide"),
  letterConfirmation: z.boolean().refine(val => val === true, {
    message: "Vous devez confirmer la lettre de responsabilité"
  })
});

// Schéma pour les informations spécifiques aux chasseurs
const hunterInfoSchema = z.object({
  phone: z.string(),
  idNumber: z.string().min(1, "Numéro de pièce requis"),
  pays: z.string(),
  address: z.string().default("Adresse par défaut"),
  dateOfBirth: z.string()
    .min(1, "Date de naissance requise"),
  profession: z.string().min(1, "Profession requise")
    .refine(val => /^[A-Za-z\u00C0-\u017F\s\-]+$/.test(val), {
      message: "La profession ne doit contenir que des lettres"
    }),
  experience: z.coerce.number().nonnegative("L'expérience doit être un nombre positif"),
  category: z.string().superRefine((val, ctx) => {
    if (ctx.parent?.pays === "Sénégal") {
      ctx.parent.category = "resident";
      if (val !== "resident") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La catégorie doit être 'Résident' pour le Sénégal",
        });
      }
    }
  }),
  tutorFirstName: z.string().optional(),
  tutorLastName: z.string().optional(),
  tutorIdNumber: z.string().optional(),
  tutorPhone: z.string().optional(),
  letterConfirmation: z.boolean().optional()
}).superRefine((data, ctx) => {
  if (data.category === "resident" && (!data.phone || data.phone.trim() === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Le numéro de téléphone est obligatoire pour les résidents",
      path: ["phone"]
    });
  }
});

// Ne pas utiliser de fonction de formatage pour les champs de téléphone
// Nous affichons uniquement le placeholder +221 XX XXX XX XX pour guider l'utilisateur

export default function RegisterForm({ userType }: RegisterFormProps) {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Configurer le formulaire pour les informations de base
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      role: userType || "hunter"
    },
  });

  // Mise à jour des valeurs par défaut lorsque le userType change
  useEffect(() => {
    form.setValue('role', userType);
  }, [userType, form]);

  // Configurer le formulaire pour les informations de chasseur
  const hunterForm = useForm<z.infer<typeof hunterInfoSchema>>({
    resolver: zodResolver(hunterInfoSchema),
    defaultValues: {
      idNumber: "",
      pays: "",
      address: "Adresse par défaut",
      phone: "",
      dateOfBirth: "",
      profession: "",
      experience: 0,
      category: "resident", // Valeur par défaut définie sur "resident"
      tutorFirstName: "",
      tutorLastName: "",
      tutorIdNumber: "",
      tutorPhone: "",
      letterConfirmation: false
    },
    mode: "all"
  });

  // État pour suivre si le chasseur est mineur
  const [isMinor, setIsMinor] = useState(false);
  const [currentAge, setCurrentAge] = useState<number | null>(null);

  // Ajouter des logs pour suivre les changements de catégorie
  useEffect(() => {
    const subscription = hunterForm.watch((value, { name }) => {
      if (name === "category") {
        console.log('🔍 Catégorie changée:', value.category);
      }
      if (name === "pays" && value.pays === "Sénégal") {
        hunterForm.setValue("category", "resident");
        const categorySelect = document.querySelector('#category-select');
        if (categorySelect) {
          const touristOption = categorySelect.querySelector('option[value="touristique"]');
          if (touristOption) {
            touristOption.style.display = 'none';
          }
        }
      } else {
        const categorySelect = document.querySelector('#category-select');
        if (categorySelect) {
          const touristOption = categorySelect.querySelector('option[value="touristique"]');
          if (touristOption) {
            touristOption.style.display = 'block';
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [hunterForm]);

  // Vérifier l'âge lorsque la date de naissance change
  const checkAge = (birthDateStr: string) => {
    try {
      const birthDate = new Date(birthDateStr);

      // Vérifier si la date est valide
      if (isNaN(birthDate.getTime())) {
        setCurrentAge(null);
        setIsMinor(false);
        return;
      }

      const today = new Date();

      // Calcul d'âge précis
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      // Mise à jour des états
      setIsMinor(age >= 10 && age < 18);
      setCurrentAge(age);
    } catch (error) {
      console.error("Erreur dans le calcul de l'âge:", error);
      setCurrentAge(null);
      setIsMinor(false);
    }
  };

  // État pour le masquage/affichage des mots de passe
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Gérer la soumission du formulaire d'inscription de base (étape 1)
  const onSubmitBasicInfo = (data: z.infer<typeof registerSchema>) => {
    toast({
      title: "Informations validées",
      description: "Veuillez compléter vos informations de chasseur pour finaliser votre inscription.",
    });

    hunterForm.setValue("idNumber", "");
    setStep(2);
  };

  // Gérer la soumission du formulaire d'informations de chasseur
  const onSubmitHunterInfo = async (data: z.infer<typeof hunterInfoSchema>) => {
    try {
      console.log('🔍 DEBUG: Début de la création du compte chasseur');
      console.log('🔍 DEBUG: Données de base du formulaire:', JSON.stringify(form.getValues(), null, 2));
      console.log('🔍 DEBUG: Données du formulaire chasseur:', JSON.stringify(data, null, 2));

      // Préparation des données du chasseur alignées avec Hunters
      console.log('🔍 DEBUG catégorie avant envoi:', data.category);
      console.log('🔍 DEBUG État complet du formulaire:', hunterForm.getValues());
      console.log('🔍 DEBUG Erreurs potentielles:', hunterForm.formState.errors);

      // S'assurer que la catégorie est bien définie
      if (!data.category) {
        console.error("❌ ERREUR: La catégorie de chasseur n'est pas spécifiée dans les données soumises");
        // Utiliser une valeur par défaut ou la valeur actuelle de l'état du formulaire
        const formCategory = hunterForm.getValues().category;
        console.log('🔍 Tentative de récupération de la catégorie depuis l\'état du formulaire:', formCategory);

        if (formCategory) {
          data.category = formCategory;
          console.log('✅ Catégorie récupérée avec succès:', data.category);
        } else {
          throw new Error("La catégorie de chasseur n'est pas spécifiée et ne peut pas être récupérée");
        }
      }

      // Déterminer la nationalité à partir du pays d'émission de la pièce d'identité
      const nationality = data.pays || "Non spécifié";

      const hunterData = {
        firstName: form.getValues().firstName,
        lastName: form.getValues().lastName,
        idNumber: data.idNumber,
        phone: data.category === "resident" ? data.phone?.replace(/\s/g, '') : null,
        category: data.category, // Vérifier cette valeur dans la console
        pays: data.pays,
        nationality: nationality, // Utiliser le pays d'émission comme nationalité
        address: data.address || "Adresse par défaut",
        dateOfBirth: data.dateOfBirth,
        profession: data.profession,
        experience: Number(data.experience),
        tutorInfo: isMinor ? {
          firstName: data.tutorFirstName || '',
          lastName: data.tutorLastName || '',
          idNumber: data.tutorIdNumber || '',
          phone: data.tutorPhone ? data.tutorPhone.replace(/\s/g, '') : '',
          letterConfirmation: data.letterConfirmation || false
        } : null
      };

      console.log('🔍 DEBUG: Données du chasseur à créer (JSON):', JSON.stringify(hunterData, null, 2));
      console.log('🔍 DEBUG: Types des données du chasseur:', Object.entries(hunterData).map(([key, value]) => `${key}: ${typeof value}`));

      // Vérification du numéro d'identification - Modifié pour contourner l'erreur JSON
      try {
        const response = await fetch(`/api/hunters/check-id/${data.idNumber}`, {
          method: "GET",
          headers: {
            'Accept': 'application/json'
          }
        });

        let checkIdResponse;
        try {
          checkIdResponse = await response.json();
        } catch (jsonError) {
          // Si le JSON ne peut pas être parsé, supposons qu'il n'existe pas
          console.log("Erreur JSON lors de la vérification de l'ID, continuons l'inscription");
          checkIdResponse = { exists: false };
        }

        if (checkIdResponse?.exists) {
          toast({
            variant: "destructive",
            title: "Erreur",
            description: "Ce numéro d'identification est déjà utilisé."
          });
          return;
        }
      } catch (idCheckError) {
        // Ignorer les erreurs de vérification et continuer
        console.log("Erreur lors de la vérification de l'ID, continuons l'inscription");
      }

      // Création du chasseur
      console.log('🚀 DEBUG: Tentative d\'envoi des données du chasseur');
      console.log('🚀 DEBUG: URL:', "/api/hunters");
      console.log('🚀 DEBUG: Méthode:', "POST");
      console.log('🚀 DEBUG: Données envoyées:', JSON.stringify(hunterData, null, 2));

      let hunterResponse;
      try {
        // Utilisation directe de fetch pour éviter les problèmes d'API
        const response = await fetch('/api/hunters', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(hunterData)
        });

        // Vérifier si la réponse est OK
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
        }

        // Parser la réponse en JSON
        hunterResponse = await response.json();
        console.log('🚀 DEBUG: Réponse du serveur:', JSON.stringify(hunterResponse, null, 2));
      } catch (apiError) {
        console.error('❌ DEBUG: Erreur API détaillée:', apiError);
        throw new Error("Erreur lors de la création du chasseur: " + (apiError instanceof Error ? apiError.message : String(apiError)));
      }

      if (!hunterResponse?.id) {
        throw new Error("Échec de la création du profil chasseur");
      }

      // Création de l'utilisateur
      const userData = {
        username: form.getValues().username,
        email: form.getValues().email,
        password: form.getValues().password,
        firstName: form.getValues().firstName,
        lastName: form.getValues().lastName,
        phone: data.category === "resident" ? data.phone?.replace(/\s/g, '') : null,
        role: "hunter",
        hunterId: hunterResponse.id
      };

      // Utilisation directe de fetch pour créer l'utilisateur
      let userResponse;
      try {
        const userApiResponse = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': "application/json",
            'Accept': 'application/json'
          },
          body: JSON.stringify(userData)
        });

        // Vérifier si la réponse est OK
        if (!userApiResponse.ok) {
          throw new Error(`Erreur HTTP: ${userApiResponse.status} ${userApiResponse.statusText}`);
        }

        // Parser la réponse en JSON
        userResponse = await userApiResponse.json();
      } catch (userError) {
        console.error('Erreur lors de la création de l\'utilisateur:', userError);
        throw new Error("Erreur lors de la création de l'utilisateur: " +
          (userError instanceof Error ? userError.message : String(userError)));
      }

      if (userResponse?.id) {
        // Invalider les requêtes pour mettre à jour la liste des chasseurs
        await queryClient.invalidateQueries({ queryKey: ['hunters'] });
        await queryClient.invalidateQueries({ queryKey: ['huntersByRegion'] });
        await queryClient.invalidateQueries({ queryKey: ['huntersByZone'] });

        toast({
          title: "Succès",
          description: "Votre compte a été créé avec succès. Redirection vers la liste des chasseurs."
        });
        setLocation("/hunters");
      } else {
        // Si la création de l'utilisateur échoue, supprimer le chasseur
        try {
          await fetch(`/api/hunters/${hunterResponse.id}`, {
            method: 'DELETE',
            headers: {
              'Accept': 'application/json'
            }
          });
        } catch (deleteError) {
          console.error('Erreur lors de la suppression du chasseur:', deleteError);
        }
        throw new Error("Échec de la création du compte utilisateur");
      }

    } catch (error: any) {
      console.error("Erreur lors de l'inscription:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Une erreur s'est produite lors de l'inscription. Veuillez vérifier vos informations et réessayer."
      });
    }
  };

  const checkIdDebounced = debounce(async (idNumber: string, setError: any) => {
    try {
      // Utiliser fetch directement plutôt que apiRequest pour éviter les erreurs JSON
      const response = await fetch(`/api/hunters/check-id/${idNumber}`, {
        method: "GET",
        headers: {
          'Accept': 'application/json'
        }
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (LunchError) {
        // Si le JSON ne peut pas être parsé, considérons que l'ID n'existe pas
        console.log("Erreur JSON lors de la vérification de l'ID");
        return;
      }

      if (responseData?.exists) {
        setError("idNumber", {
          type: "manual",
          message: "Ce numéro d'identification est déjà utilisé"
        });
      } else {
        // Doit être explicit avec null pour éviter "undefined"
        setError("idNumber", null);
      }
    } catch (error) {
      console.error("Erreur lors de la vérification de l'ID:", error);
      // Ne pas afficher d'erreur en cas d'échec de la vérification
    }
  }, 500);

  // Écouter les changements sur le champ idNumber
  useEffect(() => {
    const subscription = hunterForm.watch((value, { name }) => {
      if (name === "idNumber" && value.idNumber && value.idNumber.length >= 5) {
        checkIdDebounced(value.idNumber, hunterForm.setError);
      }
      if (name === "dateOfBirth" && value.dateOfBirth) {
        checkAge(value.dateOfBirth);
      }
    });

    return () => {
      subscription.unsubscribe();
      checkIdDebounced.cancel();
    };
  }, [hunterForm, checkIdDebounced]);

  // Écouter les changements de catégorie pour valider le formulaire
  useEffect(() => {
    // Utiliser un nom de champ spécifique pour éviter une récursion infinie
    const subscription = hunterForm.watch((value, { name }) => {
      // Ne déclencher que sur les changements de catégorie ou de téléphone
      if (name !== "category" && name !== "phone") return;

      // Si la catégorie est résident, vérifier le numéro de téléphone
      if (value.phone && value.phone.trim() !== "") {
        // Si la catégorie est 'Résident', vérifier le format du numéro
        if (value.category === 'resident') {
          const digits = value.phone.replace(/\D/g, '');
        }
      } else {
        hunterForm.clearErrors("phone");
      }
    });

    return () => subscription.unsubscribe();
  }, [hunterForm]);

  return (
    <div className="flex flex-col items-center justify-center h-screen p-4 bg-white overflow-hidden">
      <div className="w-full max-w-4xl bg-white rounded-xl overflow-hidden shadow-xl h-[90vh] flex flex-col">
        <div className="md:flex h-full">
          {/* Panneau d'information sur la gauche */}
          <div className="md:w-1/2 bg-green-700 p-8 text-white hidden md:block">
            <h1 className="text-3xl font-bold mb-4 text-center">Permis de Chasse</h1>
            <p className="mb-6">Bienvenue sur la plateforme officielle de demande de permis de chasse au Sénégal.</p>

            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-white p-2 rounded-full text-green-700 mr-3 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Processus simplifié</h3>
                  <p className="text-sm">Création rapide de compte et demande de permis en quelques étapes.</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-white p-2 rounded-full text-green-700 mr-3 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Suivi en temps réel</h3>
                  <p className="text-sm">Suivez l'état de vos demandes de permis à tout moment.</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-white p-2 rounded-full text-green-700 mr-3 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Sécurité garantie</h3>
                  <p className="text-sm">Vos informations personnelles sont protégées par les meilleurs standards de sécurité.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Formulaire d'inscription sur la droite */}
          <div className="md:w-1/2 p-8 h-full overflow-y-auto">
            <div className="relative mb-6">
              {/* Bouton de retour en haut à droite pour revenir à la page de connexion */}
              {step === 1 && (
                <button
                  type="button"
                  onClick={() => window.location.href = "/login"}
                  className="absolute right-0 top-0 flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-teal-400 to-green-500 hover:from-teal-500 hover:to-green-600 text-white shadow-md transition-all duration-300 hover:shadow-lg"
                  aria-label="Retour à la page de connexion"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-180" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}

              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  {step === 1 ? "Création de compte" : "Informations du chasseur"}
                </h2>
                <p className="text-gray-600 mt-1">
                  {step === 1 ? "Étape 1: Informations de base" : "Étape 2: Détails du chasseur"}
                </p>
              </div>
            </div>

            {step === 1 ? (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) => {
                    // Validation réussie, passer à l'étape suivante
                    toast({
                      title: "Informations validées",
                      description: "Veuillez compléter vos informations de chasseur pour finaliser votre inscription.",
                    });
                    hunterForm.setValue("idNumber", "");
                    setStep(2);
                  })}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prénom</FormLabel>
                          <FormControl>
                            <Input placeholder="Votre prénom" {...field} className="border-black" />
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
                            <Input placeholder="Votre nom" {...field} className="border-black" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom d'utilisateur</FormLabel>
                        <FormControl>
                          <Input placeholder="Choisissez un nom d'utilisateur" {...field} className="border-black" />
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
                          <Input type="email" placeholder="votre@email.com" {...field} className="border-black" />
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
                              placeholder="********"
                              {...field}
                              className="border-black"
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 transform -translate-y-1/2"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Au moins 8 caractères
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmer le mot de passe</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="********"
                              {...field}
                              className="border-black"
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 transform -translate-y-1/2"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full bg-green-700 hover:bg-green-800 mt-4">
                    Continuer vers l'étape 2
                  </Button>
                  <div className="text-xs text-gray-500 mt-2 text-center">
                    Cliquez sur le bouton ci-dessus pour accéder à l'étape 2
                  </div>
                </form>
              </Form>
            ) : (
              <>
                <Form {...hunterForm}>
                  <form onSubmit={hunterForm.handleSubmit(onSubmitHunterInfo)} className="space-y-4">
                    <FormField
                      control={hunterForm.control}
                      name="idNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Numéro de Pièce d'Identité ou de passeport</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Numéro de Pièce d'Identité"
                              {...field}
                              className="border-black text-center"
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
                      control={hunterForm.control}
                      name="pays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pays d'émission de la pièce d'identité</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="border-black">
                                <SelectValue placeholder="Sélectionner un pays" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>Sénégal</SelectLabel>
                                <SelectItem value="Sénégal">Sénégal</SelectItem>
                              </SelectGroup>
                              <SelectGroup>
                                <SelectLabel>Afrique</SelectLabel>
                                <SelectItem value="Afrique du Sud">Afrique du Sud</SelectItem>
                                <SelectItem value="Algérie">Algérie</SelectItem>
                                <SelectItem value="Angola">Angola</SelectItem>
                                <SelectItem value="Bénin">Bénin</SelectItem>
                                <SelectItem value="Botswana">Botswana</SelectItem>
                                <SelectItem value="Burkina Faso">Burkina Faso</SelectItem>
                                <SelectItem value="Burundi">Burundi</SelectItem>
                                <SelectItem value="Cameroun">Cameroun</SelectItem>
                                <SelectItem value="Cap-Vert">Cap-Vert</SelectItem>
                                <SelectItem value="République centrafricaine">République centrafricaine</SelectItem>
                                <SelectItem value="Comores">Comores</SelectItem>
                                <SelectItem value="Congo">Congo</SelectItem>
                                <SelectItem value="Côte d'Ivoire">Côte d'Ivoire</SelectItem>
                                <SelectItem value="Djibouti">Djibouti</SelectItem>
                                <SelectItem value="Égypte">Égypte</SelectItem>
                                <SelectItem value="Érythrée">Érythrée</SelectItem>
                                <SelectItem value="Eswatini">Eswatini</SelectItem>
                                <SelectItem value="Éthiopie">Éthiopie</SelectItem>
                                <SelectItem value="Gabon">Gabon</SelectItem>
                                <SelectItem value="Gambie">Gambie</SelectItem>
                                <SelectItem value="Ghana">Ghana</SelectItem>
                                <SelectItem value="Guinée">Guinée</SelectItem>
                                <SelectItem value="Guinée-Bissau">Guinée-Bissau</SelectItem>
                                <SelectItem value="Guinée équatoriale">Guinée équatoriale</SelectItem>
                                <SelectItem value="Kenya">Kenya</SelectItem>
                                <SelectItem value="Lesotho">Lesotho</SelectItem>
                                <SelectItem value="Liberia">Liberia</SelectItem>
                                <SelectItem value="Libye">Libye</SelectItem>
                                <SelectItem value="Madagascar">Madagascar</SelectItem>
                                <SelectItem value="Malawi">Malawi</SelectItem>
                                <SelectItem value="Mali">Mali</SelectItem>
                                <SelectItem value="Maroc">Maroc</SelectItem>
                                <SelectItem value="Maurice">Maurice</SelectItem>
                                <SelectItem value="Mauritanie">Mauritanie</SelectItem>
                                <SelectItem value="Mozambique">Mozambique</SelectItem>
                                <SelectItem value="Namibie">Namibie</SelectItem>
                                <SelectItem value="Niger">Niger</SelectItem>
                                <SelectItem value="Nigeria">Nigeria</SelectItem>
                                <SelectItem value="Ouganda">Ouganda</SelectItem>
                                <SelectItem value="Rwanda">Rwanda</SelectItem>
                                <SelectItem value="São Tomé-et-Principe">São Tomé-et-Principe</SelectItem>
                                <SelectItem value="Seychelles">Seychelles</SelectItem>
                                <SelectItem value="Sierra Leone">Sierra Leone</SelectItem>
                                <SelectItem value="Somalie">Somalie</SelectItem>
                                <SelectItem value="Soudan">Soudan</SelectItem>
                                <SelectItem value="Soudan du Sud">Soudan du Sud</SelectItem>
                                <SelectItem value="Tanzanie">Tanzanie</SelectItem>
                                <SelectItem value="Tchad">Tchad</SelectItem>
                                <SelectItem value="Togo">Togo</SelectItem>
                                <SelectItem value="Tunisie">Tunisie</SelectItem>
                                <SelectItem value="Zambie">Zambie</SelectItem>
                                <SelectItem value="Zimbabwe">Zimbabwe</SelectItem>
                              </SelectGroup>
                              <SelectGroup>
                                <SelectLabel>Europe</SelectLabel>
                                <SelectItem value="Allemagne">Allemagne</SelectItem>
                                <SelectItem value="Autriche">Autriche</SelectItem>
                                <SelectItem value="Belgique">Belgique</SelectItem>
                                <SelectItem value="Bulgarie">Bulgarie</SelectItem>
                                <SelectItem value="Chypre">Chypre</SelectItem>
                                <SelectItem value="Croatie">Croatie</SelectItem>
                                <SelectItem value="Danemark">Danemark</SelectItem>
                                <SelectItem value="Espagne">Espagne</SelectItem>
                                <SelectItem value="Estonie">Estonie</SelectItem>
                                <SelectItem value="Finlande">Finlande</SelectItem>
                                <SelectItem value="France">France</SelectItem>
                                <SelectItem value="Grèce">Grèce</SelectItem>
                                <SelectItem value="Hongrie">Hongrie</SelectItem>
                                <SelectItem value="Irlande">Irlande</SelectItem>
                                <SelectItem value="Italie">Italie</SelectItem>
                                <SelectItem value="Lettonie">Lettonie</SelectItem>
                                <SelectItem value="Lituanie">Lituanie</SelectItem>
                                <SelectItem value="Luxembourg">Luxembourg</SelectItem>
                                <SelectItem value="Malte">Malte</SelectItem>
                                <SelectItem value="Pays-Bas">Pays-Bas</SelectItem>
                                <SelectItem value="Pologne">Pologne</SelectItem>
                                <SelectItem value="Portugal">Portugal</SelectItem>
                                <SelectItem value="République tchèque">République tchèque</SelectItem>
                                <SelectItem value="Roumanie">Roumanie</SelectItem>
                                <SelectItem value="Royaume-Uni">Royaume-Uni</SelectItem>
                                <SelectItem value="Slovaquie">Slovaquie</SelectItem>
                                <SelectItem value="Slovénie">Slovénie</SelectItem>
                                <SelectItem value="Suède">Suède</SelectItem>
                                <SelectItem value="Suisse">Suisse</SelectItem>
                              </SelectGroup>
                              <SelectGroup>
                                <SelectLabel>Amériques</SelectLabel>
                                <SelectItem value="Argentine">Argentine</SelectItem>
                                <SelectItem value="Bolivie">Bolivie</SelectItem>
                                <SelectItem value="Brésil">Brésil</SelectItem>
                                <SelectItem value="Canada">Canada</SelectItem>
                                <SelectItem value="Chili">Chili</SelectItem>
                                <SelectItem value="Colombie">Colombie</SelectItem>
                                <SelectItem value="Costa Rica">Costa Rica</SelectItem>
                                <SelectItem value="Cuba">Cuba</SelectItem>
                                <SelectItem value="Équateur">Équateur</SelectItem>
                                <SelectItem value="États-Unis">États-Unis</SelectItem>
                                <SelectItem value="Guatemala">Guatemala</SelectItem>
                                <SelectItem value="Haïti">Haïti</SelectItem>
                                <SelectItem value="Honduras">Honduras</SelectItem>
                                <SelectItem value="Jamaïque">Jamaïque</SelectItem>
                                <SelectItem value="Mexique">Mexique</SelectItem>
                                <SelectItem value="Nicaragua">Nicaragua</SelectItem>
                                <SelectItem value="Panama">Panama</SelectItem>
                                <SelectItem value="Paraguay">Paraguay</SelectItem>
                                <SelectItem value="Pérou">Pérou</SelectItem>
                                <SelectItem value="République dominicaine">République dominicaine</SelectItem>
                                <SelectItem value="Uruguay">Uruguay</SelectItem>
                                <SelectItem value="Venezuela">Venezuela</SelectItem>
                              </SelectGroup>
                              <SelectGroup>
                                <SelectLabel>Asie</SelectLabel>
                                <SelectItem value="Afghanistan">Afghanistan</SelectItem>
                                <SelectItem value="Arabie saoudite">Arabie saoudite</SelectItem>
                                <SelectItem value="Azerbaïdjan">Azerbaïdjan</SelectItem>
                                <SelectItem value="Bahreïn">Bahreïn</SelectItem>
                                <SelectItem value="Bangladesh">Bangladesh</SelectItem>
                                <SelectItem value="Bhoutan">Bhoutan</SelectItem>
                                <SelectItem value="Birmanie">Birmanie</SelectItem>
                                <SelectItem value="Brunei">Brunei</SelectItem>
                                <SelectItem value="Cambodge">Cambodge</SelectItem>
                                <SelectItem value="Chine">Chine</SelectItem>
                                <SelectItem value="Corée du Nord">Corée du Nord</SelectItem>
                                <SelectItem value="Corée du Sud">Corée du Sud</SelectItem>
                                <SelectItem value="Émirats arabes unis">Émirats arabes unis</SelectItem>
                                <SelectItem value="Inde">Inde</SelectItem>
                                <SelectItem value="Indonésie">Indonésie</SelectItem>
                                <SelectItem value="Irak">Irak</SelectItem>
                                <SelectItem value="Iran">Iran</SelectItem>
                                <SelectItem value="Israël">Israël</SelectItem>
                                <SelectItem value="Japon">Japon</SelectItem>
                                <SelectItem value="Jordanie">Jordanie</SelectItem>
                                <SelectItem value="Kazakhstan">Kazakhstan</SelectItem>
                                <SelectItem value="Kirghizistan">Kirghizistan</SelectItem>
                                <SelectItem value="Koweït">Koweït</SelectItem>
                                <SelectItem value="Laos">Laos</SelectItem>
                                <SelectItem value="Liban">Liban</SelectItem>
                                <SelectItem value="Malaisie">Malaisie</SelectItem>
                                <SelectItem value="Maldives">Maldives</SelectItem>
                                <SelectItem value="Mongolie">Mongolie</SelectItem>
                                <SelectItem value="Népal">Népal</SelectItem>
                                <SelectItem value="Oman">Oman</SelectItem>
                                <SelectItem value="Ouzbékistan">Ouzbékistan</SelectItem>
                                <SelectItem value="Pakistan">Pakistan</SelectItem>
                                <SelectItem value="Philippines">Philippines</SelectItem>
                                <SelectItem value="Qatar">Qatar</SelectItem>
                                <SelectItem value="Singapour">Singapour</SelectItem>
                                <SelectItem value="Sri Lanka">Sri Lanka</SelectItem>
                                <SelectItem value="Syrie">Syrie</SelectItem>
                                <SelectItem value="Tadjikistan">Tadjikistan</SelectItem>
                                <SelectItem value="Taïwan">Taïwan</SelectItem>
                                <SelectItem value="Thaïlande">Thaïlande</SelectItem>
                                <SelectItem value="Turkménistan">Turkménistan</SelectItem>
                                <SelectItem value="Turquie">Turquie</SelectItem>
                                <SelectItem value="Viêt Nam">Viêt Nam</SelectItem>
                                <SelectItem value="Yémen">Yémen</SelectItem>
                              </SelectGroup>
                              <SelectGroup>
                                <SelectLabel>Océanie</SelectLabel>
                                <SelectItem value="Australie">Australie</SelectItem>
                                <SelectItem value="Fidji">Fidji</SelectItem>
                                <SelectItem value="Kiribati">Kiribati</SelectItem>
                                <SelectItem value="Îles Marshall">Îles Marshall</SelectItem>
                                <SelectItem value="Micronésie">Micronésie</SelectItem>
                                <SelectItem value="Nauru">Nauru</SelectItem>
                                <SelectItem value="Nouvelle-Zélande">Nouvelle-Zélande</SelectItem>
                                <SelectItem value="Palaos">Palaos</SelectItem>
                                <SelectItem value="Papouasie-Nouvelle-Guinée">Papouasie-Nouvelle-Guinée</SelectItem>
                                <SelectItem value="Îles Salomon">Îles Salomon</SelectItem>
                                <SelectItem value="Samoa">Samoa</SelectItem>
                                <SelectItem value="Tonga">Tonga</SelectItem>
                                <SelectItem value="Tuvalu">Tuvalu</SelectItem>
                                <SelectItem value="Vanuatu">Vanuatu</SelectItem>
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={hunterForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Catégorie de chasseur</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={hunterForm.getValues("pays") === "Sénégal"}
                          >
                            <FormControl>
                              <SelectTrigger className="border-black">
                                <SelectValue placeholder="Sélectionner une catégorie" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="resident">Résident</SelectItem>
                              <SelectItem value="touristique">Touriste</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {hunterForm.watch("category") === "resident" && (
                      <FormField
                        control={hunterForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Numéro de téléphone</FormLabel>
                            <FormControl>
                              <div className="flex items-center">
                                <div className="flex items-center justify-center bg-gray-200 h-10 px-3 border border-input rounded-l-md">
                                  <span>+221</span>
                                </div>
                                <Input
                                  placeholder="XX XXX XX XX"
                                  {...field}
                                  className="border-black rounded-l-none"
                                  onChange={(e) => {
                                    // Extraction des chiffres uniquement
                                    const numericValue = e.target.value.replace(/[^0-9]/g, '');

                                    // Limiter à 9 chiffres maximum
                                    const limitedValue = numericValue.substring(0, 9);

                                    // Format avec espaces: XX XXX XX XX
                                    let formattedValue = '';

                                    if (limitedValue.length > 0) {
                                      formattedValue += limitedValue.substring(0, Math.min(2, limitedValue.length));
                                    }

                                    if (limitedValue.length > 2) {
                                      formattedValue += ' ' + limitedValue.substring(2, Math.min(5, limitedValue.length));
                                    }

                                    if (limitedValue.length > 5) {
                                      formattedValue += ' ' + limitedValue.substring(5, Math.min(7, limitedValue.length));
                                    }

                                    if (limitedValue.length > 7) {
                                      formattedValue += ' ' + limitedValue.substring(7, 9);
                                    }

                                    // Mise à jour du champ avec la valeur formatée
                                    field.onChange(formattedValue);
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={hunterForm.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date de naissance</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              placeholder="Date de naissance"
                              {...field}
                              className="border-black"
                            />
                          </FormControl>
                          <FormDescription>
                            {currentAge !== null && `Âge calculé: ${currentAge} ans`}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={hunterForm.control}
                      name="profession"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profession</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Votre profession"
                              {...field}
                              className="border-black capitalize"
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
                      control={hunterForm.control}
                      name="experience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Années d'expérience en chasse</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              {...field}
                              onKeyDown={(e) => {
                                // Autoriser uniquement les chiffres et les touches de contrôle
                                if (!/[0-9]/.test(e.key) &&
                                  e.key !== 'Backspace' &&
                                  e.key !== 'Delete' &&
                                  e.key !== 'ArrowLeft' &&
                                  e.key !== 'ArrowRight' &&
                                  e.key !== 'Tab') {
                                  e.preventDefault();
                                }
                              }}
                              onChange={(e) => {
                                // S'assurer que seuls les chiffres sont acceptés
                                const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                const value = numericValue ? parseInt(numericValue) : 0;
                                field.onChange(value);
                              }}
                              className="border-black"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Informations du tuteur si le chasseur est mineur */}
                    {isMinor && (
                      <div className="space-y-4 border-t pt-4 mt-4 bg-gray-100 p-4 rounded-lg">
                        <h3 className="text-lg font-medium">Informations du tuteur</h3>
                        <p className="text-sm text-gray-500">Pour les chasseurs mineurs (moins de 18 ans), un tuteur légal doit être déclaré.</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={hunterForm.control}
                            name="tutorFirstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Prénom du tuteur</FormLabel>
                                <FormControl>
                                  <Input placeholder="Prénom du tuteur" {...field} className="border-black" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={hunterForm.control}
                            name="tutorLastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nom du tuteur</FormLabel>
                                <FormControl>
                                  <Input placeholder="Nom du tuteur" {...field} className="border-black" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={hunterForm.control}
                          name="tutorIdNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Numéro de pièce d'identité du tuteur</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Numéro de pièce du tuteur"
                                  {...field}
                                  className="border-black text-center"
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
                          control={hunterForm.control}
                          name="tutorPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Numéro de téléphone du tuteur</FormLabel>
                              <FormControl>
                                <div className="flex items-center">
                                  <div className="flex items-center justify-center bg-gray-200 h-10 px-3 border border-input rounded-l-md">
                                    <span>+221</span>
                                  </div>
                                  <Input
                                    placeholder="XX XXX XX XX"
                                    {...field}
                                    className="border-black rounded-l-none"
                                    onChange={(e) => {
                                      // Extraction des chiffres uniquement
                                      const numericValue = e.target.value.replace(/[^0-9]/g, '');

                                      // Limiter à 9 chiffres maximum
                                      const limitedValue = numericValue.substring(0, 9);

                                      // Format avec espaces: XX XXX XX XX
                                      let formattedValue = '';

                                      if (limitedValue.length > 0) {
                                        formattedValue += limitedValue.substring(0, Math.min(2, limitedValue.length));
                                      }

                                      if (limitedValue.length > 2) {
                                        formattedValue += ' ' + limitedValue.substring(2, Math.min(5, limitedValue.length));
                                      }

                                      if (limitedValue.length > 5) {
                                        formattedValue += ' ' + limitedValue.substring(5, Math.min(7, limitedValue.length));
                                      }

                                      if (limitedValue.length > 7) {
                                        formattedValue += ' ' + limitedValue.substring(7, 9);
                                      }

                                      // Mise à jour du champ avec la valeur formatée
                                      field.onChange(formattedValue);
                                    }}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={hunterForm.control}
                          name="letterConfirmation"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  Je confirme avoir fourni une lettre de responsabilité du tuteur
                                </FormLabel>
                                <FormDescription>
                                  Cette lettre sera vérifiée lors de la validation de votre demande de permis
                                </FormDescription>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    <div className="flex space-x-4 mt-6">
                      <Button variant="outline" type="button" className="w-1/2" onClick={() => setStep(1)}>
                        Retour
                      </Button>
                      <Button type="submit" className="w-1/2 bg-green-700 hover:bg-green-800">
                        Finaliser l'inscription
                      </Button>
                    </div>
                  </form>
                </Form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}