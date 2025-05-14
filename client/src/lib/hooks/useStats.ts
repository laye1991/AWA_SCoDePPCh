
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export interface Stats {
  activePermits: number;
  expiredPermits: number;
  activeHunters: number;
  totalTaxes: number;
  hunterCount: number;
  permitCount: number;
  revenue: number;
  activePermitCount: number;
  expiredPermitCount: number;
  campaignSettings: {
    startDate: string;
    endDate: string;
    status: string;
    quotas: {
      [key: string]: number;
    };
    regions: string[];
  };
}

export interface Stats {
  activePermits: number;
  expiredPermits: number;
  activeHunters: number;
  totalTaxes: number;
  hunterCount: number;
  permitCount: number;
  revenue: number;
  activePermitCount: number;
  expiredPermitCount: number;
  campaignSettings: {
    startDate: string;
    endDate: string;
    status: string;
    quotas: {
      [key: string]: number;
    };
    regions: string[];
  };
}

export function useStats() {
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useQuery<Stats>({
    queryKey: ['/api/stats'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/stats');
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des statistiques');
        }
        return response.json();
      } catch (err) {
        toast({
          title: "Erreur",
          description: "Impossible de charger les statistiques",
          variant: "destructive",
        });
        throw err;
      }
    },
    refetchInterval: 60000, // 1 minute
    staleTime: 55000, // 55 seconds
    gcTime: 65000, // 65 seconds (previously cacheTime)
    refetchOnWindowFocus: false,
    retry: 1,
    refetchOnMount: false,
  });

  return {
    stats: data,
    loading: isLoading,
    error,
    refetch,
  };
}
