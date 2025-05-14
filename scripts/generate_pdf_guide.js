#!/usr/bin/env node

import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

async function checkDependencies() {
  return new Promise((resolve, reject) => {
    exec('npm list -g markdown-pdf', (error, stdout) => {
      const isInstalled = !stdout.includes('empty');
      resolve(isInstalled);
    });
  });
}

async function installDependencies() {
  console.log('Installation de markdown-pdf...');
  return new Promise((resolve, reject) => {
    exec('npm install -g markdown-pdf', (error, stdout, stderr) => {
      if (error) {
        console.error(`Erreur lors de l'installation: ${error.message}`);
        return reject(error);
      }
      console.log('markdown-pdf installé avec succès.');
      resolve();
    });
  });
}

async function generatePDF() {
  const guideMarkdownPath = path.join(rootDir, 'GUIDE_INSTALLATION.md');
  const guidePDFPath = path.join(rootDir, 'GUIDE_INSTALLATION_SCoDePP_Ch.pdf');
  
  console.log('Génération du PDF...');
  
  return new Promise((resolve, reject) => {
    exec(`markdown-pdf ${guideMarkdownPath} -o ${guidePDFPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Erreur lors de la génération du PDF: ${error.message}`);
        console.log('Conseil: Vous pouvez convertir manuellement le fichier GUIDE_INSTALLATION.md en PDF en utilisant:');
        console.log('- Une extension VSCode comme "Markdown PDF"');
        console.log('- Un service en ligne comme "md2pdf.netlify.app" ou "markdowntopdf.com"');
        return reject(error);
      }
      console.log(`PDF généré avec succès: ${guidePDFPath}`);
      resolve();
    });
  });
}

async function main() {
  console.log('Préparation du guide d\'installation en PDF...');
  
  try {
    // Vérifier si le guide Markdown existe
    await fs.access(path.join(rootDir, 'GUIDE_INSTALLATION.md'));
    
    // Vérifier et installer les dépendances si nécessaire
    const hasDependencies = await checkDependencies();
    if (!hasDependencies) {
      await installDependencies();
    }
    
    // Générer le PDF
    await generatePDF();
    
    console.log('\nLe guide d\'installation a été créé avec succès!');
    console.log('Vous pouvez maintenant utiliser ce fichier pour installer et configurer le projet sur votre ordinateur avec VSCode.');
  } catch (error) {
    console.error('Une erreur est survenue:', error.message);
  }
}

main();
