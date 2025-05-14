import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
const envPath = path.resolve(process.cwd(), '.env');
console.log("Chemin du fichier .env:", envPath);
if (fs.existsSync(envPath)) {
  console.log("Fichier .env trouvé. Contenu:", fs.readFileSync(envPath, 'utf-8'));
} else {
  console.log("Fichier .env non trouvé !");
}
dotenv.config({ path: envPath });

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import session from "express-session";
import { User } from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    user: User;
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configurer la session
app.use(
  session({
    secret: "sigpe-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false, // en production, mettre à true si HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 heures
    }
  })
);

// Middleware pour rendre l'utilisateur de la session disponible via req.user
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.session.user) {
    req.user = req.session.user;
  }
  next();
});

app.use((req, res, next) => {
  // Disable caching for API routes
  if (req.path.startsWith('/api')) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
