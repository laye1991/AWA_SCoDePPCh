

import React, { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

// Type pour les statistiques
interface Stats {
  hunterCount: number;
  activePermitCount: number;
  expiredPermitCount: number;
  totalPermitCount: number;
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch statistics avec le type approprié
  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/stats"],
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (user) {
      setIsAdmin(user.role === "admin" || user.role === "agent");
    }
  }, [user]);
  
  // Fonction d'aide pour fermer la sidebar sur mobile
  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };
  
  // Composant Link personnalisé qui inclut le gestionnaire de clic
  const NavLink = ({ href, children }: { href: string, children: React.ReactNode }) => (
    <Link href={href} onClick={handleLinkClick}>{children}</Link>
  );

  return (
    <aside className="w-full md:w-64 bg-white shadow-sm p-4 fixed left-0 transition-all duration-300" 
      style={{ 
        top: '96px', 
        height: 'calc(100vh - 96px)', 
        maxWidth: '100%', 
        position: 'fixed', 
        overflowY: 'auto', 
        overflowX: 'hidden',
        scrollbarWidth: 'none',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Bouton pour fermer le menu sur mobile */}
      <button 
        className="md:hidden absolute top-2 right-2 bg-green-600 text-white p-2 rounded-full shadow-lg"
        onClick={onClose}
      >
        <span className="material-icons" style={{fontFamily: 'Material Icons'}}>close</span>
      </button>
      <ul className="space-y-1">
        {user?.role !== "sub-agent" && user?.role !== "hunter" && (
          <li className={`flex items-center p-2 ${location === "/" || location === "/dashboard" || location === "/agent-dashboard" || location === "/sector-dashboard" || location === "/hunter-dashboard" ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}>
            <span className="material-icons mr-2">home</span>
            <NavLink href={user?.role === "admin" ? "/dashboard" : 
                        (user?.role === "agent" && user?.type === "secteur") ? "/sector-dashboard" :
                        user?.role === "agent" ? "/agent-dashboard" : "/"}>
              Accueil
            </NavLink>
          </li>
        )}

        {user?.role !== "hunter" && user?.role !== "sub-agent" && (
          <li className={`flex items-center p-2 ${location === "/permits" ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}>
            <span className="material-icons mr-2">description</span>
            <NavLink href="/permits">Permis</NavLink>
          </li>
        )}

        {user?.role === "admin" && (
          <>
            <li className={`flex items-center p-2 ${location === "/permit-requests-reception" ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}>
              <span className="material-icons text-amber-500 mr-2">mail</span>
              <NavLink href="/permit-requests-reception">Demandes de Permis</NavLink>
            </li>
            
            <li className={`flex items-center p-2 ${location === "/statistics" ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}>
              <span className="material-icons text-gray-600 mr-2">bar_chart</span>
              <NavLink href="/statistics">Statistiques</NavLink>
            </li>
            
            <li className={`flex items-center p-2 ${location === "/hunters" || location === "/chasseurs" ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}>
              <span className="material-icons text-amber-500 mr-2">groups</span>
              <NavLink href="/hunters">Chasseurs</NavLink>
            </li>
            
            <li className={`flex items-center p-2 ${location === "/guides" ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}>
              <span className="material-icons text-blue-600 mr-2">supervisor_account</span>
              <NavLink href="/guides">Guides</NavLink>
            </li>
            
            <li className={`flex items-center p-2 ${location === "/agents" ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}>
              <span className="material-icons text-green-600 mr-2">person</span>
              <NavLink href="/agents">Agents</NavLink>
            </li>
            
            <li className={`flex items-center p-2 ${location === "/profile" ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}>
              <span className="material-icons text-gray-600 mr-2">person</span>
              <NavLink href="/profile">Profil</NavLink>
            </li>
          </>
        )}

        {user?.role === "agent" && (
          <>
            <li className={`flex items-center p-2 ${location === "/permit-requests-reception" ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}>
              <span className="material-icons text-amber-500 mr-2">mail</span>
              <NavLink href="/permit-requests-reception">Demandes de Permis</NavLink>
            </li>
            
            <li className={`flex items-center p-2 ${location === "/hunters" ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}>
              <span className="material-icons text-amber-500 mr-2">groups</span>
              <NavLink href="/hunters">Chasseurs</NavLink>
            </li>
            
            <li className={`flex items-center p-2 ${location === "/statistics" ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}>
              <span className="material-icons text-gray-600 mr-2">bar_chart</span>
              <NavLink href="/statistics">Statistiques</NavLink>
            </li>
            
            <li className={`flex items-center p-2 ${location === "/regional-sms" ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}>
              <span className="material-icons text-gray-600 mr-2">sms</span>
              <NavLink href="/regional-sms">SMS</NavLink>
            </li>
            
            <li className={`flex items-center p-2 ${location === "/agents-secteur" ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}>
              <span className="material-icons text-green-600 mr-2">person</span>
              <NavLink href="/agents-secteur">Agents Secteur</NavLink>
            </li>
            
            <li className={`flex items-center p-2 ${location === "/regional-guides" ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}>
              <span className="material-icons text-blue-600 mr-2">supervisor_account</span>
              <NavLink href="/regional-guides">Guides Régional</NavLink>
            </li>
            
            <li className={`flex items-center p-2 ${location === "/profile" ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}>
              <span className="material-icons text-gray-600 mr-2">person</span>
              <NavLink href="/profile">Mon Profil</NavLink>
            </li>
          </>
        )}

        {/* Lien Comptes uniquement pour admin */}
        {user?.role === "admin" && (
          <li className={`flex items-center p-2 ${location === "/accounts" ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}>
            <span className="material-icons text-gray-600 mr-2">settings</span>
            <NavLink href="/accounts">Comptes</NavLink>
          </li>
        )}
        
        {/* Lien Paramètres uniquement pour admin */}
        {user?.role === "admin" && (
          <li className={`flex items-center p-2 ${location === "/settings" ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}>
            <span className="material-icons text-gray-600 mr-2">settings</span>
            <NavLink href="/settings">Paramètres</NavLink>
          </li>
        )}

        {/* Lien Historique pour admin et agents régionaux uniquement */}
        {user?.role !== "hunter" && user?.role !== "sub-agent" && (
          <li className={`flex items-center p-2 ${location === "/history" ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}>
            <span className="material-icons text-amber-500 mr-2">history</span>
            <NavLink href="/history">Historique</NavLink>
          </li>
        )}

        {user?.role === "sub-agent" && (
          <>
            <li className={`flex items-center p-2 ${location === "/sector-dashboard" ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}>
              <span className="material-icons mr-2">home</span>
              <NavLink href="/sector-dashboard">Accueil</NavLink>
            </li>
            
            <li className={`flex items-center p-2 ${location === "/sector-permits" ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}>
              <span className="material-icons text-gray-600 mr-2">description</span>
              <NavLink href="/sector-permits">Permis Secteur</NavLink>
            </li>
            
            <li className={`flex items-center p-2 ${location === "/sector-requests" ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}>
              <span className="material-icons text-amber-500 mr-2">mail</span>
              <NavLink href="/sector-requests">Demandes</NavLink>
            </li>
            
            <li className={`flex items-center p-2 ${location === "/sector-sms" ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}>
              <span className="material-icons text-gray-600 mr-2">sms</span>
              <NavLink href="/sector-sms">Messagerie</NavLink>
            </li>
            
            <li className={`flex items-center p-2 ${location === "/sector-hunters" ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}>
              <span className="material-icons text-amber-500 mr-2">groups</span>
              <NavLink href="/sector-hunters">Chasseurs</NavLink>
            </li>
            
            <li className={`flex items-center p-2 ${location === "/sector-guides" ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}>
              <span className="material-icons text-blue-600 mr-2">supervisor_account</span>
              <NavLink href="/sector-guides">Guides de Chasse</NavLink>
            </li>
            
            <li className={`flex items-center p-2 ${location === "/profile" ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}>
              <span className="material-icons text-gray-600 mr-2">person</span>
              <NavLink href="/profile">Mon Profil</NavLink>
            </li>
          </>
        )}

        {user?.role === "hunter" && (
          <>
            <li className={`flex items-center p-2 ${location === "/hunter-dashboard" ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}>
              <span className="material-icons text-amber-500 mr-2">dashboard</span>
              <NavLink href="/hunter-dashboard">Tableau de Bord</NavLink>
            </li>
            
            <li className={`flex items-center p-2 ${location === "/hunter-permits" ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}>
              <span className="material-icons text-amber-500 mr-2">description</span>
              <NavLink href="/hunter-permits">Mes Permis</NavLink>
            </li>




          </>
        )}

        {/* Barre latérale pour les guides de chasse */}
        {user?.role === "guide" && (
          <>
            <li className={`flex items-center p-2 ${location === "/guide-dashboard" ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}>
              <span className="material-icons text-yellow-600 mr-2">home</span>
              <NavLink href="/guide-dashboard">Accueil</NavLink>
            </li>
            
            <li className={`flex items-center p-2 ${location === "/guide-hunters" ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}>
              <span className="material-icons text-yellow-600 mr-2">groups</span>
              <NavLink href="/guide-hunters">Mes Chasseurs</NavLink>
            </li>
            
            <li className={`flex items-center p-2 ${location === "/guide-activities" ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}>
              <span className="material-icons text-yellow-600 mr-2">assignment</span>
              <NavLink href="/guide-activities">Activités</NavLink>
            </li>
            
            <li className={`flex items-center p-2 ${location === "/guide-messages" ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}>
              <span className="material-icons text-yellow-600 mr-2">sms</span>
              <NavLink href="/guide-messages">Messagerie</NavLink>
            </li>
            
            <li className={`flex items-center p-2 ${location === "/profile" ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}>
              <span className="material-icons text-yellow-600 mr-2">person</span>
              <NavLink href="/profile">Mon Profil</NavLink>
            </li>
          </>
        )}
        
        {(user?.role === "hunter" || !user) && (
          <>
            <li className={`flex items-center p-2 ${location === "/myrequests" ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}>
              <span className="material-icons text-amber-500 mr-2">mail</span>
              <NavLink href="/myrequests">Mes demandes</NavLink>
            </li>
            <li className={`flex items-center p-2 ${location === "/hunting-reports" ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}>
              <span className="material-icons text-gray-600 mr-2">gps_fixed</span>
              <NavLink href="/hunting-reports">Déclaration d'abattage</NavLink>
            </li>
            <li className={`flex items-center p-2 ${location === "/hunting-activities" ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}>
              <span className="material-icons text-gray-600 mr-2">event</span>
              <NavLink href="/hunting-activities">Mes activités de chasse</NavLink>
            </li>
            <li className={`flex items-center p-2 ${location === "/profile" ? "bg-blue-500 text-white" : "hover:bg-blue-100"}`}>
              <span className="material-icons text-amber-500 mr-2">person</span>
              <NavLink href="/profile">Mon profil</NavLink>
            </li>
            {/* Historique supprimé pour les chasseurs */}
          </>
        )}
      </ul>
    </aside>
  );
}
