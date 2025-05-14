import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtenir le chemin du répertoire actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const routesFile = path.join(__dirname, 'server', 'routes.ts');

// Lire le contenu du fichier
let content = fs.readFileSync(routesFile, 'utf8');

// Correction 1: Supprimer la redéclaration de "permit" à la ligne ~1184
content = content.replace(
  /\/\/ Vérifier que le permis existe\s+const permit = await storage\.getPermit\(id\);\s+if \(!permit\) {\s+return res\.status\(404\)\.json\({ message: "Permis non trouvé" }\);\s+}/g,
  '// Le permis a déjà été vérifié plus haut'
);

// Correction 2: S'assurer que la date d'expiration des permis utilise la date de fermeture de la campagne
content = content.replace(
  /\/\/ Calculer la date d'expiration à partir de la date d'émission \(1 an\)([\s\S]*?)expiryDate: expiryDate\.toISOString\(\)\.split\('T'\)\[0\],/,
  '// Utiliser la date de fermeture de la campagne comme date d\'expiration\n        expiryDate: campaignSettings.endDate,'
);

// Correction 3: Enlever toutes les lignes après la fin de la fonction registerRoutes
const endOfFunction = 'return createServer(app);\n}';
const endIndex = content.indexOf(endOfFunction) + endOfFunction.length;
content = content.substring(0, endIndex);

// Ajouter les routes pour les guides de chasse avant le return createServer(app)
const guidesRoute = `
  // Routes pour les guides de chasse
  app.get("/api/guides", async (req, res) => {
    try {
      const guides = await db.select().from(huntingGuides);
      res.json(guides);
    } catch (error) {
      console.error("Erreur lors de la récupération des guides de chasse:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des guides de chasse" });
    }
  });

  app.post("/api/guides", async (req, res) => {
    try {
      console.log("Received hunting guide creation request:", req.body);
      
      // Valider les données avec le schéma
      try {
        const validatedData = createHuntingGuideWithUserSchema.parse(req.body);
        
        // Créer un nouvel utilisateur pour le guide
        const userData = {
          username: validatedData.username,
          password: validatedData.password,
          email: validatedData.email || 'guide@example.com',
          role: 'guide',
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          phone: validatedData.phone,
          region: validatedData.region,
          serviceLocation: validatedData.zone,
          isActive: true,
          createdAt: new Date().toISOString()
        };
        
        // Créer l'utilisateur
        const user = await storage.createUser(userData);
        
        // Créer le guide de chasse
        const guideData = {
          userId: user.id,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          phone: validatedData.phone,
          zone: validatedData.zone,
          region: validatedData.region,
          idNumber: validatedData.idNumber,
          photo: validatedData.photo || null,
          status: 'active',
          createdAt: new Date().toISOString()
        };
        
        const guide = await db.insert(huntingGuides).values(guideData).returning();
        
        // Ajouter une entrée dans l'historique
        await storage.createHistory({
          userId: req.user?.id,
          operation: "create",
          entityType: "guide",
          entityId: guide[0].id,
          details: \`Guide de chasse créé: \${guide[0].firstName} \${guide[0].lastName}\`
        });
        
        res.status(201).json(guide[0]);
      } catch (validationError) {
        console.error("Guide validation error:", validationError);
        if (validationError instanceof z.ZodError) {
          return res.status(400).json({ 
            message: "Erreur de validation des données du guide", 
            errors: validationError.errors 
          });
        }
        throw validationError;
      }
    } catch (error) {
      console.error("Guide creation error:", error);
      res.status(500).json({ 
        message: "Échec de la création du guide de chasse",
        error: error instanceof Error ? error.message : "Erreur inconnue"
      });
    }
  });

  app.delete("/api/guides/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID de guide invalide" });
      }
      
      // Vérifier que le guide existe
      const guide = await storage.getHuntingGuide(id);
      if (!guide) {
        return res.status(404).json({ message: "Guide de chasse non trouvé" });
      }
      
      // Supprimer le guide
      await storage.deleteHuntingGuide(id);
      
      // Enregistrer dans l'historique
      await storage.createHistory({
        userId: req.user?.id, 
        operation: "delete",
        entityType: "guide",
        entityId: id,
        details: \`Guide de chasse supprimé: \${guide.firstName} \${guide.lastName}\`
      });
      
      res.status(200).json({ message: "Guide de chasse supprimé avec succès" });
    } catch (error) {
      console.error("Erreur lors de la suppression du guide:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

`;

// Insérer les routes des guides avant le return
content = content.replace('return createServer(app);', guidesRoute + '\n  return createServer(app);');

// Écrire le contenu corrigé dans le fichier
fs.writeFileSync(routesFile, content, 'utf8');

console.log('Le fichier routes.ts a été corrigé avec succès!');
