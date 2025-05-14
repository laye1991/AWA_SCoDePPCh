// Ce script effectue la migration de la base de données en appliquant le schema.ts

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from '../shared/schema';

const runMigration = async () => {
  // Connexion à la base de données
  console.log('Connexion à la base de données...');
  const connectionString = process.env.DATABASE_URL || '';
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql, { schema });
  
  try {
    console.log('Exécution des migrations directement avec schema.ts...');
    
    // Créer l'enum message_type s'il n'existe pas déjà
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_type') THEN
          CREATE TYPE message_type AS ENUM ('standard', 'urgent', 'information', 'notification');
        END IF;
      END
      $$;
    `;
    
    // Créer la table messages si elle n'existe pas
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL,
        recipient_id INTEGER NOT NULL,
        parent_message_id INTEGER,
        subject TEXT NOT NULL,
        content TEXT NOT NULL,
        type message_type DEFAULT 'standard',
        is_read BOOLEAN DEFAULT FALSE,
        is_deleted BOOLEAN DEFAULT FALSE,
        is_deleted_by_sender BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    // Créer la table group_messages si elle n'existe pas
    await sql`
      CREATE TABLE IF NOT EXISTS group_messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL,
        target_role TEXT NOT NULL,
        target_region TEXT,
        subject TEXT NOT NULL,
        content TEXT NOT NULL,
        type message_type DEFAULT 'standard',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    // Créer la table group_message_reads si elle n'existe pas
    await sql`
      CREATE TABLE IF NOT EXISTS group_message_reads (
        id SERIAL PRIMARY KEY,
        message_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        is_deleted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(message_id, user_id)
      );
    `;
    
    console.log('Migration terminée avec succès !');
  } catch (error) {
    console.error('Erreur lors de la migration :', error);
    process.exit(1);
  } finally {
    await sql.end();
    console.log('Déconnexion de la base de données.');
  }
};

runMigration().catch(console.error);