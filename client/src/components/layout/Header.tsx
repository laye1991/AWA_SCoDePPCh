import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Header() {
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fonction pour rafraîchir toutes les données
  const handleRefreshAll = async () => {
    // Animation de chargement
    const refreshButton = document.getElementById('refresh-button');
    if (refreshButton) {
      refreshButton.classList.add('animate-spin');
    }
    
    try {
      // Rafraîchir toutes les requêtes
      await queryClient.refetchQueries();
      
      toast({
        title: "Actualisation réussie",
        description: "Toutes les données ont été mises à jour",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Erreur d'actualisation",
        description: "Impossible de mettre à jour les données",
        variant: "destructive",
      });
    } finally {
      // Arrêter l'animation
      if (refreshButton) {
        refreshButton.classList.remove('animate-spin');
      }
    }
  };
  
  // Fonction pour ouvrir/fermer la sidebar depuis le header
  const toggleSidebar = () => {
    // On émet un événement personnalisé pour communiquer avec MainLayout
    window.dispatchEvent(new CustomEvent('toggle-sidebar'));
  };

  return (
    <header className="bg-green-600 text-white p-2 sm:p-3 flex justify-between items-center fixed w-full z-[100] top-0">
      <div className="flex items-center">
        {/* Bouton avec le drapeau du Sénégal pour masquer/afficher la barre latérale */}
        <button 
          className="text-white bg-transparent border-none cursor-pointer mr-2 flex items-center"
          onClick={toggleSidebar}
        >
          <img src="/assets/Flag_of_Senegal.svg" alt="Drapeau du Sénégal" width="30" height="24" className="mr-2" />
        </button>
        
        <div>
          <h1 className="text-xs uppercase">République du Sénégal</h1>
          <p className="text-[10px] uppercase">Ministère de l'Environnement et de la Transition Écologique</p>
          <p className="text-[9px] uppercase hidden sm:block">Direction des Eaux et Forêts, Chasse et Conservation des Sols</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3 z-[101] relative">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center bg-white text-green-600 hover:bg-gray-100 px-2 sm:px-3" 
          onClick={handleRefreshAll}
        >
          <RefreshCw id="refresh-button" className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Actualiser</span>
        </Button>
        
        <Button 
          variant="destructive" 
          size="sm" 
          className="flex items-center px-2 sm:px-3" 
          onClick={logout}
        >
          <span className="material-icons text-sm mr-1">logout</span>
          <span className="hidden sm:inline">Déconnexion</span>
        </Button>
      </div>
    </header>
  );
}
