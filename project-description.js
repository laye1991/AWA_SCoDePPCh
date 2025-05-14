import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Create a new document
const doc = new jsPDF();

// Add title
doc.setFontSize(20);
doc.setTextColor(0, 51, 102);
doc.text("Système de Gestion des Permis de Chasse au Sénégal", 105, 20, null, null, "center");

// Add logo placeholder
doc.setDrawColor(200, 200, 200);
doc.setLineWidth(0.5);
doc.rect(15, 25, 30, 30);
doc.setFontSize(8);
doc.setTextColor(150, 150, 150);
doc.text("Logo", 30, 40, null, null, "center");

// Introduction text
doc.setFontSize(12);
doc.setTextColor(0, 0, 0);
doc.text("Présentation du Projet", 15, 65);

doc.setFontSize(10);
doc.text(
  "Ce document présente le système de gestion numérique des permis de chasse au Sénégal, " +
  "développé pour moderniser le processus de délivrance et de suivi des permis de chasse dans le pays. " +
  "Ce système vise à améliorer l'efficacité administrative, renforcer le contrôle des activités de chasse, " +
  "et favoriser une gestion durable de la faune.",
  15, 75, { maxWidth: 180 }
);

// Objectifs du projet
doc.setFontSize(12);
doc.text("Objectifs du Projet", 15, 95);

let objectifs = [
  "Digitaliser le processus de demande et de délivrance des permis de chasse",
  "Centraliser les données sur les chasseurs et les permis",
  "Améliorer le suivi des activités de chasse",
  "Faciliter la perception des taxes et redevances",
  "Renforcer le contrôle et la réglementation de la chasse",
  "Contribuer à la conservation de la faune"
];

let yPosition = 105;
objectifs.forEach(obj => {
  doc.setFontSize(10);
  doc.text("• " + obj, 20, yPosition);
  yPosition += 7;
});

// Fonctionnalités clés
doc.setFontSize(12);
doc.text("Fonctionnalités Clés", 15, yPosition + 5);

doc.autoTable({
  startY: yPosition + 10,
  head: [['Module', 'Description']],
  body: [
    ['Gestion des Chasseurs', 'Enregistrement des chasseurs avec leurs informations personnelles et professionnelles'],
    ['Gestion des Permis', 'Création, renouvellement et suivi des permis de chasse'],
    ['Taxes Cynégétiques', 'Gestion des taxes pour les espèces comme le phacochère'],
    ['Déclarations de Chasse', 'Système de déclaration des animaux abattus avec géolocalisation'],
    ['Statistiques & Rapports', 'Tableaux de bord pour le suivi des activités et des revenus'],
    ['Gestion des Utilisateurs', 'Administration des comptes utilisateurs avec différents niveaux d\'accès'],
  ],
  theme: 'grid',
  headStyles: { fillColor: [0, 71, 171], textColor: [255, 255, 255] },
  alternateRowStyles: { fillColor: [240, 240, 240] },
  margin: { left: 15, right: 15 }
});

// Add a new page
doc.addPage();

// Data model heading
doc.setFontSize(12);
doc.setTextColor(0, 0, 0);
doc.text("Modèle de Données", 15, 20);

doc.setFontSize(10);
doc.text(
  "Le système repose sur un modèle de données relationnel complet qui permet " +
  "de suivre tous les aspects de la gestion des permis de chasse :",
  15, 30, { maxWidth: 180 }
);

// Data model tables
doc.autoTable({
  startY: 40,
  head: [['Entité', 'Rôle dans le Système']],
  body: [
    ['Utilisateurs (Users)', 'Gestion des comptes avec différents rôles (admin, chasseur, agent)'],
    ['Chasseurs (Hunters)', 'Stockage des informations personnelles et des armes des chasseurs'],
    ['Permis (Permits)', 'Suivi des permis de chasse avec leurs catégories et validités'],
    ['Taxes (Taxes)', 'Gestion des taxes cynégétiques, particulièrement pour le phacochère'],
    ['Demandes de Permis', 'Traitement des demandes de nouveaux permis ou renouvellements'],
    ['Rapports de Chasse', 'Déclarations des activités de chasse et des animaux abattus'],
    ['Espèces Chassées', 'Détail des espèces abattues lors des sessions de chasse'],
    ['Historique', 'Suivi de toutes les opérations effectuées dans le système']
  ],
  theme: 'grid',
  headStyles: { fillColor: [0, 71, 171], textColor: [255, 255, 255] },
  alternateRowStyles: { fillColor: [240, 240, 240] },
  margin: { left: 15, right: 15 }
});

// Types of permits
doc.setFontSize(12);
doc.text("Types de Permis de Chasse", 15, 120);

doc.autoTable({
  startY: 130,
  head: [['Catégorie', 'Types']],
  body: [
    ['Petite Chasse', 'Sportif Résident, Sportif Touriste (1 semaine, 2 semaines, 1 mois), Coutumier'],
    ['Grande Chasse', 'Résident, Touriste (1 semaine, 2 semaines, 1 mois)'],
    ['Gibier d\'Eau', 'Résident, Touriste (1 semaine, 1 mois)']
  ],
  theme: 'grid',
  headStyles: { fillColor: [0, 71, 171], textColor: [255, 255, 255] },
  alternateRowStyles: { fillColor: [240, 240, 240] },
  margin: { left: 15, right: 15 }
});

