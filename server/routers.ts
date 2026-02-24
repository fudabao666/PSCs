import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import {
  deleteManufacturer,
  deleteNews,
  deleteTender,
  getEfficiencyChartData,
  getEfficiencyRecords,
  getCurrentRecords,
  getLatestNews,
  getLatestTenders,
  getManufacturerById,
  getManufacturerList,
  getNewsById,
  getNewsList,
  getSiteStats,
  getTenderById,
  getTenderList,
  globalSearch,
  insertEfficiencyRecord,
  insertManufacturer,
  insertNews,
  insertTender,
  updateManufacturer,
  updateNews,
  updateTender,
  createJobLog,
  updateJobLog,
} from "./db";
import { fetchLatestNews, fetchLatestTenders } from "./dataFetcher";

// Admin guard middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// ─── News Router ──────────────────────────────────────────────────────────────

const newsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(50).default(20),
        category: z.string().optional(),
        keyword: z.string().optional(),
        fromDate: z.date().optional(),
        toDate: z.date().optional(),
        isImportant: z.boolean().optional(),
      })
    )
    .query(({ input }) => getNewsList(input)),

  latest: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(6) }))
    .query(({ input }) => getLatestNews(input.limit)),

  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const item = await getNewsById(input.id);
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });
      return item;
    }),

  generateSummary: publicProcedure
    .input(z.object({ content: z.string().min(50), title: z.string() }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "你是一位专业的钙钛矿光伏行业分析师。请为以下新闻文章生成一段简洁、专业的中文摘要（150字以内），并提取3-5个关键词。以JSON格式返回：{\"summary\": \"...\", \"keywords\": [...]}",
          },
          {
            role: "user",
            content: `标题：${input.title}\n\n内容：${input.content.slice(0, 2000)}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "news_summary",
            strict: true,
            schema: {
              type: "object",
              properties: {
                summary: { type: "string" },
                keywords: { type: "array", items: { type: "string" } },
              },
              required: ["summary", "keywords"],
              additionalProperties: false,
            },
          },
        },
      });
      const rawContent = response.choices[0]?.message?.content;
      const content = typeof rawContent === "string" ? rawContent : null;
      if (!content) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return JSON.parse(content) as { summary: string; keywords: string[] };
    }),

  // Admin CRUD
  create: adminProcedure
    .input(
      z.object({
        title: z.string().min(1),
        summary: z.string().optional(),
        content: z.string().optional(),
        sourceUrl: z.string().optional(),
        sourceName: z.string().optional(),
        imageUrl: z.string().optional(),
        category: z.enum(["domestic", "international", "research", "policy", "market", "technology"]).default("domestic"),
        tags: z.string().optional(),
        isImportant: z.boolean().default(false),
        publishedAt: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await insertNews({ ...input, publishedAt: input.publishedAt ?? new Date() });
      if (input.isImportant) {
        await notifyOwner({
          title: "重要新闻已发布",
          content: `新重要新闻：${input.title}`,
        });
      }
      return { success: true };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        summary: z.string().optional(),
        content: z.string().optional(),
        sourceUrl: z.string().optional(),
        sourceName: z.string().optional(),
        imageUrl: z.string().optional(),
        category: z.enum(["domestic", "international", "research", "policy", "market", "technology"]).optional(),
        tags: z.string().optional(),
        isImportant: z.boolean().optional(),
        publishedAt: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateNews(id, data);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteNews(input.id);
      return { success: true };
    }),
});

// ─── Tenders Router ───────────────────────────────────────────────────────────

const tendersRouter = router({
  list: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(50).default(20),
        projectType: z.string().optional(),
        region: z.string().optional(),
        keyword: z.string().optional(),
        status: z.string().optional(),
      })
    )
    .query(({ input }) => getTenderList(input)),

  latest: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(6) }))
    .query(({ input }) => getLatestTenders(input.limit)),

  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const item = await getTenderById(input.id);
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });
      return item;
    }),

  create: adminProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        projectType: z.enum(["procurement", "construction", "research", "service", "other"]).default("procurement"),
        budget: z.string().optional(),
        region: z.string().optional(),
        publisherName: z.string().optional(),
        contactInfo: z.string().optional(),
        sourceUrl: z.string().optional(),
        sourcePlatform: z.string().optional(),
        deadline: z.date().optional(),
        isImportant: z.boolean().default(false),
        status: z.enum(["open", "closed", "awarded", "cancelled"]).default("open"),
        publishedAt: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await insertTender({ ...input, publishedAt: input.publishedAt ?? new Date() });
      if (input.isImportant) {
        await notifyOwner({
          title: "重要招投标信息",
          content: `新重要招投标：${input.title}${input.budget ? `，预算：${input.budget}` : ""}`,
        });
      }
      return { success: true };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        projectType: z.enum(["procurement", "construction", "research", "service", "other"]).optional(),
        budget: z.string().optional(),
        region: z.string().optional(),
        publisherName: z.string().optional(),
        contactInfo: z.string().optional(),
        sourceUrl: z.string().optional(),
        sourcePlatform: z.string().optional(),
        deadline: z.date().optional(),
        isImportant: z.boolean().optional(),
        status: z.enum(["open", "closed", "awarded", "cancelled"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateTender(id, data);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteTender(input.id);
      return { success: true };
    }),
});

// ─── Manufacturers Router ─────────────────────────────────────────────────────

const manufacturersRouter = router({
  list: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(50).default(20),
        country: z.string().optional(),
        stage: z.string().optional(),
        keyword: z.string().optional(),
      })
    )
    .query(({ input }) => getManufacturerList(input)),

  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const item = await getManufacturerById(input.id);
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });
      return item;
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        nameEn: z.string().optional(),
        country: z.string().min(1),
        region: z.string().optional(),
        foundedYear: z.number().optional(),
        website: z.string().optional(),
        logoUrl: z.string().optional(),
        description: z.string().optional(),
        mainProducts: z.string().optional(),
        techAchievements: z.string().optional(),
        stockCode: z.string().optional(),
        stage: z.enum(["research", "pilot", "mass_production", "listed"]).default("research"),
        capacity: z.string().optional(),
        latestNews: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await insertManufacturer(input);
      return { success: true };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        nameEn: z.string().optional(),
        country: z.string().optional(),
        region: z.string().optional(),
        foundedYear: z.number().optional(),
        website: z.string().optional(),
        logoUrl: z.string().optional(),
        description: z.string().optional(),
        mainProducts: z.string().optional(),
        techAchievements: z.string().optional(),
        stockCode: z.string().optional(),
        stage: z.enum(["research", "pilot", "mass_production", "listed"]).optional(),
        capacity: z.string().optional(),
        latestNews: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateManufacturer(id, data);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteManufacturer(input.id);
      return { success: true };
    }),
});

// ─── Efficiency Records Router ────────────────────────────────────────────────

const efficiencyRouter = router({
  list: publicProcedure
    .input(z.object({ cellType: z.string().optional() }))
    .query(({ input }) => getEfficiencyRecords(input.cellType)),

  current: publicProcedure.query(() => getCurrentRecords()),

  chartData: publicProcedure.query(() => getEfficiencyChartData()),

  seed: adminProcedure.mutation(async () => {
    // Seed historical efficiency records for chart demonstration
    const seedData = [
      // Single junction perovskite
      { cellType: "single_junction" as const, efficiency: "9.7",  institution: "EPFL",           recordDate: new Date("2012-06-01"), isCurrentRecord: false },
      { cellType: "single_junction" as const, efficiency: "15.0", institution: "EPFL",           recordDate: new Date("2013-07-01"), isCurrentRecord: false },
      { cellType: "single_junction" as const, efficiency: "17.9", institution: "KRICT",          recordDate: new Date("2014-08-01"), isCurrentRecord: false },
      { cellType: "single_junction" as const, efficiency: "20.1", institution: "KRICT/UNIST",    recordDate: new Date("2015-06-01"), isCurrentRecord: false },
      { cellType: "single_junction" as const, efficiency: "22.1", institution: "KRICT/UNIST",    recordDate: new Date("2016-10-01"), isCurrentRecord: false },
      { cellType: "single_junction" as const, efficiency: "23.3", institution: "KRICT",          recordDate: new Date("2018-04-01"), isCurrentRecord: false },
      { cellType: "single_junction" as const, efficiency: "25.2", institution: "KAUST",          recordDate: new Date("2019-11-01"), isCurrentRecord: false },
      { cellType: "single_junction" as const, efficiency: "25.7", institution: "LONGi Green Energy", recordDate: new Date("2021-11-01"), isCurrentRecord: false },
      { cellType: "single_junction" as const, efficiency: "26.1", institution: "KAUST",          recordDate: new Date("2023-03-01"), isCurrentRecord: false },
      { cellType: "single_junction" as const, efficiency: "26.7", institution: "KAUST",          recordDate: new Date("2024-06-01"), isCurrentRecord: true  },
      // Tandem perovskite/silicon
      { cellType: "tandem_silicon" as const,   efficiency: "23.6", institution: "Helmholtz-Zentrum Berlin", recordDate: new Date("2016-11-01"), isCurrentRecord: false },
      { cellType: "tandem_silicon" as const,   efficiency: "25.2", institution: "EPFL/CSEM",     recordDate: new Date("2018-01-01"), isCurrentRecord: false },
      { cellType: "tandem_silicon" as const,   efficiency: "28.0", institution: "HZB",           recordDate: new Date("2020-03-01"), isCurrentRecord: false },
      { cellType: "tandem_silicon" as const,   efficiency: "29.8", institution: "LONGi Green Energy", recordDate: new Date("2021-09-01"), isCurrentRecord: false },
      { cellType: "tandem_silicon" as const,   efficiency: "31.25",institution: "KAUST",         recordDate: new Date("2022-11-01"), isCurrentRecord: false },
      { cellType: "tandem_silicon" as const,   efficiency: "33.9", institution: "LONGi Green Energy", recordDate: new Date("2023-11-01"), isCurrentRecord: false },
      { cellType: "tandem_silicon" as const,   efficiency: "34.6", institution: "KAUST",         recordDate: new Date("2024-09-01"), isCurrentRecord: true  },
      // All-perovskite tandem
      { cellType: "tandem_perovskite" as const,efficiency: "17.0", institution: "EPFL",          recordDate: new Date("2016-05-01"), isCurrentRecord: false },
      { cellType: "tandem_perovskite" as const,efficiency: "20.3", institution: "Nanjing University", recordDate: new Date("2019-08-01"), isCurrentRecord: false },
      { cellType: "tandem_perovskite" as const,efficiency: "24.2", institution: "Nanjing University", recordDate: new Date("2021-04-01"), isCurrentRecord: false },
      { cellType: "tandem_perovskite" as const,efficiency: "26.4", institution: "Nanjing University", recordDate: new Date("2022-07-01"), isCurrentRecord: false },
      { cellType: "tandem_perovskite" as const,efficiency: "28.0", institution: "Nanjing University", recordDate: new Date("2023-08-01"), isCurrentRecord: false },
      { cellType: "tandem_perovskite" as const,efficiency: "29.1", institution: "Nanjing University", recordDate: new Date("2024-05-01"), isCurrentRecord: true  },
      // Flexible
      { cellType: "flexible" as const,         efficiency: "12.0", institution: "EPFL",          recordDate: new Date("2015-03-01"), isCurrentRecord: false },
      { cellType: "flexible" as const,         efficiency: "16.0", institution: "KRICT",         recordDate: new Date("2017-06-01"), isCurrentRecord: false },
      { cellType: "flexible" as const,         efficiency: "19.5", institution: "EPFL",          recordDate: new Date("2019-09-01"), isCurrentRecord: false },
      { cellType: "flexible" as const,         efficiency: "21.4", institution: "KAUST",         recordDate: new Date("2021-03-01"), isCurrentRecord: false },
      { cellType: "flexible" as const,         efficiency: "23.4", institution: "KAUST",         recordDate: new Date("2023-06-01"), isCurrentRecord: true  },
      // Module
      { cellType: "module" as const,           efficiency: "10.4", institution: "EPFL",          recordDate: new Date("2016-01-01"), isCurrentRecord: false },
      { cellType: "module" as const,           efficiency: "12.1", institution: "Saule Technologies", recordDate: new Date("2018-06-01"), isCurrentRecord: false },
      { cellType: "module" as const,           efficiency: "16.1", institution: "Panasonic",     recordDate: new Date("2020-01-01"), isCurrentRecord: false },
      { cellType: "module" as const,           efficiency: "18.6", institution: "Microquanta",   recordDate: new Date("2022-03-01"), isCurrentRecord: false },
      { cellType: "module" as const,           efficiency: "20.6", institution: "Microquanta",   recordDate: new Date("2024-01-01"), isCurrentRecord: true  },
    ];
    for (const record of seedData) {
      await insertEfficiencyRecord(record);
    }
    return { success: true, count: seedData.length };
  }),

  create: adminProcedure
    .input(
      z.object({
        cellType: z.enum(["single_junction", "tandem_silicon", "tandem_perovskite", "flexible", "module", "mini_module"]),
        efficiency: z.string(),
        area: z.string().optional(),
        institution: z.string().min(1),
        certifiedBy: z.string().optional(),
        recordDate: z.date(),
        sourceUrl: z.string().optional(),
        notes: z.string().optional(),
        isCurrentRecord: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      await insertEfficiencyRecord(input);
      return { success: true };
    }),
});

// ─── Search Router ────────────────────────────────────────────────────────────

const searchRouter = router({
  global: publicProcedure
    .input(z.object({ keyword: z.string().min(1), limit: z.number().min(1).max(20).default(10) }))
    .query(({ input }) => globalSearch(input.keyword, input.limit)),
});

// ─── Stats Router ─────────────────────────────────────────────────────────────

const statsRouter = router({
  site: publicProcedure.query(() => getSiteStats()),
});

// ─── Data Fetch Router (Admin) ────────────────────────────────────────────────

const dataFetchRouter = router({
  triggerFetch: adminProcedure.mutation(async () => {
    const jobId = await createJobLog("manual_fetch");
    try {
      const [newsCount, tenderCount] = await Promise.all([
        fetchLatestNews(),
        fetchLatestTenders(),
      ]);
      if (jobId) await updateJobLog(jobId, "success", newsCount + tenderCount);
      await notifyOwner({
        title: "数据更新完成",
        content: `手动触发数据更新完成：新增新闻 ${newsCount} 条，招投标信息 ${tenderCount} 条`,
      });
      return { success: true, newsCount, tenderCount };
    } catch (err) {
      if (jobId) await updateJobLog(jobId, "failed", 0, String(err));
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: String(err) });
    }
  }),
});

// ─── App Router ───────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  news: newsRouter,
  tenders: tendersRouter,
  manufacturers: manufacturersRouter,
  efficiency: efficiencyRouter,
  search: searchRouter,
  stats: statsRouter,
  dataFetch: dataFetchRouter,
});

export type AppRouter = typeof appRouter;
