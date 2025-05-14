import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "../queryClient";

export function usePermits() {
  const { toast } = useToast();

  const {
    data: permits,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["/api/permits"],
    staleTime: 1000 * 30, // 30 seconds
    onError: (error) => {
      console.error("Error fetching permits:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les permis. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  return {
    permits,
    isLoading,
    error,
    refetch
  };
}

export function usePermitsByZone(zone: string | null) {
  const { toast } = useToast();
  const { permits: allPermits, isLoading, error } = usePermits();
  
  // Filtrer les permis par zone
  const permits = allPermits ? allPermits.filter(permit => 
    zone && permit.zone === zone
  ) : [];

  return {
    permits,
    isLoading,
    error,
  };
}

export function useHunterPermits(hunterId: number | null) {
  const { toast } = useToast();

  const {
    data: permits,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [`/api/permits/hunter/${hunterId}`],
    enabled: !!hunterId,
    staleTime: 1000 * 30, // 30 seconds
    onError: (error) => {
      console.error("Error fetching hunter permits:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les permis du chasseur.",
        variant: "destructive",
      });
    },
  });

  return {
    permits,
    isLoading,
    error,
    refetch
  };
}

export function usePermitDetails(permitId: number | null) {
  const { toast } = useToast();

  const {
    data: permit,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [`/api/permits/${permitId}`],
    enabled: !!permitId,
    staleTime: 1000 * 30, // 30 seconds
    onError: (error) => {
      console.error("Error fetching permit details:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails du permis.",
        variant: "destructive",
      });
    },
  });

  return {
    permit,
    isLoading,
    error,
    refetch
  };
}

export function useSuspendedPermits() {
  const { toast } = useToast();

  const {
    data: permits,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["/api/permits/suspended"],
    staleTime: 1000 * 30, // 30 seconds
    onError: (error) => {
      console.error("Error fetching suspended permits:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les permis suspendus. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  // Mutation pour supprimer un permis spécifique
  const deletePermitMutation = useMutation({
    mutationFn: async (permitId: number) => {
      const response = await apiRequest("DELETE", `/api/permits/${permitId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Le permis a été supprimé avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/permits/suspended"] });
      queryClient.invalidateQueries({ queryKey: ["/api/permits"] });
    },
    onError: (error) => {
      console.error("Error deleting permit:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le permis. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  // Mutation pour supprimer tous les permis suspendus
  const deleteAllSuspendedPermitsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/permits/suspended/all");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Tous les permis suspendus ont été supprimés avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/permits/suspended"] });
      queryClient.invalidateQueries({ queryKey: ["/api/permits"] });
    },
    onError: (error) => {
      console.error("Error deleting all suspended permits:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer tous les permis suspendus. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation pour supprimer un lot de permis
  const deleteBatchPermitsMutation = useMutation({
    mutationFn: async (permitIds: number[]) => {
      const response = await apiRequest("POST", "/api/permits/batch/delete", { permitIds });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Les permis sélectionnés ont été supprimés avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/permits/suspended"] });
      queryClient.invalidateQueries({ queryKey: ["/api/permits"] });
    },
    onError: (error) => {
      console.error("Error deleting batch permits:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer les permis sélectionnés. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  return {
    permits,
    isLoading,
    error,
    refetch,
    deletePermitMutation,
    deleteAllSuspendedPermitsMutation,
    deleteBatchPermitsMutation
  };
}