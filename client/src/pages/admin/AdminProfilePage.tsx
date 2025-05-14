import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ProfileCommon } from './ProfileCommon';

export default function AdminProfilePage() {
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

    const adminFields = [
        { label: 'Prénom', name: 'firstName', type: 'text' },
        { label: 'Nom', name: 'lastName', type: 'text' },
        { label: 'Email', name: 'email', type: 'text' },
        { label: 'Téléphone', name: 'phone', type: 'text' },
    ];

    return (
        <ProfileCommon
            title="Profil Administrateur"
            sections={[
                { title: 'Informations Personnelles', fields: adminFields },
            ]}
            onSubmit={onSubmit}
        />
    );
}