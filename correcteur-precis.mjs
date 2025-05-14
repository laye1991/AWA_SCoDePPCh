// Script pour corriger précisément la redéclaration de variable permit à la ligne ~1186
import fs from 'fs';

const fileName = './server/routes.ts';
let content = fs.readFileSync(fileName, 'utf8');

// Diviser le contenu en lignes pour un traitement plus précis
const lines = content.split('\n');

// Chercher la ligne avec la redéclaration de permit autour de la ligne 1186
let firstPermitDeclarationLine = -1;
let secondPermitDeclarationLine = -1;
let inCriticalBlock = false;
let blockStartLine = -1;

// Parcourir les lignes pour trouver le bloc problématique
for (let i = 1180; i < 1200; i++) {
  if (i >= lines.length) break;
  
  if (lines[i].includes('const permit = await storage.getPermit') && !inCriticalBlock) {
    firstPermitDeclarationLine = i;
    inCriticalBlock = true;
    blockStartLine = i;
  } else if (lines[i].includes('const permit = await storage.getPermit') && inCriticalBlock) {
    secondPermitDeclarationLine = i;
    console.log(`Redéclaration de permit trouvée aux lignes ${firstPermitDeclarationLine + 1} et ${secondPermitDeclarationLine + 1}`);
    
    // Modifier la seconde déclaration pour éviter la redéclaration
    lines[secondPermitDeclarationLine] = lines[secondPermitDeclarationLine].replace('const permit', 'const existingPermit');
    
    // Adapter toutes les références à permit dans le même bloc qui suit cette déclaration
    let j = secondPermitDeclarationLine + 1;
    while (j < lines.length && !lines[j].includes('});')) {
      if (lines[j].includes('if (!permit)')) {
        lines[j] = lines[j].replace('if (!permit)', 'if (!existingPermit)');
      } else if (lines[j].includes('permit.')) {
        lines[j] = lines[j].replace(/permit\./g, 'existingPermit.');
      }
      j++;
    }
    
    break;
  }
  
  // Détecter la fin du bloc actuel
  if (inCriticalBlock && lines[i].includes('});')) {
    inCriticalBlock = false;
  }
}

// Si aucune redéclaration n'a été trouvée, vérifier toutes les déclarations dans le fichier
if (secondPermitDeclarationLine === -1) {
  console.log("Analyse de toutes les déclarations de permit dans le fichier...");
  const allPermitDeclarations = [];
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const permit = await storage.getPermit')) {
      allPermitDeclarations.push(i);
      console.log(`Déclaration de permit trouvée à la ligne ${i + 1}`);
    }
  }
  
  // Rechercher des déclarations proches les unes des autres dans la même fonction
  for (let i = 0; i < allPermitDeclarations.length; i++) {
    for (let j = i + 1; j < allPermitDeclarations.length; j++) {
      // Si deux déclarations sont à moins de 50 lignes d'écart, elles sont peut-être dans la même fonction
      if (allPermitDeclarations[j] - allPermitDeclarations[i] < 50) {
        console.log(`Déclarations potentiellement conflictuelles aux lignes ${allPermitDeclarations[i] + 1} et ${allPermitDeclarations[j] + 1}`);
        
        // Modifier la seconde déclaration pour éviter la redéclaration
        lines[allPermitDeclarations[j]] = lines[allPermitDeclarations[j]].replace('const permit', 'const existingPermit');
        
        // Adapter toutes les références à permit dans le même bloc qui suit cette déclaration
        let k = allPermitDeclarations[j] + 1;
        let blockEnded = false;
        while (k < lines.length && !blockEnded) {
          if (lines[k].includes('if (!permit)')) {
            lines[k] = lines[k].replace('if (!permit)', 'if (!existingPermit)');
          } else if (lines[k].includes('permit.')) {
            lines[k] = lines[k].replace(/permit\./g, 'existingPermit.');
          } else if (lines[k].includes('});')) {
            blockEnded = true;
          }
          k++;
        }
      }
    }
  }
}

// Reconstituer le contenu corrigé
const correctedContent = lines.join('\n');

// Écrire les modifications
fs.writeFileSync(fileName, correctedContent, 'utf8');
console.log('Correction de redéclaration de variable appliquée. Essayez de démarrer le serveur avec npm run dev.');
