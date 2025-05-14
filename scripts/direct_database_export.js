// Direct PostgreSQL database export script
// This is a simplified script for exporting all data directly from the PostgreSQL database
// It works by using the PostgreSQL dump utility directly

import dotenv from 'dotenv';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if DATABASE_URL is defined
if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Create export directory
const exportDir = path.join(__dirname, '../db_export');
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir);
}

// Create the SQL export file
const exportFilePath = path.join(exportDir, 'database_export.sql');
console.log(`Creating PostgreSQL dump to: ${exportFilePath}`);

// Use pg_dump to export the database
const pgDumpCmd = `pg_dump "${process.env.DATABASE_URL}" --no-owner --no-acl > ${exportFilePath}`;

exec(pgDumpCmd, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error exporting database: ${error.message}`);
    // If pg_dump fails, it might not be installed or accessible
    console.error('Try installing PostgreSQL client tools if pg_dump is not available');
    process.exit(1);
  }
  
  if (stderr) {
    console.error(`Export stderr: ${stderr}`);
  }
  
  console.log(`PostgreSQL database successfully exported to: ${exportFilePath}`);
  
  // Create README with instructions
  const readmePath = path.join(exportDir, 'IMPORT_INSTRUCTIONS.md');
  const readmeContent = `# PostgreSQL Database Import Instructions

## Export File
- \`database_export.sql\`: Full database export with schema and data

## How to Import

### Option 1: Using psql (command line)
\`\`\`bash
# Create a new database (if needed)
createdb your_database_name

# Import the database
psql -d your_database_name -f database_export.sql
\`\`\`

### Option 2: Using a PostgreSQL GUI tool (like pgAdmin)
1. Open pgAdmin or your preferred PostgreSQL GUI tool
2. Connect to your PostgreSQL server
3. Create a new database (if needed)
4. Right-click on the database and select "Restore" or "Execute SQL"
5. Select the database_export.sql file
6. Run the import

## Notes
- This export contains both schema and data
- The export is created with --no-owner and --no-acl flags, which means ownership and permission settings are not included
- You may need to modify connection settings in your application to connect to the new database
`;

  fs.writeFileSync(readmePath, readmeContent);
  console.log(`Created import instructions at: ${readmePath}`);
});