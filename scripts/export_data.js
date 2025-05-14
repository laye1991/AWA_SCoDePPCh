// Export database data script
// This script exports all data from your tables as JSON files
// This can be useful for importing into any database system

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../shared/schema.js';

dotenv.config();

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get database connection details from environment variables
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Error: DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Create the export directory
const exportDir = path.join(__dirname, '../db_export/data');
if (!fs.existsSync(path.join(__dirname, '../db_export'))) {
  fs.mkdirSync(path.join(__dirname, '../db_export'));
}
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir);
}

// Initialize database connection
const client = postgres(connectionString, { max: 1 });
const db = drizzle(client, { schema });

async function exportTables() {
  console.log('Starting data export...');
  
  // Get list of all tables
  const tables = [
    'users',
    'hunters',
    'permits',
    'taxes',
    'permit_requests',
    'hunting_reports',
    'hunted_species',
    'history',
    'hunting_guides',
    'guide_hunter_associations',
    'messages',
    'group_messages',
    'group_message_reads'
  ];
  
  // Export each table
  for (const tableName of tables) {
    try {
      console.log(`Exporting data from table: ${tableName}`);
      
      // Query all rows from the table
      const data = await client`SELECT * FROM ${client(tableName)}`;
      
      // Write data to JSON file
      const filePath = path.join(exportDir, `${tableName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      
      console.log(`Exported ${data.length} rows from ${tableName} to ${filePath}`);
    } catch (error) {
      console.error(`Error exporting table ${tableName}:`, error.message);
    }
  }
  
  console.log('Data export complete');
  
  // Create a README file with import instructions
  const readmePath = path.join(exportDir, 'README.md');
  const readmeContent = `# Database Data Export

## Files
This directory contains JSON files with data exported from your database tables.

## How to Import
You can use these JSON files to import data into any database system:

1. For PostgreSQL, you can use the \`COPY\` command with JSON format:
   \`\`\`sql
   COPY table_name FROM '/path/to/table_name.json' WITH (FORMAT json);
   \`\`\`

2. For programmatic import, you can write a script using your ORM of choice to read these JSON files and insert the data.

3. Example import script (Node.js with Drizzle ORM):
   \`\`\`javascript
   import fs from 'fs';
   import { db } from './your-db-connection.js';
   import { tableName } from './your-schema.js';
   
   async function importData() {
     const data = JSON.parse(fs.readFileSync('./db_export/data/table_name.json'));
     for (const row of data) {
       await db.insert(tableName).values(row);
     }
   }
   
   importData().catch(console.error);
   \`\`\`

## Important Notes
- The data is exported without any transformations
- Make sure your database schema is identical before importing
- For tables with foreign key constraints, import in the correct order
- You may need to disable and re-enable constraints during import
`;

  fs.writeFileSync(readmePath, readmeContent);
  console.log(`Created README with import instructions at: ${readmePath}`);
  
  // Close the database connection
  await client.end();
}

// Run the export
exportTables().catch(error => {
  console.error('Export failed:', error);
  process.exit(1);
});