import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import type { Hunter } from "@shared/schema";

// Hook pour gérer les chasseurs
export function useHunters() {
  const queryClient = useQueryClient();

  // Récupérer tous les chasseurs
  const { data: allHunters = [], isLoading: huntersLoading, error } = useQuery({
    queryKey: ["/api/hunters"],
    queryFn: async () => {
      const response = await fetch('/api/hunters');
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des chasseurs');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Récupérer un chasseur par son ID
  const getHunter = (id: number) => {
    return useQuery({
      queryKey: ["/api/hunters", id],
      enabled: !!id,
    });
  };

  // Récupérer les chasseurs mineurs
  const getMinorHunters = () => {
    return useQuery({
      queryKey: ["/api/hunters/minors"],
    });
  };

  // Récupérer les chasseurs d'une région spécifique
  const getHuntersByRegion = (region: string) => {
    return useQuery({
      queryKey: ["/api/hunters/region", region],
      enabled: !!region,
    });
  };

  // Mutation pour marquer/démarquer un chasseur comme mineur
  const toggleMinorStatus = useMutation({
    mutationFn: async ({ hunterId, isMinor }: { hunterId: number; isMinor: boolean }) => {
      const response = await fetch(`/api/hunters/${hunterId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isMinor }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Une erreur est survenue lors de la mise à jour du statut mineur");
      }
      
      return response.json();
    },
    onSuccess: (updatedHunter) => {
      queryClient.invalidateQueries({ queryKey: ["/api/hunters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hunters/minors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hunters", updatedHunter.id] });
      toast({
        title: "Statut mineur mis à jour",
        description: `Le chasseur est maintenant ${updatedHunter.isMinor ? "marqué comme mineur" : "marqué comme adulte"}.`,
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    allHunters,
    huntersLoading,
    error,
    getHunter,
    getMinorHunters,
    getHuntersByRegion,
    toggleMinorStatus,
  };
}

// Hook spécifique pour les détails d'un chasseur et les opérations associées
export function useHunterDetails(hunterId: number) {
  const queryClient = useQueryClient();
  console.log("Démarrage du hook useHunterDetails avec l'ID:", hunterId);
  
  // Récupérer les détails du chasseur
  const { data: hunter, isLoading, error } = useQuery<Hunter>({
    queryKey: ["/api/hunters", hunterId],
    enabled: !!hunterId,
    queryFn: async ({ queryKey }) => {
      console.log("Exécution de la queryFn pour les détails du chasseur, queryKey:", queryKey);
      const url = `/api/hunters/${hunterId}`;
      console.log("URL de la requête:", url);
      
      const response = await fetch(url);
      console.log("Statut de la réponse:", response.status);
      
      if (!response.ok) {
        console.error("Erreur lors de la requête chasseur:", response.statusText);
        throw new Error("Erreur lors de la récupération du chasseur");
      }
      
      const data = await response.json();
      console.log("Données reçues du serveur pour le chasseur:", data);
      return data;
    },
  });

  // Mutation pour suspendre un chasseur
  const suspendHunter = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/hunters/${hunterId}/suspend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Une erreur est survenue lors de la suspension du chasseur");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hunters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hunters", hunterId] });
      toast({
        title: "Chasseur suspendu",
        description: "Le chasseur a été suspendu avec succès. Tous ses permis associés ont également été suspendus.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation pour réactiver un chasseur
  const reactivateHunter = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/hunters/${hunterId}/reactivate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Une erreur est survenue lors de la réactivation du chasseur");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hunters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hunters", hunterId] });
      toast({
        title: "Chasseur réactivé",
        description: "Le chasseur a été réactivé avec succès.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation pour supprimer un chasseur
  const deleteHunter = useMutation({
    mutationFn: async ({ id, force = false }: { id: number, force?: boolean }) => {
      console.log(`🗑️ Suppression du chasseur ID: ${id}, force=${force}`);
      const response = await fetch(`/api/hunters/${id}${force ? '?force=true' : ''}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Une erreur est survenue lors de la suppression du chasseur");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hunters"] });
      toast({
        title: "Chasseur supprimé",
        description: "Le chasseur a été supprimé avec succès.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation pour toggle le statut mineur
  const toggleMinorStatus = useMutation({
    mutationFn: async (isMinor: boolean) => {
      const response = await fetch(`/api/hunters/${hunterId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isMinor }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Une erreur est survenue lors de la modification du statut mineur");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hunters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hunters", hunterId] });
      toast({
        title: "Statut mis à jour",
        description: "Le statut mineur du chasseur a été mis à jour avec succès.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    hunter,
    isLoading,
    error,
    suspendHunter,
    suspendLoading: suspendHunter.isPending,
    reactivateHunter,
    reactivateLoading: reactivateHunter.isPending,
    deleteHunter,
    deleteLoading: deleteHunter.isPending,
    toggleMinorStatus,
  };
}

// Hooks spécifiques pour les listes de chasseurs par région ou zone
export function useHuntersByRegion(region: string | null) {
  const { data: hunters, isLoading, error } = useQuery({
    queryKey: ["/api/hunters/region", region],
    enabled: !!region,
  });

  return { hunters, isLoading, error };
}

export function useHuntersByZone(zone: string | null) {
  const { data: hunters, isLoading, error } = useQuery({
    queryKey: ["/api/hunters/zone", zone],
    enabled: !!zone,
  });

  return { hunters, isLoading, error };
}
