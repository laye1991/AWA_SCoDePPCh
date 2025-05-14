import { useState, useEffect } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useStats } from "@/lib/hooks/useStats";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { getHomePage } from "@/components/auth/RoleBasedRouter";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { stats } = useStats();
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();

  // Utilisation de la fonction getHomePage centralisée depuis RoleBasedRouter

  // Gestion de la redirection unifiée
  useEffect(() => {
    // Si l'utilisateur n'est pas authentifié et n'est pas sur la page login, redirection vers login
    if (!isAuthenticated && location !== '/login') {
      setLocation('/login');
      return;
    }
    
    // Si l'utilisateur est sur la page login ou racine mais qu'il est déjà authentifié
    if (isAuthenticated && (location === '/login' || location === '/')) {
      setLocation(getHomePage(user?.role, user?.type));
      return;
    }

    // Fermer automatiquement la sidebar sur mobile lors du changement de page
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [isAuthenticated, location, user]);

  // État pour gérer la visibilité du menu latéral sur mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fonction pour gérer le toggle du sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  // Écouter les événements personnalisés d'ouverture/fermeture de la sidebar depuis le header
  useState(() => {
    const handleToggleSidebar = () => {
      setIsSidebarOpen(!isSidebarOpen);
    };
    
    window.addEventListener('toggle-sidebar', handleToggleSidebar);
    
    return () => {
      window.removeEventListener('toggle-sidebar', handleToggleSidebar);
    };
  });

  // Ajuster la hauteur du header en fonction de la taille d'écran
  const headerHeight = '60px';
  const navHeight = '36px';
  const totalTopSpace = `calc(${headerHeight} + ${navHeight})`;

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <Header />
      
      {/* Spacer to compensate for fixed header with page title */}
      <div style={{ height: headerHeight }} className="flex items-center justify-center">
        {location === "/sector-dashboard" && (
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mt-3 text-green-800">Tableau de bord Agent Secteur</h2>
        )}
      </div>
      
      {/* Navigation Bar - fixed, directly attached to header */}
      <nav className="bg-white px-1 sm:px-3 py-1 sm:py-2 shadow flex justify-between md:justify-around flex-wrap fixed w-full z-10" style={{ top: headerHeight }}>
        {user?.role === "hunter" ? (
          // Barre de navigation pour le rôle chasseur
          <>
            {/* Bouton toggle menu sur mobile */}
            <button 
              className="md:hidden flex items-center p-1 bg-green-600 text-white rounded-md"
              onClick={toggleSidebar}
            >
              <span className="material-icons text-sm" style={{fontFamily: 'Material Icons'}}>menu</span>
              <span className="text-xs ml-1">Menu</span>
            </button>

            <div className="flex items-center text-xs sm:text-sm">
              <span className="material-icons text-sm mr-0 sm:mr-1">person</span> 
              <Link href="/profile" className="text-gray-700 hover:text-blue-500">Mon Profil</Link>
            </div>
            
            <div className="flex items-center text-xs sm:text-sm">
              <span className="material-icons text-sm mr-0 sm:mr-1">description</span> 
              <Link href="/myrequests" className="text-gray-700 hover:text-blue-500">Demande Permis</Link>
            </div>
            
            <div className="flex items-center text-xs sm:text-sm">
              <span className="material-icons text-sm mr-0 sm:mr-1">notifications</span> 
              <Link href="/alerts" className="text-gray-700 hover:text-blue-500">Alertes</Link>
            </div>
            
            <span className="flex items-center text-green-700 text-xs sm:text-sm font-semibold bg-green-50 px-2 sm:px-3 py-1 rounded-md">
              <span className="material-icons text-sm mr-0 sm:mr-1">person</span> 
              <span className="inline">{user?.firstName || ''} {user?.lastName || ''}</span>
            </span>
          </>
        ) : (
          // Barre de navigation originale pour les autres rôles
          <>
            {/* Bouton toggle menu sur mobile */}
            <button 
              className="md:hidden flex items-center p-1 bg-green-600 text-white rounded-md"
              onClick={toggleSidebar}
            >
              <span className="material-icons text-sm" style={{fontFamily: 'Material Icons'}}>menu</span>
              <span className="text-xs ml-1">Menu</span>
            </button>

            <Link href={user ? getHomePage(user.role, user.type) : "/login"} 
                 className={`flex items-center text-xs sm:text-sm ${location === "/" || location === "/dashboard" || location === "/agent-dashboard" || location === "/sector-dashboard" || location === "/hunter-dashboard" ? "text-blue-500" : "text-gray-700 hover:text-blue-500"}`}>
              <span className="material-icons text-sm mr-0 sm:mr-1">dashboard</span> 
              <span className="hidden xs:inline">Tableau de Bord</span>
            </Link>
            
            {/* Carte d'accès rapide pour les agents régionaux et les agents secteur */}
            {(user?.role === "agent" || user?.role === "sub-agent") && (
              <div className="flex items-center">
                <div className="ml-2 bg-green-50 rounded-md p-1 border border-green-200 flex items-center shadow-sm hover:shadow-md transition-all duration-200">
                  <Link 
                    href="/map"
                    className="text-xs text-green-700 font-medium flex items-center px-1"
                  >
                    <span className="material-icons text-sm mr-1">map</span>
                    <span>Carte</span>
                  </Link>
                </div>
              </div>
            )}
            
            <Link href="/hunters" className={`flex items-center text-xs sm:text-sm ${location === "/hunters" ? "text-blue-500" : "text-gray-700 hover:text-blue-500"}`}>
              <span className="material-icons text-sm mr-0 sm:mr-1">group</span> 
              <span className="hidden xs:inline">Chasseurs</span>
            </Link>
            
            {user?.role !== "sub-agent" && (
              <Link href="/permits" className={`flex items-center text-xs sm:text-sm ${location === "/permits" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-700 hover:text-blue-500"}`}>
                <span className="material-icons text-sm mr-0 sm:mr-1">description</span> 
                <span className="hidden xs:inline">Permis</span>
              </Link>
            )}
            
            {(user?.role === "admin" || user?.role === "agent" || user?.role === "sub-agent") && (
              <Link href="/taxes" className={`flex items-center text-xs sm:text-sm ${location === "/taxes" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-700 hover:text-blue-500"}`}>
                <span className="material-icons text-sm mr-0 sm:mr-1">paid</span> 
                <span className="hidden xs:inline">Taxe d'Abattage</span>
                <span className="flex items-center justify-center h-5 w-5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full ml-1 sm:hidden">💰</span>
              </Link>
            )}
            
            {user?.role === "admin" && (
              <Link href="/sms" className={`flex items-center text-xs sm:text-sm hidden sm:flex ${location === "/sms" ? "text-blue-500" : "text-gray-700 hover:text-blue-500"}`}>
                <span className="material-icons text-sm mr-0 sm:mr-1">sms</span> 
                <span className="hidden xs:inline">SMS</span>
              </Link>
            )}
            
            <span className="flex items-center text-green-700 text-xs sm:text-sm font-semibold bg-green-50 px-2 sm:px-3 py-1 rounded-md">
              <span className="material-icons text-sm mr-0 sm:mr-1">person</span> 
              <span className="inline">{user?.firstName || ''} {user?.lastName || ''}</span>
            </span>
          </>
        )}
      </nav>
      
      {/* Spacer to compensate for fixed navbar */}
      <div style={{ height: navHeight }}></div>
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar avec toggle pour mobile - modifié pour corriger les problèmes sur mobile */}
        <div 
          className={`fixed left-0 bg-white shadow-lg z-20 w-64 
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} 
            transition-transform duration-200 ease-in-out md:block overflow-y-auto`}
          style={{ top: totalTopSpace, height: `calc(100vh - ${totalTopSpace})` }}
        >
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        </div>
        
        {/* Overlay sombre qui apparait quand le menu est ouvert sur mobile */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden" 
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        
        {/* Main Section - responsive */}
        <main 
          className="flex-1 p-2 sm:p-4 md:p-6 overflow-y-auto overflow-x-hidden transition-all duration-200 md:ml-64 bg-gray-100" 
          style={{ 
            height: `calc(100vh - ${totalTopSpace})`,
            scrollBehavior: 'smooth' 
          }}
          onClick={() => window.innerWidth < 768 ? setIsSidebarOpen(false) : null}
        >
          {/* Retour en haut lors des changements de page */}
          <div ref={(el) => { if (el) el.scrollTop = 0; }} className="container mx-auto">
            {children}
          </div>
          <OfflineIndicator />
        </main>
      </div>
    </div>
  );
}