// Technical stack
doc.setFontSize(12);
doc.text("Architecture Technique", 15, 170);

doc.autoTable({
  startY: 180,
  head: [['Composant', 'Technologies']],
  body: [
    ['Frontend', 'React.js, TypeScript, TailwindCSS, Shadcn UI'],
    ['Backend', 'Node.js, Express'],
    ['Base de Données', 'PostgreSQL'],
    ['ORM', 'Drizzle ORM'],
    ['Validation', 'Zod'],
    ['Authentification', 'Passport.js'],
    ['Visualisation', 'Recharts pour les graphiques statistiques'],
    ['Cartographie', 'Intégration géospatiale pour le suivi des activités']
  ],
  theme: 'grid',
  headStyles: { fillColor: [0, 71, 171], textColor: [255, 255, 255] },
  alternateRowStyles: { fillColor: [240, 240, 240] },
  margin: { left: 15, right: 15 }
});

// Add a new page
doc.addPage();

// Workflow section
doc.setFontSize(12);
doc.setTextColor(0, 0, 0);
doc.text("Flux de Travail et Processus", 15, 20);

doc.setFontSize(10);
doc.text(
  "Le système suit plusieurs processus métier clés pour la gestion des permis de chasse :",
  15, 30, { maxWidth: 180 }
);

// Workflow diagram (simplified text version)
let workflows = [
  "1. Enregistrement d'un chasseur → Validation des informations → Création du profil",
  "2. Demande de permis → Vérification → Approbation/Rejet → Délivrance du permis",
  "3. Paiement des taxes → Génération de la quittance → Mise à jour du registre",
  "4. Déclaration de chasse → Enregistrement des captures → Mise à jour des statistiques",
  "5. Expiration du permis → Notification → Renouvellement"
];

yPosition = 40;
workflows.forEach(wf => {
  doc.setFontSize(10);
  doc.text(wf, 20, yPosition, { maxWidth: 170 });
  yPosition += 10;
});

// Regional coverage
doc.setFontSize(12);
doc.text("Couverture Géographique", 15, yPosition + 5);

doc.setFontSize(10);
doc.text(
  "Le système couvre l'ensemble du territoire sénégalais, avec une attention particulière aux zones de chasse suivantes :",
  15, yPosition + 15, { maxWidth: 180 }
);

// Regions
let regions = [
  "• Zones d'Intérêt Cynégétique (ZIC) : Djeuss, Niombato, Baobolong, Falémé",
  "• Zones amodiées",
  "• Zones de chasse sur l'ensemble du territoire national",
  "• Couverture des 14 régions administratives du Sénégal"
];

yPosition += 25;
regions.forEach(reg => {
  doc.text(reg, 20, yPosition);
  yPosition += 7;
});

// Benefits section
doc.setFontSize(12);
doc.text("Bénéfices et Impact", 15, yPosition + 5);

let benefits = [
  "• Digitalisation complète du processus administratif",
  "• Réduction des fraudes et meilleure traçabilité",
  "• Meilleure collecte des revenus issus des permis et taxes",
  "• Données statistiques fiables pour la conservation",
  "• Expérience utilisateur améliorée pour les chasseurs",
  "• Communication facilitée entre les acteurs",
  "• Support des décisions basées sur des données réelles"
];

yPosition += 15;
benefits.forEach(ben => {
  doc.setFontSize(10);
  doc.text(ben, 20, yPosition);
  yPosition += 7;
});

// Future developments
doc.setFontSize(12);
doc.text("Perspectives d'Évolution", 15, yPosition + 5);

doc.setFontSize(10);
doc.text(
  "Le système est conçu pour évoluer et intégrer de nouvelles fonctionnalités comme :",
  15, yPosition + 15, { maxWidth: 180 }
);

let evolutions = [
  "• Application mobile pour les déclarations de chasse sur le terrain",
  "• Intégration avec les systèmes de paiement mobiles",
  "• Module de gestion des zones de chasse et des quotas",
  "• Système d'alerte pour la lutte contre le braconnage",
  "• Fonctionnalités avancées de reporting pour la recherche scientifique"
];

yPosition += 25;
evolutions.forEach(evo => {
  doc.text(evo, 20, yPosition);
  yPosition += 7;
});

// Footer with date
doc.setFontSize(8);
doc.setTextColor(100, 100, 100);
doc.text("Document généré le " + new Date().toLocaleDateString("fr-FR"), 105, 280, null, null, "center");
doc.text("Projet de Gestion des Permis de Chasse - Sénégal - 2025", 105, 285, null, null, "center");

// Save the PDF
doc.save('Systeme_Gestion_Permis_Chasse_Senegal.pdf');

console.log("PDF généré avec succès!");