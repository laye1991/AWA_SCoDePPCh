import { pgTable, text, serial, integer, boolean, date, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enum pour les rôles utilisateur
export const userRoleEnum = pgEnum('user_role', ['admin', 'hunter', 'agent', 'sub-agent', 'hunting-guide']);

// User schema (utilisé pour l'authentification)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  matricule: text("matricule"),
  serviceLocation: text("service_location"), // Inspection Régionale des Eaux et Forêts, Direction des Eaux et Forêts
  // assignmentPost supprimé selon la demande
  region: text("region"),
  zone: text("zone"),
  role: userRoleEnum("role").notNull().default('hunter'),
  hunterId: integer("hunter_id"),
  isActive: boolean("is_active").notNull().default(true),
  isSuspended: boolean("is_suspended").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  isActive: true,
  isSuspended: true,
  createdAt: true,
});

// Enum pour les types d'armes
export const weaponTypeEnum = pgEnum('weapon_type', ['fusil', 'carabine', 'arbalete', 'arc', 'lance-pierre', 'autre']);

// Table pour les tuteurs des chasseurs mineurs
export const guardians = pgTable("guardians", {
  id: serial("id").primaryKey(),
  lastName: text("last_name").notNull(),
  firstName: text("first_name").notNull(),
  idNumber: text("id_number").notNull().unique(), // Numéro de pièce d'identité du tuteur
  relationship: text("relationship").notNull(), // Relation avec le mineur (parent, tuteur légal, etc.)
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGuardianSchema = createInsertSchema(guardians).omit({
  id: true,
  createdAt: true,
});

// Hunter schema
export const hunters = pgTable("hunters", {
  id: serial("id").primaryKey(),
  lastName: text("last_name").notNull(),
  firstName: text("first_name").notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  idNumber: text("id_number").notNull().unique(),
  phone: text("phone"),
  address: text("address").notNull(),
  experience: integer("experience").notNull(),
  profession: text("profession").notNull(),
  category: text("category").notNull(), // 'resident', 'coutumier', 'touriste'
  pays: text("pays"), // Pays d'émission de la pièce d'identité
  nationality: text("nationality"), // Nationalité déduite du pays d'émission de la pièce d'identité
  region: text("region"), // Région de résidence du chasseur
  zone: text("zone"), // Zone/secteur du chasseur (peut être utilisé pour le filtrage)
  // Informations sur les armes
  weaponType: weaponTypeEnum("weapon_type"),
  weaponBrand: text("weapon_brand"),
  weaponReference: text("weapon_reference"),
  weaponCaliber: text("weapon_caliber"),
  weaponOtherDetails: text("weapon_other_details"),
  isMinor: boolean("is_minor").notNull().default(false), // Indique si le chasseur est mineur
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertHunterSchema = createInsertSchema(hunters).omit({
  id: true,
  isActive: true,
  createdAt: true,
  isMinor: true, // On exclut is_minor pour le définir par défaut à false
}).extend({
  dateOfBirth: z.string().or(z.date().transform(d => d.toISOString().split('T')[0])),
  phone: z.string().optional()
});

// Permit schema
export const permits = pgTable("permits", {
  id: serial("id").primaryKey(),
  permitNumber: text("permit_number").notNull().unique(),
  hunterId: integer("hunter_id").notNull(),
  issueDate: date("issue_date").notNull(),
  expiryDate: date("expiry_date").notNull(),
  status: text("status").notNull(), // 'active', 'expired', 'suspended'
  price: numeric("price").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  type: text("type"),
  categoryId: text("category_id"), // ID de la catégorie pour distinguer Coutumier, etc.
  receiptNumber: text("receipt_number"),
  area: text("area"),
  weapons: text("weapons"),
});

export const insertPermitSchema = createInsertSchema(permits).omit({
  id: true,
  createdAt: true,
}).extend({
  permitNumber: z.string(),
  hunterId: z.number(),
  issueDate: z.string().or(z.date()),
  expiryDate: z.string().or(z.date()),
  status: z.string(),
  price: z.number().or(z.string().transform(val => parseFloat(val))),
});

// Tax schema for hunting taxes (Phacochère/warthog)
export const taxes = pgTable("taxes", {
  id: serial("id").primaryKey(),
  taxNumber: text("tax_number").notNull().unique(),
  hunterId: integer("hunter_id").notNull(),
  permitId: integer("permit_id"),  // Peut être null pour les chasseurs externes
  amount: numeric("amount").notNull(),
  issueDate: date("issue_date").notNull(),
  animalType: text("animal_type").notNull(), // e.g., "phacochère"
  quantity: integer("quantity").notNull(),
  location: text("location").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Ajout pour les chasseurs externes (sans permis)
  externalHunterName: text("external_hunter_name"),
  externalHunterRegion: text("external_hunter_region"),
});

export const insertTaxSchema = createInsertSchema(taxes).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.number().or(z.string().transform(val => parseFloat(val))),
  issueDate: z.string().or(z.date()),
  quantity: z.number().or(z.string().transform(val => parseInt(val))),
});

// Enum pour les statuts de demande de permis
export const permitRequestStatusEnum = pgEnum('permit_request_status', ['pending', 'approved', 'rejected']);

// Table pour les demandes de permis
export const permitRequests = pgTable("permit_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  hunterId: integer("hunter_id").notNull(),
  requestedType: text("requested_type").notNull(), // 'petite-chasse', 'grande-chasse', 'gibier-eau'
  requestedCategory: text("requested_category").notNull(), // 'resident', 'coutumier', 'touriste'
  region: text("region"), 
  status: permitRequestStatusEnum("status").notNull().default('pending'),
  reason: text("reason"), // Raison de la demande
  notes: text("notes"), // Notes administratives (visible uniquement par les admins)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPermitRequestSchema = createInsertSchema(permitRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  notes: true,
});

// Table pour les déclarations d'animaux abattus
export const huntingReports = pgTable("hunting_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  hunterId: integer("hunter_id").notNull(),
  permitId: integer("permit_id").notNull(),
  reportDate: date("report_date").notNull(),
  location: text("location").notNull(),
  latitude: numeric("latitude"),
  longitude: numeric("longitude"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertHuntingReportSchema = createInsertSchema(huntingReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  reportDate: z.string().or(z.date()),
  longitude: z.number().or(z.string().transform(val => parseFloat(val))).optional(),
  latitude: z.number().or(z.string().transform(val => parseFloat(val))).optional()
});

// Table pour les détails des animaux abattus (liée aux rapports)
export const huntedSpecies = pgTable("hunted_species", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull(),
  speciesName: text("species_name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertHuntedSpeciesSchema = createInsertSchema(huntedSpecies).omit({
  id: true,
  createdAt: true,
}).extend({
  quantity: z.number().or(z.string().transform(val => parseInt(val)))
});

// Enum pour les zones géographiques
export const regionEnum = pgEnum('region', ['dakar', 'thies', 'saint-louis', 'louga', 'fatick', 'kaolack', 'kaffrine', 'matam', 'tambacounda', 'kedougou', 'kolda', 'sedhiou', 'ziguinchor', 'diourbel']);

// Mapping pour l'affichage des régions en majuscules
export const regionDisplayNames = {
  'dakar': 'DAKAR',
  'thies': 'THIÈS',
  'saint-louis': 'SAINT-LOUIS',
  'louga': 'LOUGA',
  'fatick': 'FATICK',
  'kaolack': 'KAOLACK',
  'kaffrine': 'KAFFRINE',
  'matam': 'MATAM',
  'tambacounda': 'TAMBACOUNDA',
  'kedougou': 'KÉDOUGOU',
  'kolda': 'KOLDA',
  'sedhiou': 'SÉDHIOU',
  'ziguinchor': 'ZIGUINCHOR',
  'diourbel': 'DIOURBEL'
};

// History for tracking operations
export const history = pgTable("history", {
  id: serial("id").primaryKey(),
  operation: text("operation").notNull(), // 'create', 'update', 'delete', 'renew', 'suspend'
  entityType: text("entity_type").notNull(), // 'hunter', 'permit', 'tax', 'user', 'report', 'request'
  entityId: integer("entity_id").notNull(),
  details: text("details").notNull(),
  userId: integer("user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertHistorySchema = createInsertSchema(history).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertGuardian = z.infer<typeof insertGuardianSchema>;
export type Guardian = typeof guardians.$inferSelect;

export type InsertHunter = z.infer<typeof insertHunterSchema>;
export type Hunter = typeof hunters.$inferSelect;

export type InsertPermit = z.infer<typeof insertPermitSchema>;
export type Permit = typeof permits.$inferSelect;

export type InsertTax = z.infer<typeof insertTaxSchema>;
export type Tax = typeof taxes.$inferSelect;

export type InsertPermitRequest = z.infer<typeof insertPermitRequestSchema>;
export type PermitRequest = typeof permitRequests.$inferSelect;

export type InsertHuntingReport = z.infer<typeof insertHuntingReportSchema>;
export type HuntingReport = typeof huntingReports.$inferSelect;

export type InsertHuntedSpecies = z.infer<typeof insertHuntedSpeciesSchema>;
export type HuntedSpecies = typeof huntedSpecies.$inferSelect;

export type InsertHistory = z.infer<typeof insertHistorySchema>;
export type History = typeof history.$inferSelect;

// Table pour les guides de chasse
export const huntingGuides = pgTable("hunting_guides", {
  id: serial("id").primaryKey(),
  lastName: text("last_name").notNull(),
  firstName: text("first_name").notNull(),
  phone: text("phone").notNull(),
  zone: text("zone").notNull(),
  region: text("region").notNull(),
  idNumber: text("id_number").notNull().unique(),
  photo: text("photo"),
  userId: integer("user_id"), // ID utilisateur associé (si un compte est créé)
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Guide-Hunter Associations schema
export const guideHunterAssociations = pgTable("guide_hunter_associations", {
  id: serial("id").primaryKey(),
  guideId: integer("guide_id").notNull(),
  hunterId: integer("hunter_id").notNull(),
  associatedAt: timestamp("associated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertHuntingGuideSchema = createInsertSchema(huntingGuides).omit({
  id: true,
  isActive: true,
  createdAt: true,
});

export const createHuntingGuideWithUserSchema = insertHuntingGuideSchema.extend({
  username: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  email: z.string().email("Adresse email invalide"),
  zoneManagerInfo: z.string().optional(), // Pour stocker les infos du responsable de zone au format JSON
});

export type InsertHuntingGuide = z.infer<typeof insertHuntingGuideSchema>;
export type HuntingGuide = typeof huntingGuides.$inferSelect;
export type CreateHuntingGuideWithUser = z.infer<typeof createHuntingGuideWithUserSchema>;

export const insertGuideHunterAssociationSchema = createInsertSchema(guideHunterAssociations).omit({
  id: true,
  associatedAt: true,
  createdAt: true,
});

export type InsertGuideHunterAssociation = z.infer<typeof insertGuideHunterAssociationSchema>;
export type GuideHunterAssociation = typeof guideHunterAssociations.$inferSelect;

// Enum pour les types de messages
export const messageTypeEnum = pgEnum('message_type', ['standard', 'urgent', 'information', 'notification']);

// Table pour les messages internes
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(), // ID de l'utilisateur qui envoie le message
  recipientId: integer("recipient_id").notNull(), // ID de l'utilisateur destinataire
  subject: text("subject"), // Sujet du message (optionnel)
  content: text("content").notNull(), // Contenu du message
  type: messageTypeEnum("type").notNull().default('standard'),
  isRead: boolean("is_read").notNull().default(false), // Si le message a été lu
  isDeleted: boolean("is_deleted").notNull().default(false), // Soft delete
  isDeletedBySender: boolean("is_deleted_by_sender").notNull().default(false), // Si supprimé par l'expéditeur
  parentMessageId: integer("parent_message_id"), // Pour les réponses/conversations
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  isRead: true, 
  isDeleted: true,
  isDeletedBySender: true,
  createdAt: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Table pour les messages groupés/diffusion
export const groupMessages = pgTable("group_messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(), // ID de l'utilisateur qui envoie le message
  targetRole: text("target_role"), // Rôle ciblé ('admin', 'agent', 'hunter', 'sub-agent', 'hunting-guide', etc.)
  targetRegion: text("target_region"), // Région ciblée (si applicable)
  subject: text("subject"), // Sujet du message (optionnel)
  content: text("content").notNull(), // Contenu du message
  type: messageTypeEnum("type").notNull().default('standard'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGroupMessageSchema = createInsertSchema(groupMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertGroupMessage = z.infer<typeof insertGroupMessageSchema>;
export type GroupMessage = typeof groupMessages.$inferSelect;

// Table de lecture pour les messages groupés
export const groupMessageReads = pgTable("group_message_reads", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull(), // ID du message de groupe
  userId: integer("user_id").notNull(), // ID de l'utilisateur qui a lu le message
  isRead: boolean("is_read").notNull().default(true),
  isDeleted: boolean("is_deleted").notNull().default(false),
  readAt: timestamp("read_at").defaultNow().notNull(),
});

export const insertGroupMessageReadSchema = createInsertSchema(groupMessageReads).omit({
  id: true,
  readAt: true,
});

export type InsertGroupMessageRead = z.infer<typeof insertGroupMessageReadSchema>;
export type GroupMessageRead = typeof groupMessageReads.$inferSelect;

// Table pour les paramètres de la campagne cynégétique
export const huntingCampaigns = pgTable("hunting_campaigns", {
  id: serial("id").primaryKey(),
  startDate: date("start_date").notNull(),  // Date d'ouverture de la campagne
  endDate: date("end_date").notNull(),      // Date de fermeture de la campagne
  year: text("year").notNull(),             // Année de la campagne (ex: "2025-2026")
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),                     // Notes éventuelles sur la campagne
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertHuntingCampaignSchema = createInsertSchema(huntingCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertHuntingCampaign = z.infer<typeof insertHuntingCampaignSchema>;
export type HuntingCampaign = typeof huntingCampaigns.$inferSelect;

// Mise à jour des interfaces pour les API (utilisées par le frontend)
export interface MessageWithSender extends Message {
  sender: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
}

export interface GroupMessageWithSender extends GroupMessage {
  sender: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
  isRead?: boolean; // Pour le lecteur actuel
}