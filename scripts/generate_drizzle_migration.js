// Generate Drizzle migration script
// This script generates a complete SQL migration using Drizzle Kit

import dotenv from 'dotenv';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Generating Drizzle migration...');

// Create a directory for the migration output
const exportDir = path.join(__dirname, '../db_export');
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir);
}

// Run the drizzle-kit generate command to create migrations
const generateCmd = `npx drizzle-kit generate --dialect postgresql --schema=./shared/schema.ts --out=${exportDir}`;

exec(generateCmd, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error generating migration: ${error.message}`);
    return;
  }
  
  console.log('Migration generation output:');
  console.log(stdout);
  
  if (stderr) {
    console.error(`Migration generation stderr: ${stderr}`);
  }
  
  console.log(`\nMigration files have been generated in: ${exportDir}`);
  
  // Create a README file with instructions
  const readmePath = path.join(exportDir, 'README.md');
  const readmeContent = `# PostgreSQL Database Migration

## Files
This directory contains SQL migration files generated from your application schema.

## How to Import
To import this schema into a PostgreSQL database:

1. Create a new PostgreSQL database if needed:
   \`\`\`
   createdb your_database_name
   \`\`\`

2. Import the migration files using psql:
   \`\`\`
   psql -d your_database_name -f path/to/migration_file.sql
   \`\`\`

3. Apply all migrations in order by their timestamp.

## Using Drizzle ORM
If you're using Drizzle ORM in your new environment:

1. Configure your database connection in the new environment
2. Run \`npx drizzle-kit push:pg\` to apply the schema changes directly

## Important Notes
- Make sure to create any required database users and set appropriate permissions
- Update connection strings in your application to point to the new database
- Review the SQL before executing to ensure it's compatible with your target PostgreSQL version
`;

  fs.writeFileSync(readmePath, readmeContent);
  console.log(`Created README with import instructions at: ${readmePath}`);
});