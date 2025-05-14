import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function useTaxes() {
  const { toast } = useToast();

  const {
    data: taxes,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["/api/taxes"],
    staleTime: 1000 * 60 * 5, // 5 minutes
    onError: (error) => {
      console.error("Error fetching taxes:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les taxes. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  return {
    taxes,
    isLoading,
    error,
    refetch
  };
}

export function useHunterTaxes(hunterId: number | null) {
  const { toast } = useToast();

  const {
    data: taxes,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [`/api/taxes/hunter/${hunterId}`],
    enabled: !!hunterId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    onError: (error) => {
      console.error("Error fetching hunter taxes:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les taxes du chasseur.",
        variant: "destructive",
      });
    },
  });

  return {
    taxes,
    isLoading,
    error,
    refetch
  };
}

export function usePermitTaxes(permitId: number | null) {
  const { toast } = useToast();

  const {
    data: taxes,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [`/api/taxes/permit/${permitId}`],
    enabled: !!permitId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    onError: (error) => {
      console.error("Error fetching permit taxes:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les taxes associées au permis.",
        variant: "destructive",
      });
    },
  });

  return {
    taxes,
    isLoading,
    error,
    refetch
  };
}

export function useTaxDetails(taxId: number | null) {
  const { toast } = useToast();

  const {
    data: tax,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [`/api/taxes/${taxId}`],
    enabled: !!taxId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    onError: (error) => {
      console.error("Error fetching tax details:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails de la taxe.",
        variant: "destructive",
      });
    },
  });

  return {
    tax,
    isLoading,
    error,
    refetch
  };
}
