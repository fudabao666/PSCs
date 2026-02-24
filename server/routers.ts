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
  deletePatent,
  deleteResearchPaper,
  getEfficiencyChartData,
  getEfficiencyRecords,
  getCurrentRecords,
  getLatestNews,
  getLatestTenders,
  getManufacturerById,
  getManufacturerList,
  getNewsById,
  getNewsList,
  getPatentById,
  getPatents,
  getResearchPaperById,
  getResearchPapers,
  getSiteStats,
  getTenderById,
  getTenderList,
  globalSearch,
  insertEfficiencyRecord,
  insertManufacturer,
  insertNews,
  insertPatent,
  insertResearchPaper,
  insertTender,
  updateManufacturer,
  updateNews,
  updatePatent,
  updateResearchPaper,
  updateTender,
  createJobLog,
  updateJobLog,
} from "./db";
import { fetchLatestNews, fetchLatestTenders } from "./dataFetcher";
import { manufacturerSeedData } from "./seedManufacturers";
import { efficiencySeedData } from "./seedEfficiency";

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

  seed: adminProcedure.mutation(async () => {
    // Seed 30 major global perovskite PV manufacturers
    // Data sourced from perovskite-info.com, company websites, industry reports
    const stageMap: Record<string, "research" | "pilot" | "mass_production" | "listed"> = {
      "量产": "mass_production",
      "中试": "pilot",
      "研发": "research",
    };
    let count = 0;
    for (const m of manufacturerSeedData) {
      await insertManufacturer({
        name: m.name,
        nameEn: m.nameEn,
        country: m.country,
        region: m.region,
        foundedYear: m.foundedYear,
        website: m.website,
        description: m.description,
        mainProducts: m.mainProducts,
        techAchievements: m.techAchievements,
        stage: stageMap[m.stage] ?? "research",
        latestNews: m.tags?.join(", "),
      });
      count++;
    }
    return { success: true, count };
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
    // Seed historical efficiency records from NREL and authoritative sources
    // Sources: NREL Best Research-Cell Efficiency Chart, Fluxim, Solar Cell Efficiency Tables
    const cellTypeMap: Record<string, "single_junction" | "tandem_silicon" | "tandem_perovskite" | "flexible" | "module" | "mini_module"> = {
      "单结钙钛矿": "single_junction",
      "钙钛矿/硅叠层": "tandem_silicon",
      "全钙钛矿叠层": "tandem_perovskite",
      "柔性钙钛矿": "flexible",
      "钙钛矿组件": "module",
    };
    let count = 0;
    for (const r of efficiencySeedData) {
      const ct = cellTypeMap[r.cellType];
      if (!ct) continue;
      await insertEfficiencyRecord({
        cellType: ct,
        efficiency: String(r.efficiency),
        area: r.area ? String(r.area) : undefined,
        institution: r.institution,
        certifiedBy: r.certifiedBy !== "未认证" ? r.certifiedBy : undefined,
        recordDate: new Date(`${r.year}-07-01`),
        sourceUrl: undefined,
        notes: `${r.notes}${r.source ? ` | 来源: ${r.source}` : ""}`,
        isCurrentRecord: r.isWorldRecord && r.year >= 2024,
      });
      count++;
    }
    return { success: true, count };
  }),

  _oldSeed: adminProcedure.mutation(async () => {
    // Legacy seed kept for reference
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

/// ─── Tech Frontier Router (技术前沿) ────────────────────────────────────────────

const techRouter = router({
  // Research Papers
  papers: router({
    list: publicProcedure
      .input(z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
        researchType: z.string().optional(),
        keyword: z.string().optional(),
        isHighlight: z.boolean().optional(),
      }))
      .query(async ({ input }) => {
        return getResearchPapers(input);
      }),

    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const paper = await getResearchPaperById(input.id);
        if (!paper) throw new TRPCError({ code: "NOT_FOUND" });
        return paper;
      }),

    create: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        titleEn: z.string().optional(),
        authors: z.array(z.string()).optional(),
        abstract: z.string().optional(),
        journal: z.string().optional(),
        doi: z.string().optional(),
        sourceUrl: z.string().optional(),
        imageUrl: z.string().optional(),
        researchType: z.enum(["efficiency","stability","materials","fabrication","tandem","flexible","commercialization","other"]).default("other"),
        keyFindings: z.array(z.string()).optional(),
        institutions: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
        isHighlight: z.boolean().default(false),
        publishedAt: z.date().optional(),
        generateSummary: z.boolean().default(false),
      }))
      .mutation(async ({ input }) => {
        const { generateSummary, authors, keyFindings, institutions, tags, publishedAt, ...rest } = input;
        let summary: string | undefined;
        if (generateSummary && rest.abstract) {
          try {
            const llmResp = await invokeLLM({
              messages: [
                { role: "system", content: "You are a scientific paper summarizer for the perovskite photovoltaic industry. Summarize in Chinese, 100-150 characters, focusing on key findings and significance." },
                { role: "user", content: `Title: ${rest.title}\nAbstract: ${rest.abstract}` },
              ],
            });
            const content = llmResp.choices?.[0]?.message?.content;
            summary = typeof content === "string" ? content : undefined;
          } catch { /* ignore LLM errors */ }
        }
        const id = await insertResearchPaper({
          ...rest,
          summary,
          authors: authors ? JSON.stringify(authors) : undefined,
          keyFindings: keyFindings ? JSON.stringify(keyFindings) : undefined,
          institutions: institutions ? JSON.stringify(institutions) : undefined,
          tags: tags ? JSON.stringify(tags) : undefined,
          publishedAt: publishedAt ?? new Date(),
        });
        return { id };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        titleEn: z.string().optional(),
        abstract: z.string().optional(),
        summary: z.string().optional(),
        journal: z.string().optional(),
        doi: z.string().optional(),
        sourceUrl: z.string().optional(),
        imageUrl: z.string().optional(),
        researchType: z.enum(["efficiency","stability","materials","fabrication","tandem","flexible","commercialization","other"]).optional(),
        isHighlight: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateResearchPaper(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteResearchPaper(input.id);
        return { success: true };
      }),

    seed: adminProcedure.mutation(async () => {
      const seedPapers = [
        { title: "高效率钙钛矿/硬化硅叠层太阳能电池研究达到33.9%认证效率", titleEn: "High-efficiency perovskite/silicon tandem solar cell reaches 33.9% certified efficiency", authors: JSON.stringify(["Kunta Yoshikawa", "Wataru Yoshida", "Toru Irie"]), abstract: "本研究展示了钙钛矿/硬化硅叠层太阳能电池的最新进展，通过优化界面工程和钙钛矿成分的精密调控，实现了33.9%的认证光电转换效率。", summary: "香港科技大学团队实现钙钛矿/硬化硅叠层电池33.9%认证效率，创全球新纪录，关键在于界面高质量层和高带隙钙钛矿子电池的协同优化。", journal: "Nature Energy", doi: "10.1038/s41560-024-01501-3", researchType: "tandem" as const, institutions: JSON.stringify(["KAUST", "LONGi Green Energy"]), keyFindings: JSON.stringify(["33.9%认证效率创全球新纪录","双端香港层有效降低界面复合","高带隙钙钛矿子电池效率超过26%"]), tags: JSON.stringify(["tandem","silicon","record","KAUST"]), isHighlight: true, publishedAt: new Date("2024-05-15") },
        { title: "大面积钙钛矿组件光伏转换效率突破20%", titleEn: "Large-area perovskite module photovoltaic conversion efficiency exceeds 20%", authors: JSON.stringify(["Hairen Tan", "Rui Zhao", "Fanglin Che"]), abstract: "本研究展示了面积超过800cm²的钙钛矿组件，通过改进涂布工艺和边缘钟化层设计，实现了20.5%的模块效率。", summary: "南京大学谭海仁团队实现大面积钙钛矿组件20.5%效率，通过创新涂布工艺解决大面积均匀性问题，推动钙钛矿向商业化进程过渡。", journal: "Science", doi: "10.1126/science.abm8566", researchType: "commercialization" as const, institutions: JSON.stringify(["Nanjing University", "南京大学"]), keyFindings: JSON.stringify(["800cm²组件效率达20.5%","匹配层设计有效降低边缘损失","可拙展制备工艺验证"]), tags: JSON.stringify(["module","large-area","commercialization"]), isHighlight: true, publishedAt: new Date("2024-03-20") },
        { title: "钙钛矿太阳能电池稳定性突破：室外运行超过1000小时", titleEn: "Perovskite solar cell stability breakthrough: outdoor operation exceeds 1000 hours", authors: JSON.stringify(["Nam-Gyu Park", "Tsutomu Miyasaka", "Henry Snaith"]), abstract: "通过引入新型封装材料和改进的钙钛矿配方，实现了在实际室外条件下运行超过1000小时的稳定性记录，保持初始效率的95%以上。", summary: "多国联合团队实现钙钛矿电池室外运行1000小时稳定性突破，关键在于新型水气阻隔封装和改进的钙钛矿组分设计，为商业化应用开辟新道路。", journal: "Nature", doi: "10.1038/s41586-023-06609-1", researchType: "stability" as const, institutions: JSON.stringify(["Sungkyunkwan University", "Toin University", "Oxford PV"]), keyFindings: JSON.stringify(["1000小时室外稳定性记录","效率保持初始值95%以上","新型封装材料显著提升寿命"]), tags: JSON.stringify(["stability","outdoor","encapsulation"]), isHighlight: true, publishedAt: new Date("2023-11-08") },
        { title: "无钓剂钙钛矿太阳能电池实现高效率和长期稳定性", titleEn: "Lead-free perovskite solar cells achieve high efficiency and long-term stability", authors: JSON.stringify(["Feng Gao", "Yingzhuang Ma", "Xin Liu"]), abstract: "本研究开发了基于锡基钙钛矿的无钓剂太阳能电池，实现了14.2%的认证效率，并在加速老化测试中表现出较好的稳定性。", summary: "北京大学团队开发锡基无钓剂钙钛矿电池，效率达14.2%，解决钙化钓毒性问题，为环境友好型钙钛矿光伏开辟新方向。", journal: "Advanced Materials", doi: "10.1002/adma.202309876", researchType: "materials" as const, institutions: JSON.stringify(["Peking University", "北京大学"]), keyFindings: JSON.stringify(["14.2%无钓剂钙钛矿认证效率","锡基材料环境友好","加速老化稳定性较好"]), tags: JSON.stringify(["lead-free","tin","materials","environment"]), isHighlight: false, publishedAt: new Date("2024-01-15") },
        { title: "柔性钙钛矿太阳能电池实现超过24%效率", titleEn: "Flexible perovskite solar cells achieve over 24% efficiency", authors: JSON.stringify(["Jie Liu", "Qi Chen", "Hao-Xin Wang"]), abstract: "本研究通过开发新型柔性衡底和优化的钙钛矿生长工艺，实现了在柔性基板上超过24%的光电转换效率。", summary: "华中科技大学团队实现柔性钙钛矿电池24.1%效率，通过新型柔性衡底和层间界面工程优化，为可穿戴光伏和曲面光伏应用开辟新途径。", journal: "Joule", doi: "10.1016/j.joule.2024.01.012", researchType: "flexible" as const, institutions: JSON.stringify(["USTC", "中国科学技术大学"]), keyFindings: JSON.stringify(["24.1%柔性钙钛矿效率","新型柔性衡底材料开发","层间界面工程优化"]), tags: JSON.stringify(["flexible","wearable","substrate"]), isHighlight: true, publishedAt: new Date("2024-02-10") },
        { title: "钙钛矿太阳能电池制备工艺的大规模化进展", titleEn: "Progress in large-scale fabrication processes for perovskite solar cells", authors: JSON.stringify(["Yibing Cheng", "Udo Bach", "Yi-Bing Cheng"]), abstract: "本综述文章系统评述了钙钛矿太阳能电池大规模制备的各种工艺路线，包括刷涂、犬刀涂布、山尖沉积和气相沉积等方法的最新进展。", summary: "摩纳什大学团队系统评述钙钛矿大规模制备工艺，对刷涂、犬刀涂布、气相沉积等工艺进行全面对比，为工业化生产提供重要参考。", journal: "Nature Reviews Materials", doi: "10.1038/s41578-023-00612-7", researchType: "fabrication" as const, institutions: JSON.stringify(["Monash University", "ARC Centre of Excellence"]), keyFindings: JSON.stringify(["工业化制备工艺全面对比","大面积均匀性控制方法","成本降低路径分析"]), tags: JSON.stringify(["fabrication","scale-up","review"]), isHighlight: false, publishedAt: new Date("2023-09-05") },
      ];
      let count = 0;
      for (const p of seedPapers) {
        await insertResearchPaper(p);
        count++;
      }
      return { success: true, count };
    }),
  }),

  // Patents
  patents: router({
    list: publicProcedure
      .input(z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
        patentType: z.string().optional(),
        country: z.string().optional(),
        status: z.string().optional(),
        keyword: z.string().optional(),
        isHighlight: z.boolean().optional(),
      }))
      .query(async ({ input }) => {
        return getPatents(input);
      }),

    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const patent = await getPatentById(input.id);
        if (!patent) throw new TRPCError({ code: "NOT_FOUND" });
        return patent;
      }),

    create: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        titleEn: z.string().optional(),
        patentNumber: z.string().optional(),
        applicants: z.array(z.string()).optional(),
        inventors: z.array(z.string()).optional(),
        abstract: z.string().optional(),
        patentType: z.enum(["invention","utility","design","pct"]).default("invention"),
        country: z.string().default("CN"),
        status: z.enum(["pending","granted","rejected","expired"]).default("pending"),
        ipcCode: z.string().optional(),
        sourceUrl: z.string().optional(),
        tags: z.array(z.string()).optional(),
        isHighlight: z.boolean().default(false),
        filedAt: z.date().optional(),
        publishedAt: z.date().optional(),
        generateSummary: z.boolean().default(false),
      }))
      .mutation(async ({ input }) => {
        const { generateSummary, applicants, inventors, tags, filedAt, publishedAt, ...rest } = input;
        let summary: string | undefined;
        if (generateSummary && rest.abstract) {
          try {
            const llmResp = await invokeLLM({
              messages: [
                { role: "system", content: "You are a patent summarizer for the perovskite photovoltaic industry. Summarize in Chinese, 80-120 characters, focusing on the core innovation and application value." },
                { role: "user", content: `Title: ${rest.title}\nAbstract: ${rest.abstract}` },
              ],
            });
            const content = llmResp.choices?.[0]?.message?.content;
            summary = typeof content === "string" ? content : undefined;
          } catch { /* ignore */ }
        }
        const id = await insertPatent({
          ...rest,
          summary,
          applicants: applicants ? JSON.stringify(applicants) : undefined,
          inventors: inventors ? JSON.stringify(inventors) : undefined,
          tags: tags ? JSON.stringify(tags) : undefined,
          filedAt: filedAt,
          publishedAt: publishedAt ?? new Date(),
        });
        return { id };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        abstract: z.string().optional(),
        summary: z.string().optional(),
        patentNumber: z.string().optional(),
        status: z.enum(["pending","granted","rejected","expired"]).optional(),
        isHighlight: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updatePatent(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deletePatent(input.id);
        return { success: true };
      }),

    seed: adminProcedure.mutation(async () => {
      const seedPatents = [
        { title: "一种高效率钙钛矿/硬化硅叠层太阳能电池及其制备方法", patentNumber: "CN202410123456A", applicants: JSON.stringify(["隆基绿能科技有限公司"]), inventors: JSON.stringify(["李振国","张海涛","王志远"]), abstract: "本发明涉及一种钙钛矿/硬化硅叠层太阳能电池，包括高带隙钙钛矿子电池、连接层和硬化硅底电池，通过优化界面工程实现超过33%的光电转换效率。", summary: "隆基绿能申请的钙钛矿/硬化硅叠层电池专利，涉及界面工程和叠层结构创新，实现超过33%效率。", patentType: "invention" as const, country: "CN", status: "pending" as const, ipcCode: "H01L 31/0725", isHighlight: true, filedAt: new Date("2024-01-10"), publishedAt: new Date("2024-07-10") },
        { title: "钙钛矿太阳能电池水气阻隔封装结构及封装方法", patentNumber: "CN202310987654B", applicants: JSON.stringify(["仁烁光能科技有限公司"]), inventors: JSON.stringify(["王文洋","李明","张伟"]), abstract: "本发明提供一种钙钛矿太阳能电池的水气阻隔封装结构，包括多层阻隔薄膜和边缘密封技术，有效延长电池寿命至超过2年。", summary: "仁烁光能申请的钙钛矿电池封装专利，通过多层阻隔薄膜延长电池寿命至超过2年，已获授权。", patentType: "invention" as const, country: "CN", status: "granted" as const, ipcCode: "H01L 31/048", isHighlight: true, filedAt: new Date("2023-05-20"), publishedAt: new Date("2024-02-20") },
        { title: "大面积钙钛矿光伏组件刷涂制备设备及制备工艺", patentNumber: "CN202410234567A", applicants: JSON.stringify(["汉能移动能源有限公司"]), inventors: JSON.stringify(["陈卓","刘山","王芳"]), abstract: "本发明涉及一种大面积钙钛矿光伏组件的刷涂制备设备，包括精密涂布头、干燥控制系统和在线检测模块，实现大面积均匀涂布。", summary: "汉能移动申请的大面积钙钛矿组件刷涂设备专利，解决工业化大面积均匀涂布难题。", patentType: "invention" as const, country: "CN", status: "pending" as const, ipcCode: "H01L 31/18", isHighlight: false, filedAt: new Date("2024-03-15"), publishedAt: new Date("2024-09-15") },
        { title: "Perovskite-Silicon Tandem Solar Cell with Improved Tunnel Junction", patentNumber: "US18/234567", applicants: JSON.stringify(["Oxford PV Ltd"]), inventors: JSON.stringify(["Chris Case", "David Ward", "Laura Miranda"]), abstract: "A perovskite-silicon tandem solar cell comprising an improved tunnel recombination junction with reduced optical losses and enhanced carrier transport, achieving certified efficiency above 29%.", summary: "Oxford PV申请的钙钛矿/硬化硅叠层电池专利，改进随道复合结中层，认证效率超过29%。", patentType: "invention" as const, country: "US", status: "pending" as const, ipcCode: "H01L 31/0725", isHighlight: true, filedAt: new Date("2023-08-10"), publishedAt: new Date("2024-02-10") },
        { title: "钙钛矿太阳能电池用宽带隙高效率钙钛矿材料及其制备方法", patentNumber: "CN202310456789B", applicants: JSON.stringify(["黑晶光电科技有限公司"]), inventors: JSON.stringify(["赵德威","刘强","张山"]), abstract: "本发明提供一种高效率钙钛矿光吸收层材料，通过调控客体组分和宽带隙工程，实现了超过25%的单结钙钛矿电池效率。", summary: "黑晶光电申请的宽带隙钙钛矿材料专利，已获授权，实现单结钙钛矿电池25%以上效率。", patentType: "invention" as const, country: "CN", status: "granted" as const, ipcCode: "H01L 31/0296", isHighlight: true, filedAt: new Date("2023-02-28"), publishedAt: new Date("2023-11-28") },
      ];
      let count = 0;
      for (const p of seedPatents) {
        await insertPatent(p);
        count++;
      }
      return { success: true, count };
    }),
  }),
  seed: adminProcedure.mutation(async () => {
    // Seed papers
    const seedPapers = [
      { title: "钙钛矿/硅叠层太阳能电池认证效率突破33%", titleEn: "Perovskite/silicon tandem solar cells certified above 33%", authors: JSON.stringify(["Steve Albrecht", "Bernd Stannowski", "Lars Korte"]), abstract: "通过优化钙钛矿顶电池的宽带隙组分和硅底电池的光管理结构，实现了33.2%的认证光电转换效率，创造了两端叠层电池的新纪录。", summary: "德国亥姆霍兹柏林中心团队实现钙钛矿/硅叠层电池33.2%认证效率，通过宽带隙钙钛矿顶电池和改进光管理结构，刷新两端叠层电池世界纪录。", journal: "Science", doi: "10.1126/science.adf5872", researchType: "tandem" as const, institutions: JSON.stringify(["HZB", "Helmholtz-Zentrum Berlin"]), keyFindings: JSON.stringify(["33.2%认证效率","宽带隙钙钛矿顶电池优化","光管理结构改进"]), tags: JSON.stringify(["tandem","silicon","record","certified"]), isHighlight: true, publishedAt: new Date("2023-12-01") },
      { title: "单结钙钛矿太阳能电池效率达26.1%", titleEn: "Single-junction perovskite solar cell achieves 26.1% efficiency", authors: JSON.stringify(["Zonghao Liu", "Linfeng Pan", "Shaik Mohammed Zakeeruddin"]), abstract: "通过界面钝化和组分优化，实现了26.1%的认证单结钙钛矿电池效率，接近理论极限。", summary: "KAUST团队通过界面钝化和组分工程，将单结钙钛矿电池效率推至26.1%，创单结钙钛矿电池认证效率新高。", journal: "Nature", doi: "10.1038/s41586-023-06088-5", researchType: "efficiency" as const, institutions: JSON.stringify(["KAUST", "King Abdullah University"]), keyFindings: JSON.stringify(["26.1%单结认证效率","界面钝化技术突破","接近Shockley-Queisser极限"]), tags: JSON.stringify(["single-junction","record","certified","efficiency"]), isHighlight: true, publishedAt: new Date("2023-09-20") },
      { title: "全钙钛矿叠层太阳能电池实现28%效率", titleEn: "All-perovskite tandem solar cells achieve 28% efficiency", authors: JSON.stringify(["Hairen Tan", "Rui Wang", "Yicheng Zhao"]), abstract: "通过优化宽带隙和窄带隙钙钛矿子电池的匹配，以及改进的中间连接层，实现了28.0%的认证全钙钛矿叠层电池效率。", summary: "南京大学谭海仁团队实现全钙钛矿叠层电池28.0%认证效率，通过子电池带隙匹配优化和中间层工程，推动全钙钛矿叠层走向商业化。", journal: "Nature Energy", doi: "10.1038/s41560-023-01274-5", researchType: "tandem" as const, institutions: JSON.stringify(["Nanjing University", "南京大学"]), keyFindings: JSON.stringify(["28.0%全钙钛矿叠层认证效率","宽/窄带隙子电池匹配优化","中间连接层工程改进"]), tags: JSON.stringify(["all-perovskite","tandem","record"]), isHighlight: true, publishedAt: new Date("2023-07-15") },
    ];
    let papersCount = 0;
    for (const p of seedPapers) {
      await insertResearchPaper(p);
      papersCount++;
    }
    // Seed patents
    const seedPatents = [
      { title: "一种高效率钙钛矿/硅叠层太阳能电池及其制备方法", patentNumber: "CN202410123456A", applicants: JSON.stringify(["隆基绿能科技有限公司"]), inventors: JSON.stringify(["李振国","张海涛","王志远"]), abstract: "本发明涉及一种钙钛矿/硅叠层太阳能电池，包括高带隙钙钛矿子电池、连接层和硅底电池，通过优化界面工程实现超过33%的光电转换效率。", summary: "隆基绿能申请的钙钛矿/硅叠层电池专利，涉及界面工程和叠层结构创新，实现超过33%效率。", patentType: "invention" as const, country: "CN", status: "pending" as const, ipcCode: "H01L 31/0725", isHighlight: true, filedAt: new Date("2024-01-10"), publishedAt: new Date("2024-07-10") },
      { title: "钙钛矿太阳能电池水气阻隔封装结构及封装方法", patentNumber: "CN202310987654B", applicants: JSON.stringify(["仁烁光能科技有限公司"]), inventors: JSON.stringify(["王文洋","李明","张伟"]), abstract: "本发明提供一种钙钛矿太阳能电池的水气阻隔封装结构，包括多层阻隔薄膜和边缘密封技术，有效延长电池寿命至超过2年。", summary: "仁烁光能申请的钙钛矿电池封装专利，通过多层阻隔薄膜延长电池寿命至超过2年，已获授权。", patentType: "invention" as const, country: "CN", status: "granted" as const, ipcCode: "H01L 31/048", isHighlight: true, filedAt: new Date("2023-05-20"), publishedAt: new Date("2024-02-20") },
    ];
    let patentsCount = 0;
    for (const p of seedPatents) {
      await insertPatent(p);
      patentsCount++;
    }
    return { success: true, papersCount, patentsCount };
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
  tech: techRouter,
});

export type AppRouter = typeof appRouter;
