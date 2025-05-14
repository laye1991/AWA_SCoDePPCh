import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ProfileCommon } from './ProfileCommon';
import { departmentsByRegion } from "@/lib/constants";

export default function SectorAgentProfilePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);

    const onSubmit = async (data: any) => {
        try {
            setIsUpdating(true);
            await apiRequest({
                url: `/api/users/${user?.id}`,
                method: "PATCH",
                data,
            });

            toast({
                title: "Profil mis à jour",
                description: "Vos informations ont été mises à jour avec succès.",
            });
        } catch (error) {
            console.error("Erreur lors de la mise à jour du profil:", error);
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Une erreur est survenue lors de la mise à jour du profil.",
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const personalInfoFields = [
        { label: 'Prénom', name: 'firstName', type: 'text' },
        { label: 'Nom', name: 'lastName', type: 'text' },
        { label: 'Email', name: 'email', type: 'text' },
        { label: 'Téléphone', name: 'phone', type: 'text' },
        { label: 'Matricule', name: 'matricule', type: 'text' },
    ];

    const sectorFields = [
        {
            label: 'Secteur',
            name: 'sector',
            type: 'select',
            options: departmentsByRegion[user?.region as keyof typeof departmentsByRegion]?.map(dept =>
                ({ value: dept.value, label: dept.label }))
        },
    ];

    return (
        <ProfileCommon
            title="Profil Agent de Secteur"
            sections={[
                { title: 'Informations Personnelles', fields: personalInfoFields },
                { title: 'Affectation de Secteur', fields: sectorFields },
            ]}
            onSubmit={onSubmit}
        />
    );
}