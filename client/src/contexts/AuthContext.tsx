import React from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

// Définir les interfaces
export interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  type?: "regional" | "secteur";
  email: string;
  phone: string;
  region?: string;
  zone?: string;
  hunterId?: number;
  guideId?: number;
  licenseNumber?: string;
  experience?: number;
  hunter?: {
    id: number;
    firstName: string;
    lastName: string;
    idNumber: string;
    dateOfBirth: string;
    phone: string;
    address: string;
    region: string;
    experience: number;
    profession: string;
    category: string;
    weaponType?: string;
    weaponBrand?: string;
    weaponReference?: string;
    weaponCaliber?: string;
    weaponOtherDetails?: string;
  }
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

// Créer le contexte avec une valeur par défaut
const defaultContext: AuthContextType = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  error: null
};

const AuthContext = React.createContext<AuthContextType>(defaultContext);

// Hook personnalisé pour utiliser le contexte
export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [, setLocation] = useLocation();

  const loadHunterInfo = async (userId: number, hunterId: number | undefined) => {
    if (!hunterId) return null;
    
    try {
      const hunterData = await apiRequest({
        url: `/api/hunters/${hunterId}`,
        method: 'GET'
      });
      
      return hunterData;
    } catch (error) {
      console.error(`Erreur lors du chargement des données du chasseur pour l'ID ${hunterId}:`, error);
      return null;
    }
  };

  const login = async (username: string, password: string) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await apiRequest({
        url: '/api/auth/login',
        method: 'POST',
        data: { username, password }
      });
      
      // Si la réponse contient un utilisateur, définir l'utilisateur dans l'état
      if (response && response.user) {
        // Si l'utilisateur est un chasseur et a un hunterId, charger les informations du chasseur
        if (response.user.role === "hunter" && response.user.hunterId) {
          const hunterInfo = await loadHunterInfo(response.user.id, response.user.hunterId);
          if (hunterInfo) {
            response.user.hunter = hunterInfo;
          }
        }
        
        setUser(response.user);
        console.log("User set in auth context:", response.user);
        localStorage.setItem('userRole', response.user.role);
        localStorage.setItem('userRegion', response.user.region || '');
        
        if (response.user.role === 'admin') {
          setLocation('/dashboard');
        } else if (response.user.role === 'agent') {
          setLocation('/agent-dashboard');
        } else if (response.user.role === 'sub-agent') {
          setLocation('/sector-dashboard');
        } else if (response.user.role === 'hunter') {
          setLocation('/hunter-dashboard');
        } else {
          setLocation('/');
        }
      } else {
        throw new Error("La réponse ne contient pas d'informations utilisateur");
      }
    } catch (err: any) {
      console.error("Erreur lors de la connexion:", err);
      setError(err.message || "Une erreur s'est produite lors de la connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    
    try {
      await apiRequest({
        url: '/api/auth/logout',
        method: 'POST'
      });
      
      setUser(null);
      localStorage.removeItem('userRole');
      localStorage.removeItem('userRegion');
      setLocation('/login');
    } catch (err: any) {
      console.error("Erreur lors de la déconnexion:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Effet pour vérifier si l'utilisateur est déjà connecté au chargement de l'application
  React.useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      
      try {
        const response = await apiRequest({
          url: '/api/auth/me',
          method: 'GET'
        });
        
        if (response) {
          // Si l'utilisateur est un chasseur et a un hunterId, charger les informations du chasseur
          if (response.role === "hunter" && response.hunterId) {
            const hunterInfo = await loadHunterInfo(response.id, response.hunterId);
            if (hunterInfo) {
              response.hunter = hunterInfo;
            }
          }
          
          setUser(response);
          console.log("User retrieved from session:", response);
          localStorage.setItem('userRole', response.role);
          localStorage.setItem('userRegion', response.region || '');
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Erreur lors de la vérification de l'authentification:", err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
