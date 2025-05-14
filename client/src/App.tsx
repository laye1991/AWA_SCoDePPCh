import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import DashboardRedirector from "@/components/auth/DashboardRedirector";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/layout/MainLayout";

// Import des tableaux de bord par rôle
import AdminDashboard from "@/pages/admin/Dashboard";
import RegionalAgentDashboard from "@/pages/regional-agent/Dashboard";
import SectorAgentDashboard from "@/pages/sector-agent/Dashboard";
import HunterDashboard from "@/pages/Hunter/Dashboard";
import GuideDashboard from "@/pages/Guides/GuideDashboard";

// Import des pages communes
import Login from "@/pages/Login";
import RegisterForm from "@/components/auth/RegisterForm";
import Profile from "@/pages/Profile/ProfilePage";
import Settings from "@/pages/ConfigSysteme/Settings";
import MapPage from "@/pages/MapPage";

// Import des pages administratives
import Accounts from "@/pages/ConfigSysteme/Accounts";
import AdminHistory from "@/pages/Historique/AdminHistory";
import Agents from "@/pages/Profile/Agents";
import Hunters from "@/pages/Profile/Hunters";
import Permits from "@/pages/Permis/NewPermits";
import SuspendedPermits from "@/pages/Permis/SuspendedPermits";
import Taxes from "@/pages/Taxes";
import SMSPage from "@/pages/Messagerie/SimpleSMSPage";
import AgentsSecteur from "@/pages/agents-secteur/AgentsSecteur";
import Guides from "@/pages/Guides/Guides";
import GuidesList from "@/pages/Guides/GuidesList";

// Import des pages régionales
import RegionalStats from "@/pages/agents-regionaux/AgentsRégionaux";
import RegionalStatistics from "@/pages/agents-regionaux/AgentsRégionaux";
import RegionalSMSPage from "@/pages/Messagerie/RegionalSMSPage";
import RegionalGuides from "@/pages/Guides/GuidesList";
import SubAccounts from "@/pages/agents-regionaux/AgentsRégionaux";

// Import des pages secteur
import SectorGuides from "@/pages/Secteur/SectorGuides";
import SectorHunters from "@/pages/Secteur/SectorHunters";
import SectorSMSPage from "@/pages/Messagerie/SectorSMSPage";
import SectorPermits from "@/pages/Secteur/SectorPermits";
import SectorRequests from "@/pages/Secteur/SectorRequests";

// Import des pages chasseur/guide
import PermitRequestPage from "@/pages/Permis/PermitRequestPage";
import PermitRequest from "@/pages/Permis/PermitRequest";
import PermitRequestReception from "@/pages/Permis/PermitRequestReception";
import DemandePermisSpecial from "@/pages/Permis/DemandePermisSpecial";
import ListeDemandesPermis from "@/pages/Permis/ListeDemandesPermis";
import DetailDemandePermis from "@/pages/Permis/DetailDemandePermis";
import MigrationCoutumier from "@/pages/Permis/MigrationCoutumier";
import HuntingDeclarations from "@/pages/Activites chasse/HuntingDeclarations";
import MyHuntingPermits from "@/pages/Permis/MyHuntingPermits";
import HunterPermits from "@/pages/Permis/HunterPermits";
import MyRequests from "@/pages/Permis/MyRequests";
import HuntingActivities from "@/pages/Activites chasse/HuntingActivities";
import HuntingReports from "@/pages/Activites chasse/HuntingReports";
import AssociateHunters from "@/pages/Guides/AssociateHunters";
import AlertsPage from "@/pages/Messagerie/AlertsPage";
import History from "@/pages/Historique/History";

import { queryClient } from "./lib/queryClient";

