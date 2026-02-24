import { and, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  type InsertEfficiencyRecord,
  type InsertManufacturer,
  type InsertNews,
  type InsertTender,
  type InsertUser,
  efficiencyRecords,
  jobLogs,
  manufacturers,
  news,
  tenders,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── News ─────────────────────────────────────────────────────────────────────

export async function getNewsList(opts: {
  page?: number;
  pageSize?: number;
  category?: string;
  keyword?: string;
  fromDate?: Date;
  toDate?: Date;
  isImportant?: boolean;
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const { page = 1, pageSize = 20, category, keyword, fromDate, toDate, isImportant } = opts;
  const conditions = [];
  if (category) conditions.push(eq(news.category, category as any));
  if (keyword) conditions.push(or(like(news.title, `%${keyword}%`), like(news.summary, `%${keyword}%`)));
  if (fromDate) conditions.push(gte(news.publishedAt, fromDate));
  if (toDate) conditions.push(lte(news.publishedAt, toDate));
  if (isImportant !== undefined) conditions.push(eq(news.isImportant, isImportant));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [items, countResult] = await Promise.all([
    db.select().from(news).where(where).orderBy(desc(news.publishedAt)).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ count: sql<number>`count(*)` }).from(news).where(where),
  ]);
  return { items, total: Number(countResult[0]?.count ?? 0) };
}

export async function getNewsById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(news).where(eq(news.id, id)).limit(1);
  return result[0];
}

export async function insertNews(data: InsertNews) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(news).values(data);
  return result;
}

export async function updateNews(id: number, data: Partial<InsertNews>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(news).set(data).where(eq(news.id, id));
}

export async function deleteNews(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(news).where(eq(news.id, id));
}

export async function getLatestNews(limit = 5) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(news).orderBy(desc(news.publishedAt)).limit(limit);
}

// ─── Tenders ─────────────────────────────────────────────────────────────────

export async function getTenderList(opts: {
  page?: number;
  pageSize?: number;
  projectType?: string;
  region?: string;
  keyword?: string;
  status?: string;
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const { page = 1, pageSize = 20, projectType, region, keyword, status } = opts;
  const conditions = [];
  if (projectType) conditions.push(eq(tenders.projectType, projectType as any));
  if (region) conditions.push(like(tenders.region, `%${region}%`));
  if (keyword) conditions.push(or(like(tenders.title, `%${keyword}%`), like(tenders.description, `%${keyword}%`)));
  if (status) conditions.push(eq(tenders.status, status as any));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [items, countResult] = await Promise.all([
    db.select().from(tenders).where(where).orderBy(desc(tenders.publishedAt)).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ count: sql<number>`count(*)` }).from(tenders).where(where),
  ]);
  return { items, total: Number(countResult[0]?.count ?? 0) };
}

export async function getTenderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tenders).where(eq(tenders.id, id)).limit(1);
  return result[0];
}

export async function insertTender(data: InsertTender) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.insert(tenders).values(data);
}

export async function updateTender(id: number, data: Partial<InsertTender>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(tenders).set(data).where(eq(tenders.id, id));
}

export async function deleteTender(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(tenders).where(eq(tenders.id, id));
}

export async function getLatestTenders(limit = 5) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tenders).where(eq(tenders.status, "open")).orderBy(desc(tenders.publishedAt)).limit(limit);
}

// ─── Manufacturers ────────────────────────────────────────────────────────────

export async function getManufacturerList(opts: {
  page?: number;
  pageSize?: number;
  country?: string;
  stage?: string;
  keyword?: string;
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const { page = 1, pageSize = 20, country, stage, keyword } = opts;
  const conditions = [eq(manufacturers.isActive, true)];
  if (country) conditions.push(eq(manufacturers.country, country));
  if (stage) conditions.push(eq(manufacturers.stage, stage as any));
  if (keyword) conditions.push(or(like(manufacturers.name, `%${keyword}%`), like(manufacturers.description, `%${keyword}%`))!);
  const where = and(...conditions);
  const [items, countResult] = await Promise.all([
    db.select().from(manufacturers).where(where).orderBy(manufacturers.name).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ count: sql<number>`count(*)` }).from(manufacturers).where(where),
  ]);
  return { items, total: Number(countResult[0]?.count ?? 0) };
}

