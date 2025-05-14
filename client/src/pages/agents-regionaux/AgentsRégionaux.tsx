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

// Types pour les agents régionaux
type RegionalAgent = {
    id: number;
    name: string;
    firstName: string;
    lastName: string;
    region: string;
    status: "active" | "inactive";
    lastActivity?: string;
};

type Report = {
    id: number;
    date: string;
    title: string;
    content: string;
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

export default function AgentsRégionaux() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [agents, setAgents] = useState<RegionalAgent[]>([]);
    const [reports, setReports] = useState<Report[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        document.title = "Espace Agents Régionaux | SCoDePP_Ch";
    }, []);

    // Simuler des données pour le développement
    useEffect(() => {
        // Simuler des agents régionaux
        const mockAgents: RegionalAgent[] = [
            {
                id: 1,
                name: "Agent Régional 1",
                firstName: "Agent",
                lastName: "Régional",
                region: "Dakar",
                status: "active",
                lastActivity: "2025-04-05"
            },
            {
                id: 2,
                name: "Agent Régional 2",
                firstName: "Agent",
                lastName: "Régional",
                region: "Thiès",
                status: "active"
            },
            {
                id: 3,
                name: "Agent Régional 3",
                firstName: "Agent",
                lastName: "Régional",
                region: "Saint-Louis",
                status: "inactive"
            }
        ];

        // Simuler des rapports
        const mockReports: Report[] = [
            {
                id: 1,
                date: "2025-04-08",
                title: "Rapport mensuel",
                content: "Activités du mois de mars",
                status: "approved"
            },
            {
                id: 2,
                date: "2025-04-10",
                title: "Demande de validation",
                content: "Nouveaux quotas de chasse",
                status: "pending"
            }
        ];

        // Simuler des alertes
        const mockAlerts: Alert[] = [
            {
                id: 1,
                title: "Mise à jour système",
                message: "Une nouvelle version du système est disponible.",
                createdAt: "2025-04-07T10:30:00",
                isRead: false,
                category: "info"
            },
            {
                id: 2,
                title: "Alerte sécurité",
                message: "Tentative de connexion suspecte détectée.",
                createdAt: "2025-04-10T08:15:00",
                isRead: true,
                category: "warning"
            }
        ];

        setAgents(mockAgents);
        setReports(mockReports);
        setAlerts(mockAlerts);
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const filteredAgents = agents.filter(agent =>
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.region.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <MainLayout>
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Tableau de bord Agents Régionaux</h2>
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
                        <TabsTrigger value="agents">
                            Agents
                        </TabsTrigger>
                        <TabsTrigger value="reports">
                            Rapports
                        </TabsTrigger>
                        <TabsTrigger value="alerts">
                            Alertes
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                        {/* Contenu de la vue d'ensemble */}
                    </TabsContent>

                    <TabsContent value="agents">
                        {/* Contenu des agents */}
                    </TabsContent>

                    <TabsContent value="reports">
                        {/* Contenu des rapports */}
                    </TabsContent>

                    <TabsContent value="alerts">
                        {/* Contenu des alertes */}
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    );
}