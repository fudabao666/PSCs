import {
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// News articles
export const news = mysqlTable("news", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 512 }).notNull(),
  summary: text("summary"),
  content: text("content"),
  sourceUrl: varchar("sourceUrl", { length: 1024 }),
  sourceName: varchar("sourceName", { length: 256 }),
  imageUrl: varchar("imageUrl", { length: 1024 }),
  category: mysqlEnum("category", ["domestic", "international", "research", "policy", "market", "technology"]).default("domestic").notNull(),
  tags: text("tags"), // JSON array of strings
  isImportant: boolean("isImportant").default(false).notNull(),
  publishedAt: timestamp("publishedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type News = typeof news.$inferSelect;
export type InsertNews = typeof news.$inferInsert;

// Tender / bidding information
export const tenders = mysqlTable("tenders", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description"),
  projectType: mysqlEnum("projectType", ["procurement", "construction", "research", "service", "other"]).default("procurement").notNull(),
  budget: varchar("budget", { length: 256 }),
  region: varchar("region", { length: 256 }),
  publisherName: varchar("publisherName", { length: 256 }),
  contactInfo: text("contactInfo"),
  sourceUrl: varchar("sourceUrl", { length: 1024 }),
  sourcePlatform: varchar("sourcePlatform", { length: 256 }),
  deadline: timestamp("deadline"),
  isImportant: boolean("isImportant").default(false).notNull(),
  status: mysqlEnum("status", ["open", "closed", "awarded", "cancelled"]).default("open").notNull(),
  publishedAt: timestamp("publishedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Tender = typeof tenders.$inferSelect;
export type InsertTender = typeof tenders.$inferInsert;

// Manufacturers
export const manufacturers = mysqlTable("manufacturers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  nameEn: varchar("nameEn", { length: 256 }),
  country: varchar("country", { length: 128 }).notNull(),
  region: varchar("region", { length: 256 }), // province/city for China
  foundedYear: int("foundedYear"),
  website: varchar("website", { length: 512 }),
  logoUrl: varchar("logoUrl", { length: 1024 }),
  description: text("description"),
  mainProducts: text("mainProducts"), // JSON array
  techAchievements: text("techAchievements"), // JSON array of { title, value, date }
  stockCode: varchar("stockCode", { length: 64 }),
  stage: mysqlEnum("stage", ["research", "pilot", "mass_production", "listed"]).default("research").notNull(),
  capacity: varchar("capacity", { length: 256 }), // production capacity
  latestNews: text("latestNews"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Manufacturer = typeof manufacturers.$inferSelect;
export type InsertManufacturer = typeof manufacturers.$inferInsert;

// Efficiency records
export const efficiencyRecords = mysqlTable("efficiency_records", {
  id: int("id").autoincrement().primaryKey(),
  cellType: mysqlEnum("cellType", [
    "single_junction",
    "tandem_silicon",
    "tandem_perovskite",
    "flexible",
    "module",
    "mini_module",
  ]).notNull(),
  efficiency: decimal("efficiency", { precision: 5, scale: 2 }).notNull(),
  area: decimal("area", { precision: 10, scale: 2 }), // cm²
  institution: varchar("institution", { length: 256 }).notNull(),
  certifiedBy: varchar("certifiedBy", { length: 256 }),
  recordDate: timestamp("recordDate").notNull(),
  sourceUrl: varchar("sourceUrl", { length: 1024 }),
  notes: text("notes"),
  isCurrentRecord: boolean("isCurrentRecord").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EfficiencyRecord = typeof efficiencyRecords.$inferSelect;
export type InsertEfficiencyRecord = typeof efficiencyRecords.$inferInsert;

// Research papers (技术前沿 - 研究成果)
export const researchPapers = mysqlTable("research_papers", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 512 }).notNull(),
  titleEn: varchar("titleEn", { length: 512 }),
  authors: text("authors"), // JSON array of strings
  abstract: text("abstract"),
  summary: text("summary"), // LLM-generated Chinese summary
  journal: varchar("journal", { length: 256 }),
  doi: varchar("doi", { length: 256 }),
  sourceUrl: varchar("sourceUrl", { length: 1024 }),
  imageUrl: varchar("imageUrl", { length: 1024 }),
  researchType: mysqlEnum("researchType", [
    "efficiency",
    "stability",
    "materials",
    "fabrication",
    "tandem",
    "flexible",
    "commercialization",
    "other",
  ]).default("other").notNull(),
  keyFindings: text("keyFindings"), // JSON array of key finding strings
  institutions: text("institutions"), // JSON array of institution names
  tags: text("tags"), // JSON array
  isHighlight: boolean("isHighlight").default(false).notNull(),
  publishedAt: timestamp("publishedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ResearchPaper = typeof researchPapers.$inferSelect;
export type InsertResearchPaper = typeof researchPapers.$inferInsert;

// Patents (专利信息)
export const patents = mysqlTable("patents", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 512 }).notNull(),
  titleEn: varchar("titleEn", { length: 512 }),
  patentNumber: varchar("patentNumber", { length: 128 }),
  applicants: text("applicants"), // JSON array
  inventors: text("inventors"), // JSON array
  abstract: text("abstract"),
  summary: text("summary"), // LLM-generated summary
  patentType: mysqlEnum("patentType", ["invention", "utility", "design", "pct"]).default("invention").notNull(),
  country: varchar("country", { length: 128 }).default("CN").notNull(),
  status: mysqlEnum("status", ["pending", "granted", "rejected", "expired"]).default("pending").notNull(),
  ipcCode: varchar("ipcCode", { length: 256 }), // International Patent Classification
  sourceUrl: varchar("sourceUrl", { length: 1024 }),
  tags: text("tags"), // JSON array
  isHighlight: boolean("isHighlight").default(false).notNull(),
  filedAt: timestamp("filedAt"),
  publishedAt: timestamp("publishedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Patent = typeof patents.$inferSelect;
export type InsertPatent = typeof patents.$inferInsert;

// Scheduled job log
export const jobLogs = mysqlTable("job_logs", {
  id: int("id").autoincrement().primaryKey(),
  jobType: varchar("jobType", { length: 128 }).notNull(),
  status: mysqlEnum("status", ["running", "success", "failed"]).notNull(),
  itemsProcessed: int("itemsProcessed").default(0),
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type JobLog = typeof jobLogs.$inferSelect;