export async function getManufacturerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(manufacturers).where(eq(manufacturers.id, id)).limit(1);
  return result[0];
}

export async function insertManufacturer(data: InsertManufacturer) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.insert(manufacturers).values(data);
}

export async function updateManufacturer(id: number, data: Partial<InsertManufacturer>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(manufacturers).set(data).where(eq(manufacturers.id, id));
}

export async function deleteManufacturer(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(manufacturers).set({ isActive: false }).where(eq(manufacturers.id, id));
}

// ─── Efficiency Records ───────────────────────────────────────────────────────

export async function getEfficiencyRecords(cellType?: string) {
  const db = await getDb();
  if (!db) return [];
  if (cellType) {
    return db.select().from(efficiencyRecords).where(eq(efficiencyRecords.cellType, cellType as any)).orderBy(desc(efficiencyRecords.recordDate));
  }
  return db.select().from(efficiencyRecords).orderBy(desc(efficiencyRecords.recordDate));
}

export async function getCurrentRecords() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(efficiencyRecords).where(eq(efficiencyRecords.isCurrentRecord, true)).orderBy(desc(efficiencyRecords.efficiency));
}

export async function insertEfficiencyRecord(data: InsertEfficiencyRecord) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.insert(efficiencyRecords).values(data);
}

/**
 * Returns time-series data for chart: each row has recordDate, efficiency, cellType.
 * Sorted ascending by date so charts render left-to-right.
 */
export async function getEfficiencyChartData() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: efficiencyRecords.id,
      cellType: efficiencyRecords.cellType,
      efficiency: efficiencyRecords.efficiency,
      recordDate: efficiencyRecords.recordDate,
      institution: efficiencyRecords.institution,
    })
    .from(efficiencyRecords)
    .orderBy(efficiencyRecords.recordDate);
  return rows;
}

// ─── Global Search ────────────────────────────────────────────────────────────

export async function globalSearch(keyword: string, limit = 10) {
  const db = await getDb();
  if (!db) return { news: [], tenders: [], manufacturers: [] };
  const [newsResults, tenderResults, mfgResults] = await Promise.all([
    db.select().from(news).where(or(like(news.title, `%${keyword}%`), like(news.summary, `%${keyword}%`))).orderBy(desc(news.publishedAt)).limit(limit),
    db.select().from(tenders).where(or(like(tenders.title, `%${keyword}%`), like(tenders.description, `%${keyword}%`))).orderBy(desc(tenders.publishedAt)).limit(limit),
    db.select().from(manufacturers).where(and(eq(manufacturers.isActive, true), or(like(manufacturers.name, `%${keyword}%`), like(manufacturers.description, `%${keyword}%`)))).limit(limit),
  ]);
  return { news: newsResults, tenders: tenderResults, manufacturers: mfgResults };
}

// ─── Job Logs ─────────────────────────────────────────────────────────────────

export async function createJobLog(jobType: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(jobLogs).values({ jobType, status: "running", startedAt: new Date() });
  return (result as any).insertId as number;
}

export async function updateJobLog(id: number, status: "success" | "failed", itemsProcessed?: number, errorMessage?: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(jobLogs).set({ status, itemsProcessed, errorMessage, completedAt: new Date() }).where(eq(jobLogs.id, id));
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getSiteStats() {
  const db = await getDb();
  if (!db) return { newsCount: 0, tenderCount: 0, manufacturerCount: 0, latestUpdate: null };
  const [newsCount, tenderCount, mfgCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(news),
    db.select({ count: sql<number>`count(*)` }).from(tenders),
    db.select({ count: sql<number>`count(*)` }).from(manufacturers).where(eq(manufacturers.isActive, true)),
  ]);
  return {
    newsCount: Number(newsCount[0]?.count ?? 0),
    tenderCount: Number(tenderCount[0]?.count ?? 0),
    manufacturerCount: Number(mfgCount[0]?.count ?? 0),
  };
}
