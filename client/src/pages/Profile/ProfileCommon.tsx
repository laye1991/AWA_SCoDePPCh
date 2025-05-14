import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';

type ProfileField = {
    label: string;
    name: string;
    type: 'text' | 'select' | 'number';
    options?: { value: string; label: string }[];
};

type ProfileSection = {
    title: string;
    fields: ProfileField[];
};

export function ProfileCommon({
    title,
    sections,
    onSubmit,
    children,
}: {
    title: string;
    sections: ProfileSection[];
    onSubmit: (data: any) => Promise<void>;
    children?: ReactNode;
}) {
    const { toast } = useToast();
    const form = useForm();

    const handleSubmit = async (data: any) => {
        try {
            await onSubmit(data);
            toast({
                title: 'Profil mis à jour',
                description: 'Vos informations ont été mises à jour avec succès.',
            });
        } catch (error) {
            console.error('Erreur lors de la mise à jour du profil:', error);
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: 'Une erreur est survenue lors de la mise à jour du profil.',
            });
        }
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">{title}</h1>
            </div>

            <form onSubmit={form.handleSubmit(handleSubmit)}>
                {sections.map((section) => (
                    <Card key={section.title} className="mb-6">
                        <CardHeader>
                            <CardTitle>{section.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {section.fields.map((field) => (
                                    <div key={field.name}>
                                        <Label>{field.label}</Label>
                                        {field.type === 'select' ? (
                                            <Select onValueChange={(value) => form.setValue(field.name, value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={`Sélectionner ${field.label.toLowerCase()}`} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {field.options?.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Input
                                                type={field.type}
                                                {...form.register(field.name)}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {children}

                <div className="mt-4 flex justify-end">
                    <Button type="submit" className="flex items-center gap-2">
                        Enregistrer les modifications
                    </Button>
                </div>
            </form>
        </div>
    );
}