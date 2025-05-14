import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Link, useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Eye, EyeOff, User, Lock } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

const loginSchema = z.object({
  username: z.string().min(1, "Le nom d'utilisateur est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export default function Login() {
  console.log("Rendu du composant Login");
  const { login, error, isLoading, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Nouvel état pour suivre la soumission
  const [, setLocation] = useLocation();

  useEffect(() => {
    document.title = "Connexion | SCoDePP_Ch";
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      console.log("Utilisateur authentifié, redirection vers /dashboard");
      setLocation("/dashboard");
    }
  }, [isAuthenticated, setLocation]);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    if (isSubmitting) {
      console.log("Soumission déjà en cours, ignorée");
      return; // Ignorer si une soumission est déjà en cours
    }

    setIsSubmitting(true); // Marquer la soumission comme en cours
    console.log("Soumission du formulaire avec:", values);
    try {
      await login(values.username, values.password);
      console.log("Connexion réussie, en attente de redirection...");
      toast({
        title: "Connexion réussie",
        description: "Vous êtes maintenant connecté. Vous allez être redirigé.",
      });
    } catch (error) {
      console.error("Erreur d'authentification:", error);
      toast({
        variant: "destructive",
        title: "Erreur de connexion",
        description: "Nom d'utilisateur ou mot de passe incorrect",
      });
    } finally {
      setIsSubmitting(false); // Réinitialiser l'état après la soumission
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-xl border-2 border-green-100 hover:border-green-200 transition-all duration-300 backdrop-blur-sm relative overflow-hidden">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-center mb-2">Connexion</h1>
        <p className="text-gray-600 text-center mb-6">
          Entrez vos identifiants pour accéder à votre compte
        </p>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom d'utilisateur</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-green-600" />
                      </div>
                      <Input 
                        placeholder="nom_utilisateur" 
                        {...field} 
                        disabled={isLoading || isSubmitting} 
                        className="h-12 pl-10 bg-white border-2 focus:border-green-300 rounded-lg shadow-sm transition-all duration-200" 
                      />
                    </div>
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
                  <div className="relative">
                    <FormControl>
                      <div className="flex items-center relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                          <Lock className="h-5 w-5 text-green-600" />
                        </div>
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="********" 
                          {...field} 
                          className="pr-10 pl-10 h-12 bg-white border-2 focus:border-green-300 rounded-lg shadow-sm transition-all duration-200"
                          disabled={isLoading || isSubmitting}
                        />
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          className="absolute right-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading || isSubmitting}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
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
            <div className="flex justify-end">
              <Button variant="link" className="p-0 h-auto text-xs text-green-700" disabled={isLoading || isSubmitting}>
                Mot de passe oublié?
              </Button>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-green-800 hover:bg-green-700" 
              disabled={isLoading || isSubmitting}
            >
              {isLoading || isSubmitting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>
        </Form>

        <div className="text-center mt-8 pt-6 border-t border-gray-200">
          <p className="text-gray-600 mb-2">
            Vous n'avez pas de compte? <Link href="/register" className="text-green-700 font-medium">Créer un compte</Link>
          </p>
        </div>
      </div>
    </div>
  );
}