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
type Hunter = {
    id: number;
    name: string;
    firstName: string;
    lastName: string;
    region: string;
    permitCount: number;
    status: "active" | "inactive";
    lastActivity?: string;
};

type Permit = {
    id: number;
    hunterId: number;
    hunterName: string;
    type: string;
    startDate: string;
    endDate: string;
    status: "valid" | "expired" | "pending";
};

type Alert = {
    id: number;
    title: string;
    message: string;
    createdAt: string;
    isRead: boolean;
    category: "info" | "warning" | "danger";
};

export default function AgentDashboard() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [hunters, setHunters] = useState<Hunter[]>([]);
    const [permits, setPermits] = useState<Permit[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filtrer les données en fonction du rôle de l'utilisateur
    const filterDataByRole = (data: any[]) => {
        if (!user) return [];

        switch (user.role) {
            case 'admin':
                // Admin a accès à toutes les données
                return data;
            case 'regional-agent':
                // Agent régional: données de sa région
                return data.filter(item => item.region === user.region);
            case 'sector-agent':
                // Agent sectoriel: données de son secteur uniquement
                return data.filter(item => item.sector === user.sector);
            default:
                return [];
        }
    };

    useEffect(() => {
        document.title = "Espace Agent | SCoDePP_Ch";
    }, []);

    // Simuler des données pour le développement
    useEffect(() => {
        // Simuler des chasseurs
        const mockHunters: Hunter[] = [
            {
                id: 1,
                name: "Moussa Diop",
                firstName: "Moussa",
                lastName: "Diop",
                region: "Tambacounda",
                permitCount: 2,
                status: "active",
                lastActivity: "2025-04-05"
            },
            {
                id: 2,
                name: "Ahmed Sarr",
                firstName: "Ahmed",
                lastName: "Sarr",
                region: "Fatick",
                permitCount: 1,
                status: "inactive"
            },
            {
                id: 3,
                name: "Jean Mendy",
                firstName: "Jean",
                lastName: "Mendy",
                region: "Ziguinchor",
                permitCount: 3,
                status: "active",
                lastActivity: "2025-04-10"
            }
        ];

        // Simuler des permis
        const mockPermits: Permit[] = filterDataByRole([
            {
                id: 1,
                hunterId: 1,
                hunterName: "Moussa Diop",
                type: "Annuel",
                startDate: "2025-01-01",
                endDate: "2025-12-31",
                status: "valid",
                region: "Tambacounda",
                sector: "Tambacounda"
            },
            {
                id: 2,
                hunterId: 2,
                hunterName: "Ahmed Sarr",
                type: "Saison",
                startDate: "2025-04-01",
                endDate: "2025-06-30",
                status: "pending",
                region: "Fatick",
                sector: "Fatick"
            },
            {
                id: 3,
                hunterId: 3,
                hunterName: "Jean Mendy",
                type: "Annuel",
                startDate: "2025-01-01",
                endDate: "2025-12-31",
                status: "expired",
                region: "Ziguinchor",
                sector: "Ziguinchor"
            }
        ]);

        // Simuler des alertes
        const mockAlerts: Alert[] = [
            {
                id: 1,
                title: "Nouveaux permis",
                message: "5 nouveaux permis à valider pour votre région.",
                createdAt: "2025-04-07T10:30:00",
                isRead: false,
                category: "info"
            },
            {
                id: 2,
                title: "Alerte braconnage",
                message: "Activité suspecte signalée dans votre zone.",
                createdAt: "2025-04-10T08:15:00",
                isRead: true,
                category: "warning"
            },
            {
                id: 3,
                title: "Réunion",
                message: "Réunion mensuelle prévue demain à 10h.",
                createdAt: "2025-04-12T16:45:00",
                isRead: false,
                category: "danger"
            }
        ];

        setHunters(mockHunters);
        setPermits(mockPermits);
        setAlerts(mockAlerts);
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const filteredHunters = filterDataByRole(hunters).filter(hunter =>
        hunter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hunter.region.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <MainLayout>
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Tableau de bord Agent</h2>
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
                        <TabsTrigger value="hunters">
                            Chasseurs
                        </TabsTrigger>
                        <TabsTrigger value="permits">
                            Permis
                        </TabsTrigger>
                        <TabsTrigger value="alerts">
                            Alertes
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                        {/* Contenu de la vue d'ensemble */}
                    </TabsContent>

                    <TabsContent value="hunters">
                        {/* Contenu de la gestion des chasseurs */}
                    </TabsContent>

                    <TabsContent value="permits">
                        {/* Contenu de la gestion des permis */}
                    </TabsContent>

                    <TabsContent value="alerts">
                        {/* Contenu de la gestion des alertes */}
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    );
}