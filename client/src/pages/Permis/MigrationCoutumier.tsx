import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// Utilisation du type User du contexte d'authentification
import type { User } from '@/contexts/AuthContext';

export default function MigrationCoutumier() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [motif, setMotif] = useState('');
  const [documents, setDocuments] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocuments(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || user.role !== 'HUNTER' || !user.hunter || user.hunter.category !== 'resident') {
      toast({
        title: 'Action non autorisée',
        description: 'Seuls les chasseurs résidents peuvent demander une migration vers le statut coutumier.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('chasseurId', user.id.toString());
      formData.append('motif', motif);
      documents.forEach((file) => {
        formData.append('documents', file as Blob, file.name);
      });

      const response = await fetch('/api/permis/migration-coutumier', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la soumission de la demande');
      }

      toast({
        title: 'Demande soumise',
        description: 'Votre demande de migration vers le statut coutumier a été enregistrée.',
      });
      
      navigate('/mes-demandes', { replace: true });
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la soumission de votre demande.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Demande de migration vers le statut coutumier</CardTitle>
          <CardDescription>
            Remplissez ce formulaire pour demander votre migration vers le statut de chasseur coutumier.
            Seuls les chasseurs résidents peuvent effectuer cette démarche.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="motif">Motif de la demande</Label>
              <Textarea
                id="motif"
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Expliquez pourquoi vous demandez la migration vers le statut coutumier..."
                required
                minLength={20}
              />
              <p className="text-sm text-muted-foreground">
                Décrivez votre lien avec la zone de chasse (résidence, activités traditionnelles, etc.)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Pièces justificatives</Label>
              <Input
                type="file"
                multiple
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
              />
              <p className="text-sm text-muted-foreground">
                Fournissez des documents prouvant votre résidence ou votre attachement à la zone de chasse (justificatif de domicile, attestation du chef de village, etc.)
              </p>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  'Soumettre la demande'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
