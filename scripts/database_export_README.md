# Database Export and Import Guide

This guide provides instructions on how to export your hunting permit management database from the current environment and import it into a new PostgreSQL database.

## Export Options

You have three scripts available for exporting your database:

### 1. Full PostgreSQL Export (`export_database.js`)

This script uses `pg_dump` to create a complete export of your database schema and data. It's ideal for PostgreSQL-to-PostgreSQL migrations.

```bash
node scripts/export_database.js
```

This will create three files in the `db_export` directory:
- `schema.sql` - Contains only the database structure
- `data.sql` - Contains only the data as INSERT statements
- `full_export.sql` - Contains both schema and data

### 2. Drizzle Schema Migration (`generate_drizzle_migration.js`)

This script uses Drizzle Kit to generate SQL migration files from your schema. It's useful when you want to apply the schema in a controlled manner.

```bash
node scripts/generate_drizzle_migration.js
```

This will create SQL migration files in the `db_export` directory.

### 3. Data-Only JSON Export (`export_data.js`)

This script exports all your data as JSON files, one per table. This format is useful for importing into any database system or for inspecting your data.

```bash
node scripts/export_data.js
```

This will create JSON files for each table in the `db_export/data` directory.

## Import Instructions

### Importing into PostgreSQL

1. Create a new PostgreSQL database:
   ```bash
   createdb your_database_name
   ```

2. Import the full export:
   ```bash
   psql -d your_database_name -f db_export/full_export.sql
   ```

   Or import schema and data separately:
   ```bash
   psql -d your_database_name -f db_export/schema.sql
   psql -d your_database_name -f db_export/data.sql
   ```

### Using Drizzle ORM in a New Environment

1. Install your project dependencies in the new environment
2. Configure the database connection (update your DATABASE_URL)
3. Use Drizzle CLI to push your schema:
   ```bash
   npx drizzle-kit push:pg
   ```

4. Use a script to import the JSON data:
   ```javascript
   // Example import script
   const fs = require('fs');
   const { db } = require('./your-db-connection');
   const schema = require('./your-schema');
   
   async function importData() {
     // Get list of table JSON files
     const files = fs.readdirSync('./db_export/data');
     
     // Import each table in the right order (handle dependencies)
     const tableOrder = [
       'users.json',
       'hunters.json',
       // Add other tables in the correct order
     ];
     
     for (const tableName of tableOrder) {
       if (!files.includes(tableName)) continue;
       
       console.log(`Importing ${tableName}...`);
       const data = JSON.parse(fs.readFileSync(`./db_export/data/${tableName}`));
       
       // Insert the data into the corresponding table
       const table = schema[tableName.replace('.json', '')];
       for (const row of data) {
         await db.insert(table).values(row);
       }
     }
   }
   
   importData().catch(console.error);
   ```

## Important Notes

1. **Environment Variables**: Make sure your DATABASE_URL environment variable is set correctly in both environments.

2. **PostgreSQL Version**: Ensure the target PostgreSQL version is compatible with your export.

3. **Foreign Keys**: When importing data, you may need to temporarily disable foreign key constraints:
   ```sql
   -- Disable foreign key checks before import
   SET session_replication_role = 'replica';
   
   -- Run your imports here
   
   -- Re-enable foreign key checks
   SET session_replication_role = 'origin';
   ```

4. **Data Order**: Import tables in the correct order to satisfy foreign key constraints (generally: users first, then hunters, etc.)

5. **Permissions**: Ensure the database user has appropriate permissions on the target database.

## Troubleshooting

- If you see "duplicate key value" errors, the target database may already contain some records.
- If you see "relation does not exist" errors, the schema wasn't correctly imported.
- If you see foreign key constraint errors, import your data in the correct order.

For any issues, check the PostgreSQL logs for more detailed error messages.