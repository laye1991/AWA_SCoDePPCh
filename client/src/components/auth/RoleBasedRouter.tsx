import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useEffect } from "react";

// Fonction centralisée pour déterminer la page d'accueil selon le rôle
export const getHomePage = (role?: string, type?: string) => {
  if (!role) return '/login';
  
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'agent':
      return type === 'secteur' ? '/sector-agent/dashboard' : '/regional-agent/dashboard';
    case 'sub-agent':
      return '/sector-agent/dashboard';
    case 'hunter':
      return '/hunter/dashboard';
    case 'hunting-guide':
      return '/guide/dashboard';
    default:
      return '/login';
  }
};

export default function RoleBasedRouter() {
  const { user, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/login');
      return;
    }
    
    const homePage = getHomePage(user?.role, user?.type);
    setLocation(homePage);
  }, [isAuthenticated, user, setLocation]);
  
  // Ce composant ne rend rien, il effectue uniquement la redirection
  return null;
}
