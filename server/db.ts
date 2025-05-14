import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
console.log("DATABASE_URL:", process.env.DATABASE_URL);

// Create the connection
const connectionString = process.env.DATABASE_URL || "";
const client = postgres(connectionString, { max: 1 });
export const db = drizzle(client, { schema });