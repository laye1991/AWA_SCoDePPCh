import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TypePermisSpecial, StatutDemande, DemandePermisSpecial } from '@/types/permis';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Clock, Check, X, AlertCircle } from 'lucide-react';
import { useLocation } from 'wouter';

const statutCouleurs = {
  NOUVELLE: 'bg-blue-100 text-blue-800',
  AFFECTEE: 'bg-purple-100 text-purple-800',
  RDV_PLANIFIE: 'bg-yellow-100 text-yellow-800',
  DOCUMENTS_VERIFIES: 'bg-indigo-100 text-indigo-800',
  VALIDEE: 'bg-green-100 text-green-800',
  REJETEE: 'bg-red-100 text-red-800',
};

const statutIcones = {
  NOUVELLE: <Clock className="h-4 w-4" />,
  AFFECTEE: <AlertCircle className="h-4 w-4" />,
  RDV_PLANIFIE: <Clock className="h-4 w-4" />,
  DOCUMENTS_VERIFIES: <Check className="h-4 w-4" />,
  VALIDEE: <Check className="h-4 w-4" />,
  REJETEE: <X className="h-4 w-4" />,
};

const typePermisLabels = {
  [TypePermisSpecial.PETITE_CHASSE_RESIDENT]: 'Petite Chasse (Résident)',
  [TypePermisSpecial.PETITE_CHASSE_COUTUMIER]: 'Petite Chasse (Coutumier)',
  [TypePermisSpecial.GRANDE_CHASSE]: 'Grande Chasse',
  [TypePermisSpecial.GIBIER_EAU]: 'Gibier d\'Eau',
  [TypePermisSpecial.SCIENTIFIQUE]: 'Scientifique',
  [TypePermisSpecial.CAPTURE_COMMERCIALE]: 'Capture Commerciale',
  [TypePermisSpecial.OISELLERIE]: 'Oisellerie',
};

const ListeDemandesPermis = () => {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [demandes, setDemandes] = useState<DemandePermisSpecial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDemandes = async () => {
      if (!user) return;
      
      try {
        // TODO: Remplacer par l'URL de l'API réelle
        const response = await fetch('/api/permis-speciaux/mes-demandes', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Erreur lors du chargement des demandes');
        }

        const data = await response.json();
        setDemandes(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDemandes();
  }, [user]);

  const getStatutBadge = (statut: StatutDemande) => (
    <div className="flex items-center">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statutCouleurs[statut]}`}>
        {statutIcones[statut]}
        <span className="ml-1">
          {statut.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')}
        </span>
      </span>
    </div>
  );

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mes demandes de permis spéciaux</h1>
          <p className="text-muted-foreground">
            Consultez l'état de vos demandes de permis spéciaux
          </p>
        </div>
        <Button onClick={() => navigate('/demande-permis-special')}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle demande
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <AlertCircle className="inline mr-2" />
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : demandes.length === 0 ? (
            <div className="text-center p-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium">Aucune demande</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Vous n'avez encore soumis aucune demande de permis spécial.
              </p>
              <div className="mt-6">
                <Button onClick={() => navigate('/demande-permis-special')}>
                  Nouvelle demande
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Type de permis</TableHead>
                  <TableHead>Date de demande</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demandes.map((demande) => (
                  <TableRow key={demande.id}>
                    <TableCell className="font-medium">#{demande.id.slice(0, 8)}</TableCell>
                    <TableCell>{typePermisLabels[demande.type] || demande.type}</TableCell>
                    <TableCell>
                      {new Date(demande.dateCreation).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </TableCell>
                    <TableCell>
                      {getStatutBadge(demande.statut)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate(`/demande-permis-special/${demande.id}`)}
                      >
                        Détails
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ListeDemandesPermis;
