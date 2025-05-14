import { useLocation } from "wouter";
import { 
  Settings, Home, Users, FileText, Coins, History, LogOut, 
  MessageSquare, Bell, FilePlus2, UserCircle 
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
  const [location, navigate] = useLocation();
  const { logout, user } = useAuth();

  const isActive = (path: string) => {
    return location === path;
  };

  const handleLogout = async () => {
    await logout();
  };

  // Différentes listes de navigation en fonction du rôle de l'utilisateur
  const adminNavItems = [
    { path: "/dashboard", label: "Tableau de Bord", icon: <Home className="h-6 w-6 mr-1" /> },
    { path: "/hunters", label: "Chasseurs", icon: <Users className="h-6 w-6 mr-1" /> },
    { path: "/permits", label: "Permis", icon: <FileText className="h-6 w-6 mr-1" /> },
    { path: "/sms", label: "SMS", icon: <MessageSquare className="h-6 w-6 mr-1" /> },
    { path: "/history", label: "Historique", icon: <History className="h-6 w-6 mr-1" /> },
  ];
  
  const agentNavItems = [
    { path: "/agent-dashboard", label: "Tableau de Bord", icon: <Home className="h-6 w-6 mr-1" /> },
    { path: "/hunters", label: "Chasseurs", icon: <Users className="h-6 w-6 mr-1" /> },
    { path: "/permits", label: "Permis", icon: <FileText className="h-6 w-6 mr-1" /> },
    { path: "/taxes", label: "Taxes d'Abattage", icon: <Coins className="h-6 w-6 mr-1" /> },
    { path: "/sms", label: "SMS", icon: <MessageSquare className="h-6 w-6 mr-1" /> },
    { path: "/history", label: "Historique", icon: <History className="h-6 w-6 mr-1" /> },
  ];
  
  const hunterNavItems = [
    { path: "/profile", label: "Mon Profil", icon: <UserCircle className="h-6 w-6 mr-1" /> },
    { path: "/permit-request", label: "Demande Permis", icon: <FilePlus2 className="h-6 w-6 mr-1" /> },
    { path: "/alerts", label: "Alertes", icon: <Bell className="h-6 w-6 mr-1" /> },
  ];

  // Guide items de navigation (similaires aux chasseurs mais sans tableau de bord)
  const guideNavItems = [
    { path: "/profile", label: "Mon Profil", icon: <UserCircle className="h-6 w-6 mr-1" /> },
    { path: "/alerts", label: "Alertes", icon: <Bell className="h-6 w-6 mr-1" /> },
  ];

  // Sélectionner les éléments de navigation en fonction du rôle
  let navItems;
  if (user?.role === "hunter") {
    navItems = hunterNavItems;
  } else if (user?.role === "guide") {
    navItems = guideNavItems;
  } else if (user?.role === "agent") {
    navItems = agentNavItems;
  } else {
    navItems = adminNavItems;
  }

  return (
    <nav className="bg-green-600 text-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          <div className="flex-1"></div>
          <div className="flex-auto overflow-x-auto py-1">
            <ul className="flex min-w-full justify-center space-x-1 md:space-x-3">
              {navItems.map((item) => (
                <li key={item.path}>
                  <button
                    className={`px-4 py-2 text-xs md:text-sm font-medium rounded-full transition-all duration-300 
                      ${isActive(item.path) 
                        ? "bg-white bg-opacity-20 shadow-inner" 
                        : "hover:bg-white hover:bg-opacity-10"}`}
                    onClick={() => navigate(item.path)}
                  >
                    <span className="flex items-center">
                      {item.icon}
                      <span className="hidden md:inline">{item.label}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 flex justify-end items-center gap-2">
            {/* Badge indiquant le rôle de l'utilisateur - version simplifiée sans icône */}
            <div className="hidden md:flex px-3 py-1 bg-white bg-opacity-20 rounded-full text-xs items-center">
              <span>
                {user?.role === "admin" && "Administrateur"}
                {user?.role === "agent" && "Agent"}
                {user?.role === "hunter" && "Chasseur"}
                {user?.role === "guide" && "Guide de chasse"}
              </span>
            </div>

            {user?.role === "admin" && (
              <button 
                className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded-full transition-all duration-300
                  ${isActive("/settings") 
                    ? "bg-white bg-opacity-20 shadow-inner" 
                    : "hover:bg-white hover:bg-opacity-10"}`}
                onClick={() => navigate("/settings")}
              >
                <span className="flex items-center">
                  <Settings className="h-6 w-6" />
                  <span className="hidden md:inline ml-2">Paramètres</span>
                </span>
              </button>
            )}
            <button 
              className="px-3 py-1.5 text-xs md:text-sm font-medium rounded-full transition-all duration-300 bg-red-500 hover:bg-red-600"
              onClick={handleLogout}
            >
              <span className="flex items-center">
                <LogOut className="h-6 w-6" />
                <span className="hidden md:inline ml-2">Déconnexion</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
