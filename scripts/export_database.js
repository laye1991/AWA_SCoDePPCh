// Export database script for PostgreSQL
// This script exports the schema and data from your PostgreSQL database

import dotenv from 'dotenv';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get database connection details from environment variables
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('Error: DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Parse the connection string to extract database credentials
const dbUrlParts = new URL(dbUrl);
const dbUser = dbUrlParts.username;
const dbPassword = dbUrlParts.password;
const dbHost = dbUrlParts.hostname;
const dbPort = dbUrlParts.port;
const dbName = dbUrlParts.pathname.substring(1); // Remove leading slash

console.log('Database export starting...');
console.log(`Host: ${dbHost}, Port: ${dbPort}, Database: ${dbName}`);

// Create export directory if it doesn't exist
const exportDir = path.join(__dirname, '../db_export');
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir);
}

const schemaFilePath = path.join(exportDir, 'schema.sql');
const dataFilePath = path.join(exportDir, 'data.sql');
const fullExportFilePath = path.join(exportDir, 'full_export.sql');

// Export schema (structure only)
const schemaExportCmd = `PGPASSWORD="${dbPassword}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} --schema-only --no-owner --no-acl > ${schemaFilePath}`;

// Export data only
const dataExportCmd = `PGPASSWORD="${dbPassword}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} --data-only --no-owner --no-acl --inserts > ${dataFilePath}`;

// Full export (schema + data)
const fullExportCmd = `PGPASSWORD="${dbPassword}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} --no-owner --no-acl > ${fullExportFilePath}`;

// Execute the export commands
console.log('Exporting database schema...');
exec(schemaExportCmd, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error exporting schema: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Schema export stderr: ${stderr}`);
  }
  console.log('Schema export complete.');

  console.log('Exporting database data...');
  exec(dataExportCmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error exporting data: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Data export stderr: ${stderr}`);
    }
    console.log('Data export complete.');

    console.log('Creating full database export...');
    exec(fullExportCmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error creating full export: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Full export stderr: ${stderr}`);
      }
      console.log('Full database export complete.');
      console.log(`\nExport files:\n- Schema: ${schemaFilePath}\n- Data: ${dataFilePath}\n- Full Export: ${fullExportFilePath}`);
    });
  });
});