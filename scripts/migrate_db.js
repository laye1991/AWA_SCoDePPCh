#!/usr/bin/env node

import { exec } from 'child_process';
import { createInterface } from 'readline';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Charger les variables d'environnement
config();

// Valider la configuration de la base de données
if (!process.env.DATABASE_URL) {
  console.error('Erreur: Variable d\'environnement DATABASE_URL non définie dans le fichier .env');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, '..', 'migrations');

// Créer le répertoire des migrations s'il n'existe pas
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
  console.log('Répertoire des migrations créé avec succès');
}

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

// Fonction pour exécuter une commande avec promesse
function execPromise(command) {
  return new Promise((resolve, reject) => {
    console.log(`Exécution de la commande: ${command}`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Erreur: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.error(`Stderr: ${stderr}`);
      }
      console.log(`Stdout: ${stdout}`);
      resolve(stdout);
    });
  });
}

// Menu principal pour les migrations
async function showMenu() {
  console.log('\n===== Outil de migration de base de données AWA =====');
  console.log('1. Générer une migration à partir des modifications du schéma');
  console.log('2. Appliquer les migrations à la base de données');
  console.log('3. Afficher les tables existantes');
  console.log('4. Synchroniser la base de données avec le schéma (ATTENTION: peut supprimer des données)');
  console.log('5. Créer une sauvegarde de la base de données');
  console.log('6. Quitter');

  rl.question('\nChoisissez une option (1-6): ', async (answer) => {
    switch (answer.trim()) {
      case '1':
        await generateMigration();
        break;
      case '2':
        await applyMigrations();
        break;
      case '3':
        await showTables();
        break;
      case '4':
        await syncDatabase();
        break;
      case '5':
        await backupDatabase();
        break;
      case '6':
        console.log('Au revoir!');
        rl.close();
        return;
      default:
        console.log('Option non valide. Veuillez réessayer.');
        break;
    }
    showMenu();
  });
}

// Générer une migration à partir des modifications du schéma
async function generateMigration() {
  try {
    await execPromise('npx drizzle-kit generate:pg');
    console.log('\n✅ Migrations générées avec succès dans le répertoire "migrations"');
  } catch (error) {
    console.error('\n❌ Échec de la génération des migrations:', error);
  }
}

// Appliquer les migrations à la base de données
async function applyMigrations() {
  try {
    await execPromise('npx drizzle-kit push');
    console.log('\n✅ Migrations appliquées avec succès à la base de données AWA');
  } catch (error) {
    console.error('\n❌ Échec de l\'application des migrations:', error);
  }
}

// Afficher les tables existantes dans la base de données
async function showTables() {
  try {
    const command = `psql "${process.env.DATABASE_URL}" -c "\\dt"";
    await execPromise(command);
    console.log('\n✅ Tables listées avec succès');
  } catch (error) {
    console.error('\n❌ Échec de la récupération des tables:', error);
    console.log('Assurez-vous que psql est installé et accessible dans votre PATH.');
  }
}

// Synchroniser la base de données avec le schéma (mode dangereux, peut supprimer des données)
async function syncDatabase() {
  rl.question('\n⚠️ ATTENTION: Cette action peut supprimer des données. Êtes-vous sûr? (oui/non): ', async (answer) => {
    if (answer.toLowerCase() !== 'oui') {
      console.log('Opération annulée.');
      return;
    }
    
    try {
      await execPromise('npx drizzle-kit push --force');
      console.log('\n✅ Base de données synchronisée avec succès (mode destructif)');
    } catch (error) {
      console.error('\n❌ Échec de la synchronisation de la base de données:', error);
    }
  });
}

// Créer une sauvegarde de la base de données
async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `backup-awa-${timestamp}.sql`;
  
  try {
    const command = `pg_dump "${process.env.DATABASE_URL}" > ${backupFileName}`;
    await execPromise(command);
    console.log(`\n✅ Sauvegarde de la base de données créée avec succès: ${backupFileName}`);
  } catch (error) {
    console.error('\n❌ Échec de la sauvegarde de la base de données:', error);
    console.log('Assurez-vous que pg_dump est installé et accessible dans votre PATH.');
  }
}

// Démarrer le script
console.log('Bienvenue dans l\'outil de migration de la base de données AWA');
console.log(`URL de la base de données: ${process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@')}`);
showMenu();