function Router() {
  const [location] = useLocation();
  const { user } = useAuth();

  // Pages qui n'utilisent pas le layout principal
  const publicRoutes = ["/login", "/register"];
  const isPublicRoute = publicRoutes.some(route => location.startsWith(route));

  if (isPublicRoute) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={() => (
          <div className="min-h-screen bg-white">
            <RegisterForm userType={location.includes('guide') ? 'guide' : 'hunter'} />
          </div>
        )} />
      </Switch>
    );
  }

  return (
    <MainLayout>
      <Switch>
        {/* Redirection automatique vers le bon tableau de bord */}
        <Route path="/">
          <DashboardRedirector />
        </Route>
        
        {/* Tableaux de bord par rôle */}
        <Route path="/admin/dashboard">
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        </Route>
        
        <Route path="/regional-agent/dashboard">
          <ProtectedRoute allowedRoles={['agent']} allowedTypes={['regional']}>
            <RegionalAgentDashboard />
          </ProtectedRoute>
        </Route>
        
        <Route path="/sector-agent/dashboard">
          <ProtectedRoute allowedRoles={['agent']} allowedTypes={['secteur']}>
            <SectorAgentDashboard />
          </ProtectedRoute>
        </Route>
        
        <Route path="/hunter/dashboard">
          <ProtectedRoute allowedRoles={['hunter']}>
            <HunterDashboard />
          </ProtectedRoute>
        </Route>
        
        {/* Routes pour la gestion des permis spéciaux */}
        <Route path="/demande-permis-special">
          <ProtectedRoute allowedRoles={['hunter']}>
            <DemandePermisSpecial />
          </ProtectedRoute>
        </Route>
        <Route path="/mes-demandes">
          <ProtectedRoute allowedRoles={['hunter']}>
            <ListeDemandesPermis />
          </ProtectedRoute>
        </Route>
        <Route path="/demande-permis-special/:id">
          <ProtectedRoute allowedRoles={['hunter']}>
            <DetailDemandePermis />
          </ProtectedRoute>
        </Route>
        
        <Route path="/guide/dashboard">
          <ProtectedRoute allowedRoles={['hunting-guide']}>
            <GuideDashboard />
          </ProtectedRoute>
        </Route>
        
        {/* Anciennes routes de redirection pour la rétrocompatibilité */}
        <Route path="/dashboard-admin">
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        </Route>
        
        <Route path="/agent-dashboard">
          <ProtectedRoute allowedRoles={['agent']}>
            <RegionalAgentDashboard />
          </ProtectedRoute>
        </Route>
        
        <Route path="/sector-dashboard">
          <ProtectedRoute allowedRoles={['agent']}>
            <SectorAgentDashboard />
          </ProtectedRoute>
        </Route>
        
        {/* Routes pour les pages administratives */}
        <Route path="/settings">
          <ProtectedRoute adminOnly>
            <Settings />
          </ProtectedRoute>
        </Route>
        
        <Route path="/accounts">
          <ProtectedRoute adminOnly>
            <Accounts />
          </ProtectedRoute>
        </Route>
        
        <Route path="/admin/history">
          <ProtectedRoute adminOnly>
            <AdminHistory />
          </ProtectedRoute>
        </Route>
        
        <Route path="/agents">
          <ProtectedRoute adminOnly>
            <Agents />
          </ProtectedRoute>
        </Route>
        
        <Route path="/hunters">
          <ProtectedRoute adminOrAgentOnly>
            <Hunters />
          </ProtectedRoute>
        </Route>
        
        <Route path="/permits">
          <ProtectedRoute adminOrAgentOnly>
            <Permits />
          </ProtectedRoute>
        </Route>
        
        <Route path="/suspended-permits">
          <ProtectedRoute adminOnly>
            <SuspendedPermits />
          </ProtectedRoute>
        </Route>
        
        <Route path="/taxes">
          <ProtectedRoute adminOrAgentOrSubAgentOnly>
            <Taxes />
          </ProtectedRoute>
        </Route>
        
        <Route path="/history">
          <ProtectedRoute adminOrAgentOnly>
            <History />
          </ProtectedRoute>
        </Route>
        
        <Route path="/sms">
          <ProtectedRoute adminOrAgentOnly>
            <SMSPage />
          </ProtectedRoute>
        </Route>
        
        <Route path="/agents-secteur">
          <ProtectedRoute hunterOnly>
            <PermitRequest />
          </ProtectedRoute>
        </Route>
        <Route path="/permit-requests-reception">
          <ProtectedRoute adminOrAgentOnly>
            <PermitRequestReception />
          </ProtectedRoute>
        </Route>
        <Route path="/hunting-declarations">
          <ProtectedRoute hunterOnly>
            <HuntingDeclarations />
          </ProtectedRoute>
        </Route>
        <Route path="/agents">
          <ProtectedRoute adminOnly>
            <Agents />
          </ProtectedRoute>
        </Route>
        <Route path="/subaccounts">
          <ProtectedRoute agentOnly>
            <SubAccounts />
          </ProtectedRoute>
        </Route>
        <Route path="/regional-stats">
          <ProtectedRoute>
            <RegionalStats />
          </ProtectedRoute>
        </Route>
        <Route path="/statistics">
          <ProtectedRoute adminOrAgentOnly>
            <RegionalStatistics />
          </ProtectedRoute>
        </Route>
        <Route path="/regional-guides">
          <ProtectedRoute agentOnly>
            <RegionalGuides />
          </ProtectedRoute>
        </Route>
        <Route path="/regional-sms">
          <ProtectedRoute agentOnly>
            <RegionalSMSPage />
          </ProtectedRoute>
        </Route>
        <Route path="/agents-secteur">
          <ProtectedRoute agentOnly>
            <AgentsSecteur />
          </ProtectedRoute>
        </Route>
        <Route path="/sector-guides">
          <ProtectedRoute subAgentOnly>
            <SectorGuides />
          </ProtectedRoute>
        </Route>
        <Route path="/sector-hunters">
          <ProtectedRoute subAgentOnly>
            <SectorHunters />
          </ProtectedRoute>
        </Route>
        <Route path="/sector-sms">
          <ProtectedRoute subAgentOnly>
            <SectorSMSPage />
          </ProtectedRoute>
        </Route>
        <Route path="/sector-permits">
          <ProtectedRoute subAgentOnly>
            <SectorPermits />
          </ProtectedRoute>
        </Route>
        <Route path="/sector-requests">
          <ProtectedRoute subAgentOnly>
            <SectorRequests />
          </ProtectedRoute>
        </Route>
        <Route path="/map">
          <ProtectedRoute>
            <MapPage />
          </ProtectedRoute>
        </Route>
        <Route path="/alerts">
          <ProtectedRoute>
            <AlertsPage />
          </ProtectedRoute>
        </Route>
        <Route path="/profile">
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        </Route>
        <Route path="/mypermits">
          <ProtectedRoute hunterOnly>
            <MyHuntingPermits />
          </ProtectedRoute>
        </Route>
        <Route path="/hunter-permits">
          <ProtectedRoute hunterOnly>
            <HunterPermits />
          </ProtectedRoute>
        </Route>
        <Route path="/myrequests">
          <ProtectedRoute hunterOnly>
            <MyRequests />
          </ProtectedRoute>
        </Route>
        <Route path="/hunting-reports">
          <ProtectedRoute hunterOnly>
            <HuntingReports />
          </ProtectedRoute>
        </Route>
        <Route path="/hunting-activities">
          <ProtectedRoute hunterOnly>
            <HuntingActivities />
          </ProtectedRoute>
        </Route>
        <Route path="/historiquehunterscomptes">
          <ProtectedRoute hunterOnly>
            <History />
          </ProtectedRoute>
        </Route>
        <Route path="/guides/associate-hunters">
          <ProtectedRoute huntingGuideOnly>
            <AssociateHunters />
          </ProtectedRoute>
        </Route>
        <Route path="/guide-dashboard">
          <ProtectedRoute huntingGuideOnly>
            <GuideDashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/guides-management">
          <ProtectedRoute adminOnly>
            <GuidesList />
          </ProtectedRoute>
        </Route>
        <Route path="/suspended-permits">
          <ProtectedRoute adminOnly>
            <SuspendedPermits />
          </ProtectedRoute>
        </Route>
        <Route path="/hunter-dashboard">
          <ProtectedRoute hunterOnly>
            <HunterDashboard />
          </ProtectedRoute>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;