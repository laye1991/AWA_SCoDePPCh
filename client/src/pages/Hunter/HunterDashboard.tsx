import { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
    Bell,
    Check,
    ChevronDown,
    Eye,
    FileText,
    Home,
    Info,
    LinkIcon,
    MoreHorizontal,
    PenLine,
    Search,
    Send,
    User,
    UserPlus,
    Users
} from "lucide-react";

// Types temporaires pour le développement de l'interface
type Permit = {
    id: number;
    type: string;
    startDate: string;
    endDate: string;
    status: "valid" | "expired" | "pending";
};

type HuntingActivity = {
    id: number;
    date: string;
    location: string;
    species: string;
    count: number;
    status: "pending" | "approved" | "rejected";
};

type Alert = {
    id: number;
    title: string;
    message: string;
    createdAt: string;
    isRead: boolean;
    category: "info" | "warning" | "danger";
};

export default function HunterDashboard() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [permits, setPermits] = useState<Permit[]>([]);
    const [activities, setActivities] = useState<HuntingActivity[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [selectedActivity, setSelectedActivity] = useState<HuntingActivity | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        document.title = "Espace Chasseur | SCoDePP_Ch";
    }, []);

    // Simuler des données pour le développement
    useEffect(() => {
        // Simuler des permis
        const mockPermits: Permit[] = [
            {
                id: 1,
                type: "Annuel",
                startDate: "2025-01-01",
                endDate: "2025-12-31",
                status: "valid"
            },
            {
                id: 2,
                type: "Saison",
                startDate: "2025-04-01",
                endDate: "2025-06-30",
                status: "pending"
            }
        ];

        // Simuler des activités de chasse
        const mockActivities: HuntingActivity[] = [
            {
                id: 1,
                date: "2025-04-08",
                location: "Forêt de Niokolo-Koba",
                species: "Phacochère",
                count: 1,
                status: "approved"
            },
            {
                id: 2,
                date: "2025-04-10",
                location: "Delta du Saloum",
                species: "Canard sauvage",
                count: 3,
                status: "pending"
            }
        ];

        // Simuler des alertes
        const mockAlerts: Alert[] = [
            {
                id: 1,
                title: "Mise à jour des quotas",
                message: "Les quotas pour la chasse au phacochère ont été mis à jour.",
                createdAt: "2025-04-07T10:30:00",
                isRead: false,
                category: "info"
            },
            {
                id: 2,
                title: "Alerte météo",
                message: "Conditions météorologiques défavorables prévues ce week-end.",
                createdAt: "2025-04-10T08:15:00",
                isRead: true,
                category: "warning"
            }
        ];

        setPermits(mockPermits);
        setActivities(mockActivities);
        setAlerts(mockAlerts);
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    return (
        <MainLayout>
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Tableau de bord Chasseur</h2>
                    <div className="flex items-center space-x-2">
                        <Input
                            placeholder="Rechercher..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="w-[250px]"
                        />
                    </div>
                </div>

                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="overview">
                            Vue d'ensemble
                        </TabsTrigger>
                        <TabsTrigger value="permits">
                            Permis
                        </TabsTrigger>
                        <TabsTrigger value="activities">
                            Activités
                        </TabsTrigger>
                        <TabsTrigger value="alerts">
                            Alertes
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                        {/* Contenu de la vue d'ensemble */}
                    </TabsContent>

                    <TabsContent value="permits">
                        {/* Contenu des permis */}
                    </TabsContent>

                    <TabsContent value="activities">
                        {/* Contenu des activités */}
                    </TabsContent>

                    <TabsContent value="alerts">
                        {/* Contenu des alertes */}
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    );
}