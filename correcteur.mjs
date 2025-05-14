// Ce script corrige les erreurs spécifiques dans routes.ts
import fs from 'fs';

const fileName = './server/routes.ts';
let content = fs.readFileSync(fileName, 'utf8');

// Correction 1: Redéclaration de "permit" (ligne ~3339)
// Recherche de motif très spécifique pour cibler uniquement la seconde déclaration
const patternPermit = /\/\/ Vérifier que le permis existe\s+const permit = await storage\.getPermit\(permitId\);\s+if \(!permit\) {\s+return res\.status\(404\)\.json\({ message: "Permis non trouvé" }\);\s+}/g;
content = content.replace(patternPermit, '// Le permis existe déjà, vérifié ci-dessus');

// Correction 2: Restaurer la logique pour utiliser la date de fermeture de campagne pour les permis
// Cette correction n'est pas nécessaire car elle était déjà en place

// Correction 3: Vérifier s'il y a des accolades déséquilibrées ou du code superflu à la fin du fichier
const endPattern = '  return createServer(app);\n}';
const endIndex = content.indexOf(endPattern) + endPattern.length;
if (endIndex > 0 && endIndex < content.length) {
  // Tronquer tout contenu après la fin normale de la fonction registerRoutes
  content = content.substring(0, endIndex);
  console.log('Contenu superflu détecté et retiré à la fin du fichier.');
}

// Écrire les modifications
fs.writeFileSync(fileName, content, 'utf8');
console.log('Corrections appliquées au fichier routes.ts. Démarrez le serveur avec npm run dev.');
