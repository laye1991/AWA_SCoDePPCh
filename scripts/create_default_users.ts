// Script pour créer les utilisateurs par défaut (admin et agent)
import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function createDefaultUsers() {
  try {
    console.log("Création des comptes utilisateurs par défaut...");
    
    // Vérifier si l'admin existe déjà
    const existingAdmin = await db.query.users.findFirst({
      where: eq(users.username, 'admin')
    });
    
    if (!existingAdmin) {
      // Créer l'administrateur
      await db.insert(users).values({
        username: 'admin',
        password: 'password', // À changer en production
        email: 'admin@sigpe.sn',
        role: 'admin',
        isActive: true
      });
      console.log("Compte administrateur créé !");
    } else {
      console.log("Le compte administrateur existe déjà.");
    }
    
    // Vérifier si l'agent existe déjà
    const existingAgent = await db.query.users.findFirst({
      where: eq(users.username, 'agent')
    });
    
    if (!existingAgent) {
      // Créer l'agent
      await db.insert(users).values({
        username: 'agent',
        password: 'password', // À changer en production
        email: 'agent@sigpe.sn',
        role: 'agent',
        isActive: true
      });
      console.log("Compte agent créé !");
    } else {
      console.log("Le compte agent existe déjà.");
    }
    
    console.log("Utilisateurs par défaut créés avec succès !");
  } catch (error) {
    console.error("Erreur lors de la création des utilisateurs par défaut:", error);
  }
}

// Exécuter la fonction
createDefaultUsers()
  .then(() => {
    console.log("Script terminé");
    process.exit(0);
  })
  .catch(error => {
    console.error("Erreur:", error);
    process.exit(1);
  });