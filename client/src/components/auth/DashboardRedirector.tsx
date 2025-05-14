import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import Dashboard from '@/pages/Dashboard';
import AgentDashboard from '@/pages/AgentDashboard';
import SectorDashboard from '@/pages/AgentsDashboard/SectorDashboard';
import HuntingDashboard from '@/pages/HuntingDashboard';

/**
 * Composant qui redirige vers le tableau de bord approprié en fonction du rôle de l'utilisateur
 * Utilisé principalement pour traiter l'ancienne URL /dashboard-admin
 */
export default function DashboardRedirector() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      // Rediriger vers la bonne page selon le rôle
      switch (user.role) {
        case 'admin':
          setLocation('/dashboard');
          break;
        case 'agent':
          if (user.type === 'secteur') {
            setLocation('/sector-dashboard');
          } else {
            setLocation('/agent-dashboard');
          }
          break;
        case 'sub-agent':
          setLocation('/sector-dashboard');
          break;
        case 'hunter':
          setLocation('/hunter-dashboard');
          break;
        case 'guide':
          setLocation('/guide-dashboard');
          break;
        default:
          setLocation('/login');
      }
    } else {
      setLocation('/login');
    }
  }, [user, setLocation]);

  // Afficher un indicateur de chargement pendant la redirection
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600 mb-4"></div>
      <p className="text-gray-500">Redirection en cours...</p>
    </div>
  );
}
