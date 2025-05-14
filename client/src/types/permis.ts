export enum TypePermisSpecial {
  PETITE_CHASSE_RESIDENT = 'PETITE_CHASSE_RESIDENT',
  PETITE_CHASSE_COUTUMIER = 'PETITE_CHASSE_COUTUMIER',
  GRANDE_CHASSE = 'GRANDE_CHASSE',
  GIBIER_EAU = 'GIBIER_EAU',
  SCIENTIFIQUE = 'SCIENTIFIQUE',
  CAPTURE_COMMERCIALE = 'CAPTURE_COMMERCIALE',
  OISELLERIE = 'OISELLERIE',
}

export type TypeDemande = 
  | 'NOUVELLE'
  | 'RENOUVELLEMENT'
  | 'DUPLICATA'
  | 'MIGRATION_COUTUMIER';

export type StatutDemande = 
  | 'NOUVELLE'
  | 'AFFECTEE'
  | 'RDV_PLANIFIE'
  | 'DOCUMENTS_VERIFIES'
  | 'VALIDEE'
  | 'REJETEE';

export interface DocumentJoint {
  id: string;
  type: string;
  url: string;
  dateDepot: Date;
  name?: string;
}

export interface DemandePermisSpecial {
  id: string;
  chasseurId: string;
  type: TypePermisSpecial;
  typeDemande: TypeDemande;
  statut: StatutDemande;
  dateCreation: string;
  dateModification: string;
  documents: DocumentJoint[];
  commentaires?: string;
  agentId?: string;
  dateValidation?: string;
  pointRecuperation?: PointRecuperation;
  // Pour les demandes de migration
  ancienPermisId?: string;
  motifMigration?: string;
  lieuRetrait?: {
    type: 'REGIONAL' | 'SECTEUR';
    id: string;
    nom: string;
  };
  validePar?: string;
  motifRejet?: string;
}

export interface PointRecuperation {
  id: string;
  type: 'REGIONAL' | 'SECTEUR';
  nom: string;
  adresse: string;
  contact: string;
  horaires: string;
  permisDisponibles: TypePermisSpecial[];
}
