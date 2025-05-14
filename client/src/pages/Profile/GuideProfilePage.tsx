import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    UserRound, Calendar, MapPin, Phone, Mail, BadgeCheck, Clock,
    Save, Edit, Check, X, Briefcase, Target
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// TODO: Implémenter les spécificités des guides de chasse
// - Ajouter les champs spécifiques aux guides
// - Adapter les mutations API pour les guides

export default function GuideProfilePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [editMode, setEditMode] = useState(false);

    // Récupérer les informations détaillées du guide
    const { data: guideData, isLoading } = useQuery({
        queryKey: ['/api/guides', user?.guide?.id],
        queryFn: () => apiRequest({
            url: `/api/guides/${user?.guide?.id}`,
            method: 'GET',
        }),
        enabled: !!user?.guide?.id,
    });

    // État du formulaire
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        dateOfBirth: "",
        idNumber: "",
        nationality: "",
        profession: "",
        experience: 0,
        // Spécificités des guides
        certificationNumber: "",
        certificationDate: "",
        areasOfExpertise: "",
        languagesSpoken: "",
        // Informations sur l'équipement
        equipmentType: "",
        equipmentDetails: ""
    });

    // Mise à jour des données du formulaire
    useEffect(() => {
        if (user && guideData) {
            setFormData({
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                email: user.email || "",
                phone: guideData.phone || "",
                address: guideData.address || "",
                dateOfBirth: guideData.dateOfBirth ? new Date(guideData.dateOfBirth).toISOString().split('T')[0] : "",
                idNumber: guideData.idNumber || "",
                nationality: guideData.pays || "Sénégalaise",
                profession: guideData.profession || "",
                experience: guideData.experience || 0,
                // Spécificités des guides
                certificationNumber: guideData.certificationNumber || "",
                certificationDate: guideData.certificationDate || "",
                areasOfExpertise: guideData.areasOfExpertise || "",
                languagesSpoken: guideData.languagesSpoken || "",
                // Informations sur l'équipement
                equipmentType: guideData.equipmentType || "",
                equipmentDetails: guideData.equipmentDetails || ""
            });
        }
    }, [user, guideData]);

    // TODO: Implémenter les mutations et handlers spécifiques aux guides

    if (isLoading) {
        return (
            <div className="flex-1 p-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-3xl font-bold tracking-tight">
                    Profil du Guide de Chasse
                </h2>
                {!editMode ? (
                    <Button onClick={() => setEditMode(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Modifier
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setEditMode(false)}>
                            <X className="mr-2 h-4 w-4" />
                            Annuler
                        </Button>
                        <Button onClick={() => { }}>
                            <Save className="mr-2 h-4 w-4" />
                            Enregistrer
                        </Button>
                    </div>
                )}
            </div>

            {/* TODO: Implémenter le contenu spécifique aux guides */}
            <Card>
                <CardHeader>
                    <CardTitle>Informations Personnelles</CardTitle>
                    <CardDescription>
                        Ces informations sont utilisées pour votre identification.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Contenu du formulaire à implémenter */}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Certification et Compétences</CardTitle>
                    <CardDescription>
                        Vos qualifications et domaines d'expertise.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Contenu spécifique aux guides */}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Équipement</CardTitle>
                    <CardDescription>
                        Détails sur votre équipement de guidage.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Contenu spécifique à l'équipement */}
                </CardContent>
            </Card>
        </div>
    );
}