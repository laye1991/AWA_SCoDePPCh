// Ce script corrige les erreurs spécifiques dans routes.ts
const fs = require('fs');

const fileName = './server/routes.ts';
let content = fs.readFileSync(fileName, 'utf8');

// Correction 1: Redéclaration de "permit" (ligne ~1178)
// Recherche de motif très spécifique pour cibler uniquement la deuxième déclaration
const patternPermit = /\/\/ Vérifier que le permis existe\s+const permit = await storage\.getPermit\(id\);\s+if \(!permit\) {\s+return res\.status\(404\)\.json\({ message: "Permis non trouvé" }\);\s+}/g;
content = content.replace(patternPermit, '// Le permis existe déjà, vérifié ci-dessus');

// Correction 2: Restaurer la logique pour utiliser la date de fermeture de campagne pour les permis
// Cette correction n'est pas nécessaire car elle était déjà en place, selon vos explications

// Correction 3: S'assurer que les routes pour les guides de chasse sont ajoutées avant le return createServer(app)
// Vérifions si ces routes existent déjà
if (content.indexOf('/api/guides') === -1) {
  const guidesAPI = `
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
`;

  // Insertion juste avant la fin de la fonction registerRoutes
  content = content.replace('  return createServer(app);\n}', guidesAPI + '\n  return createServer(app);\n}');
}

// Correction 4: S'assurer qu'il n'y a pas d'accolade fermante superflue à la fin du fichier
// Coupons tout contenu après la fin normale de la fonction registerRoutes
const endPattern = '  return createServer(app);\n}';
const endIndex = content.indexOf(endPattern) + endPattern.length;
content = content.substring(0, endIndex);

// Écrire les modifications
fs.writeFileSync(fileName, content, 'utf8');
console.log('Corrections appliquées au fichier routes.ts. Démarrez le serveur avec npm run dev.');
