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
type User = {
    id: number;
    name: string;
    firstName: string;
    lastName: string;
    role: string;
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

export default function AdminDashboard() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [users, setUsers] = useState<User[]>([]);
    const [reports, setReports] = useState<Report[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        document.title = "Espace Administrateur | SCoDePP_Ch";
    }, []);

    // Simuler des données pour le développement
    useEffect(() => {
        // Simuler des utilisateurs
        const mockUsers: User[] = [
            {
                id: 1,
                name: "Admin Principal",
                firstName: "Admin",
                lastName: "Principal",
                role: "admin",
                status: "active",
                lastActivity: "2025-04-05"
            },
            {
                id: 2,
                name: "Agent Responsable",
                firstName: "Agent",
                lastName: "Responsable",
                role: "agent",
                status: "active"
            },
            {
                id: 3,
                name: "Guide Senior",
                firstName: "Guide",
                lastName: "Senior",
                role: "guide",
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
            },
            {
                id: 3,
                date: "2025-04-11",
                title: "Incident",
                content: "Signalement de braconnage",
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
            },
            {
                id: 3,
                title: "Maintenance",
                message: "Maintenance planifiée ce soir à 22h.",
                createdAt: "2025-04-12T16:45:00",
                isRead: false,
                category: "danger"
            }
        ];

        setUsers(mockUsers);
        setReports(mockReports);
        setAlerts(mockAlerts);
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <MainLayout>
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Tableau de bord Administrateur</h2>
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
                        <TabsTrigger value="users">
                            Utilisateurs
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

                    <TabsContent value="users">
                        {/* Contenu de la gestion des utilisateurs */}
                    </TabsContent>

                    <TabsContent value="reports">
                        {/* Contenu de la gestion des rapports */}
                    </TabsContent>

                    <TabsContent value="alerts">
                        {/* Contenu de la gestion des alertes */}
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    );
}