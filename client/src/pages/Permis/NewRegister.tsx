import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

// Schéma de validation pour le formulaire d'inscription
const registerSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom de famille doit contenir au moins 2 caractères"),
  username: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères"),
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export default function NewRegister() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  useEffect(() => {
    document.title = "Inscription | SCoDePP_Ch";
  }, []);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: ""
    },
  });

  // États pour les étapes du formulaire
  const [currentStep, setCurrentStep] = useState(1);
  const [userData, setUserData] = useState<z.infer<typeof registerSchema> | null>(null);
  
  // Informations du chasseur pour l'étape 2
  const [idNumber, setIdNumber] = useState("");
  
  // Réinitialiser le champ idNumber lorsque le composant est monté
  useEffect(() => {
    setIdNumber("");
  }, []);
  const [country, setCountry] = useState("");
  const [category, setCategory] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [profession, setProfession] = useState("");
  const [experience, setExperience] = useState("0");

  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    console.log(values);
    setUserData(values);
    setCurrentStep(2);
    // Réinitialiser l'idNumber lors du passage à l'étape 2
    setIdNumber("");
  };
  
  const handleBackToStep1 = () => {
    setCurrentStep(1);
  };
  
  const handleFinishRegistration = () => {
    console.log("Données utilisateur:", userData);
    console.log("Données chasseur:", {
      idNumber,
      country,
      category,
      birthDate,
      profession,
      experience: parseInt(experience)
    });
    // Ici, nous ferions l'appel API pour créer le compte
  };

  // Rendu principal avec condition pour afficher l'étape 1 ou 2
  return (
    <div className="flex h-screen">
      {/* Partie gauche - Information avec fond vert */}
      <div className="hidden md:block w-1/2 bg-[#004d33] text-white p-10 flex flex-col justify-center">
        <h1 className="text-2xl font-bold mb-6">SCoDePP_Ch - Système de Contrôle de Demande de Permis et de Prélèvements de chasse</h1>
        
        <p className="mb-8">Créez votre compte pour soumettre des demandes de permis de chasse et suivre vos activités cynégétiques.</p>
        
        <div className="space-y-6">
          <div className="flex items-start space-x-3">
            <div className="rounded-full h-6 w-6 bg-green-500 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium">Demande de permis simplifiée</h3>
              <p className="text-sm text-gray-200">Soumettez facilement vos demandes de permis en ligne</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="rounded-full h-6 w-6 bg-green-500 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium">Suivi en temps réel</h3>
              <p className="text-sm text-gray-200">Consultez l'état de vos permis et de vos déclarations</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="rounded-full h-6 w-6 bg-green-500 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium">Déclaration d'espèces</h3>
              <p className="text-sm text-gray-200">Déclarez vos prélèvements conformément à la réglementation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Partie droite - Formulaire (condition pour afficher l'étape 1 ou 2) */}
      <div className="w-full md:w-1/2 bg-white flex flex-col items-center justify-center p-6">
        {currentStep === 1 ? (
          <div className="w-full max-w-md p-6 rounded-lg">
            {/* Icône utilisateur en haut */}
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-center mb-1">Inscription</h2>
            <p className="text-gray-600 text-center text-sm mb-6">Remplissez le formulaire pour créer votre compte</p>
            
            <h3 className="text-md font-semibold text-center mb-4">Créer un compte</h3>
            <p className="text-gray-600 text-center text-sm mb-6">Remplissez le formulaire ci-dessous pour vous inscrire</p>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                </div>
                
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom d'utilisateur</FormLabel>
                      <FormControl>
                        <Input placeholder="nom_utilisateur" {...field} />
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
                        <Input type="email" placeholder="exemple@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mot de passe</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <div className="flex items-center relative">
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="********" 
                                {...field} 
                                className="pr-10"
                              />
                              <Button 
                                type="button"
                                variant="ghost" 
                                size="icon" 
                                className="absolute right-0 h-full px-3"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                <span className="sr-only">
                                  {showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                                </span>
                              </Button>
                            </div>
                          </FormControl>
                        </div>
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
                        <div className="relative">
                          <FormControl>
                            <div className="flex items-center relative">
                              <Input 
                                type={showConfirmPassword ? "text" : "password"} 
                                placeholder="********" 
                                {...field} 
                                className="pr-10"
                              />
                              <Button 
                                type="button"
                                variant="ghost" 
                                size="icon" 
                                className="absolute right-0 h-full px-3"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                <span className="sr-only">
                                  {showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                                </span>
                              </Button>
                            </div>
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex space-x-4 mt-6">
                  <Button variant="outline" type="button" className="w-1/2" onClick={() => setLocation("/login")}>
                    Annuler
                  </Button>
                  <Button type="submit" className="w-1/2 bg-green-700 hover:bg-green-800">
                    Continuer
                  </Button>
                </div>
              </form>
            </Form>
            
            <div className="mt-6 text-center text-xs text-gray-500">
              En créant un compte, vous acceptez les <Link href="#" className="text-green-700 hover:underline">Conditions d'utilisation</Link> et la <Link href="#" className="text-green-700 hover:underline">Politique de confidentialité</Link>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md p-6 rounded-lg">
            {/* Étape 2 - Informations du chasseur */}
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-center mb-2">Inscription</h2>
            <p className="text-gray-600 text-center text-sm mb-4">Remplissez le formulaire pour créer votre compte</p>
            
            <h3 className="text-xl font-bold text-center mb-2">Informations du chasseur</h3>
            <p className="text-gray-600 text-center text-sm mb-6">Complétez votre profil de chasseur</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Veuillez saisir le numéro de votre pièce d'identité ou passeport pour finaliser votre inscription.
                </label>
                <input 
                  type="text" 
                  name="idNumberField"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" 
                  placeholder="Entrez le numéro de votre pièce d'identité"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  autoComplete="new-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  key="idNumberField"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pays d'émission de la pièce d'identité ou du passeport</label>
                <select 
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" 
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  <option value="">Sélectionner le pays</option>
                  <option value="Sénégal">Sénégal</option>
                  <option value="France">France</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                <select 
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Sélectionner la catégorie</option>
                  <option value="resident">Résident</option>
                  <option value="touriste">Touriste</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
                  <input 
                    type="date" 
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" 
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profession</label>
                  <input 
                    type="text" 
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" 
                    placeholder="Votre profession"
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Depuis combien d'années chassez-vous ?</label>
                <input 
                  type="number" 
                  min="0"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" 
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                />
              </div>
              
              <div className="flex space-x-4 mt-6">
                <Button variant="outline" type="button" className="w-1/2" onClick={handleBackToStep1}>
                  Retour
                </Button>
                <Button 
                  type="button" 
                  className="w-1/2 bg-green-700 hover:bg-green-800"
                  onClick={handleFinishRegistration}
                >
                  Terminer l'inscription
                </Button>
              </div>
              
              <div className="mt-6 text-center text-xs text-gray-500">
                En créant un compte, vous acceptez les <Link href="#" className="text-green-700 hover:underline">Conditions d'utilisation</Link> et la <Link href="#" className="text-green-700 hover:underline">Politique de confidentialité</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}