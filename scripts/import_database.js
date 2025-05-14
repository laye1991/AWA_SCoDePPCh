// Import database script for PostgreSQL
// This script imports the schema and data from export files into a PostgreSQL database

import dotenv from 'dotenv';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

dotenv.config();

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Default export directory
const exportDir = path.join(__dirname, '../db_export');

// Get database connection from user or environment
function getDatabaseDetails() {
  return new Promise((resolve, reject) => {
    // Check if DATABASE_URL is already set
    if (process.env.DATABASE_URL) {
      console.log('Using DATABASE_URL from environment variables');
      const dbUrl = new URL(process.env.DATABASE_URL);
      
      resolve({
        host: dbUrl.hostname,
        port: dbUrl.port,
        database: dbUrl.pathname.substring(1),
        user: dbUrl.username,
        password: dbUrl.password
      });
    } else {
      // Ask for database details
      rl.question('PostgreSQL host (default: localhost): ', (host) => {
        host = host || 'localhost';
        
        rl.question('PostgreSQL port (default: 5432): ', (port) => {
          port = port || '5432';
          
          rl.question('Database name: ', (database) => {
            if (!database) {
              reject(new Error('Database name is required'));
              return;
            }
            
            rl.question('PostgreSQL username: ', (user) => {
              if (!user) {
                reject(new Error('Username is required'));
                return;
              }
              
              rl.question('PostgreSQL password: ', (password) => {
                resolve({ host, port, database, user, password });
              });
            });
          });
        });
      });
    }
  });
}

// Main function
async function importDatabase() {
  try {
    console.log('Database Import Utility');
    console.log('======================');
    
    // Check if export directory exists
    if (!fs.existsSync(exportDir)) {
      throw new Error(`Export directory not found: ${exportDir}`);
    }
    
    // Get database connection details
    const dbDetails = await getDatabaseDetails();
    
    // Check available export files
    console.log('\nChecking available export files...');
    
    const fullExportPath = path.join(exportDir, 'full_export.sql');
    const schemaPath = path.join(exportDir, 'schema.sql');
    const dataPath = path.join(exportDir, 'data.sql');
    
    const hasFullExport = fs.existsSync(fullExportPath);
    const hasSchema = fs.existsSync(schemaPath);
    const hasData = fs.existsSync(dataPath);
    
    if (!hasFullExport && !(hasSchema || hasData)) {
      throw new Error('No export files found. Run export scripts first.');
    }
    
    // Ask user which import method to use
    const importMethods = [];
    if (hasFullExport) importMethods.push('full');
    if (hasSchema && hasData) importMethods.push('separate');
    if (hasSchema) importMethods.push('schema');
    if (hasData) importMethods.push('data');
    
    const methodQuestion = `\nSelect import method:\n${
      importMethods.map((method, index) => `${index + 1}. ${
        method === 'full' ? 'Full export (schema + data)' :
        method === 'separate' ? 'Schema and data separately' :
        method === 'schema' ? 'Schema only' : 'Data only'
      }`).join('\n')
    }\nEnter number: `;
    
    const methodAnswer = await new Promise(resolve => rl.question(methodQuestion, resolve));
    const methodIndex = parseInt(methodAnswer) - 1;
    
    if (isNaN(methodIndex) || methodIndex < 0 || methodIndex >= importMethods.length) {
      throw new Error('Invalid option selected');
    }
    
    const method = importMethods[methodIndex];
    
    // Construct connection string for psql
    const dbConnString = `postgresql://${dbDetails.user}:${dbDetails.password}@${dbDetails.host}:${dbDetails.port}/${dbDetails.database}`;
    
    console.log(`\nStarting import using ${method} method...`);
    
    // Execute the import based on selected method
    if (method === 'full' || method === 'schema' || method === 'data') {
      let filePath;
      if (method === 'full') filePath = fullExportPath;
      else if (method === 'schema') filePath = schemaPath;
      else filePath = dataPath;
      
      const importCmd = `psql "${dbConnString}" -f "${filePath}"`;
      
      console.log(`Importing from ${filePath}...`);
      exec(importCmd, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error during import: ${error.message}`);
          process.exit(1);
        }
        
        console.log(stdout);
        if (stderr) console.error(stderr);
        
        console.log(`Import using ${method} method completed successfully!`);
        rl.close();
      });
    } else if (method === 'separate') {
      // Import schema first, then data
      const schemaCmd = `psql "${dbConnString}" -f "${schemaPath}"`;
      
      console.log('Importing schema...');
      exec(schemaCmd, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error importing schema: ${error.message}`);
          process.exit(1);
        }
        
        console.log(stdout);
        if (stderr) console.error(stderr);
        
        console.log('Schema import completed. Now importing data...');
        
        const dataCmd = `psql "${dbConnString}" -f "${dataPath}"`;
        exec(dataCmd, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error importing data: ${error.message}`);
            process.exit(1);
          }
          
          console.log(stdout);
          if (stderr) console.error(stderr);
          
          console.log('Data import completed successfully!');
          rl.close();
        });
      });
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    rl.close();
    process.exit(1);
  }
}

// Start the import process
importDatabase();