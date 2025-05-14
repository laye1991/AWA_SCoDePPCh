import { useEffect, lazy, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

// Import dynamique du composant de profil chasseur
const HunterProfilePage = lazy(() => import("../Hunter/HunterProfilePage"));

export default function ProfilePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    document.title = "Mon Profil | SCoDePP_Ch";
  }, []);

  if (!user) {
    return <div className="flex-1 flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-600"></div>
    </div>;
  }

  if (user.role === "hunter") {
    return (
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-600"></div>
        </div>
      }>
        <HunterProfilePage />
      </Suspense>
    );
  } else if (user.role === "admin" || user.role === "agent" || user.role === "sub-agent") {
    // Déterminer le titre en fonction du rôle
    let roleTitle = "Agent";
    if (user.role === "admin") {
      roleTitle = "Administrateur";
    } else if (user.role === "sub-agent") {
      roleTitle = "Agent Secteur";
    }

    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold tracking-tight">Profil {roleTitle}</h2>
        {/* Profil pour les administrateurs, agents et agents secteur */}
        {user.role !== "admin" && user.role !== "super-admin" && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Nom d'utilisateur</p>
              <p>{user.username}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p>{user.email}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Prénom</p>
              <p>{user.firstName || "Non défini"}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Nom</p>
              <p>{user.lastName || "Non défini"}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Téléphone</p>
              <p>{user.phone || "Non défini"}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Matricule</p>
              <p>{user.matricule || "Non défini"}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">{user.role === "sub-agent" ? "Secteur Forestier" : "Lieu de service"}</p>
              <p data-component-name="ProfilePage">{user.serviceLocation || user.sector || (user.department ? `Département de ${user.department}` : "Non défini")}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Poste d'affectation</p>
              <p>{user.assignmentPost || "Non défini"}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-500">Région</p>
              <p>{user.region || "Non défini"}</p>
            </div>
          </div>
        )}
      </div>
    );
  } else {
    navigate("/");
    return null;
  }
}