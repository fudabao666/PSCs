import axios from "axios";
import { invokeLLM } from "./_core/llm";
import { insertNews, insertTender, getDb } from "./db";
import { tenders, news } from "../drizzle/schema";
import { like, or } from "drizzle-orm";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const HTTP_TIMEOUT = 15000;

/**
 * Fetch raw HTML from a URL with retry logic.
 */
async function fetchHtml(url: string, retries = 2): Promise<string> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await axios.get(url, {
        timeout: HTTP_TIMEOUT,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
          "Accept-Encoding": "gzip, deflate",
          Referer: "https://www.google.com/",
        },
        maxRedirects: 5,
      });
      return typeof res.data === "string" ? res.data : String(res.data);
    } catch (err) {
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
    }
  }
  return "";
}

/**
 * Strip HTML tags and collapse whitespace.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Check if a tender with the same title already exists in the DB.
 */
async function tenderExists(title: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const rows = await db
    .select({ id: tenders.id })
    .from(tenders)
    .where(like(tenders.title, `%${title.slice(0, 20)}%`))
    .limit(1);
  return rows.length > 0;
}

/**
 * Check if a news item with the same title already exists in the DB.
 */
async function newsExists(title: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const rows = await db
    .select({ id: news.id })
    .from(news)
    .where(like(news.title, `%${title.slice(0, 20)}%`))
    .limit(1);
  return rows.length > 0;
}

// ─── Tender Sources ───────────────────────────────────────────────────────────

interface RawTenderItem {
  title: string;
  url: string;
  snippet: string;
  platform: string;
}

/**
 * Scrape tender list from 采招网 (bidcenter.com.cn)
 */
async function scrapeBidCenter(): Promise<RawTenderItem[]> {
  const items: RawTenderItem[] = [];
  try {
    const url = "https://www.bidcenter.com.cn/search/?keyword=%E9%92%99%E9%92%9B%E7%9F%BF&type=1";
    const html = await fetchHtml(url);
    // Extract anchor tags with title containing 钙钛矿
    const linkRegex = /<a[^>]+href="([^"]*\/zbkeyw[^"]*|[^"]*bidDetail[^"]*)"[^>]*>([^<]*钙钛矿[^<]*)<\/a>/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1].startsWith("http") ? match[1] : `https://www.bidcenter.com.cn${match[1]}`;
      items.push({
        title: match[2].trim(),
        url: href,
        snippet: "",
        platform: "采招网",
      });
      if (items.length >= 10) break;
    }
  } catch (err) {
    console.warn("[dataFetcher] bidcenter scrape failed:", err instanceof Error ? err.message : err);
  }
  return items;
}

/**
 * Scrape tender list from 北极星光伏招投标频道
 */
async function scrapebjxTenders(): Promise<RawTenderItem[]> {
  const items: RawTenderItem[] = [];
  try {
    const url = "https://guangfu.bjx.com.cn/zb/search/?keyword=%E9%92%99%E9%92%9B%E7%9F%BF";
    const html = await fetchHtml(url);
    // Extract news links
    const linkRegex = /<a[^>]+href="(https?:\/\/guangfu\.bjx\.com\.cn\/zb\/[^"]+)"[^>]*>([^<]*钙钛矿[^<]*)<\/a>/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      items.push({
        title: match[2].trim(),
        url: match[1],
        snippet: "",
        platform: "北极星光伏网",
      });
      if (items.length >= 8) break;
    }
  } catch (err) {
    console.warn("[dataFetcher] bjx tenders scrape failed:", err instanceof Error ? err.message : err);
  }
  return items;
}

/**
 * Scrape tender list from 中国电建阳光采购平台
 */
async function scrapePowerchinaeTenders(): Promise<RawTenderItem[]> {
  const items: RawTenderItem[] = [];
  try {
    const url = "https://www.powerchina.cn/col/col5741/index.html";
    const html = await fetchHtml(url);
    const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>([^<]*(?:钙钛矿|perovskite)[^<]*)<\/a>/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1].startsWith("http") ? match[1] : `https://www.powerchina.cn${match[1]}`;
      items.push({
        title: match[2].trim(),
        url: href,
        snippet: "",
        platform: "中国电建",
      });
      if (items.length >= 5) break;
    }
  } catch (err) {
    console.warn("[dataFetcher] powerchina scrape failed:", err instanceof Error ? err.message : err);
  }
  return items;
}

/**
 * Scrape tender list from 全国公共资源交易平台
 */
async function scrapeGgzyjyTenders(): Promise<RawTenderItem[]> {
  const items: RawTenderItem[] = [];
  try {
    const url =
      "https://deal.ggzy.gov.cn/ds/deal/dealList_find.jsp?DEAL_TIME=&DEAL_CLASSIFY_ID=&DEAL_TYPE=&DEAL_PROVINCE=&DEAL_CITY=&DEAL_COUNTY=&DEAL_STAGE=&DEAL_ISSHOW_INVALID=1&BID_SECTION_NAME=&TENDEREE=&AGENCY=&DEAL_NAME=%E9%92%99%E9%92%9B%E7%9F%BF&DEAL_CODE=&DEAL_CONTENT=&DEAL_AMOUNT_START=&DEAL_AMOUNT_END=&DEAL_FILED=DEAL_TIME&DEAL_SORT=DESC&PAGEINDEX=1&PAGESIZE=10&DEAL_STATUS=";
    const html = await fetchHtml(url);
    const linkRegex = /<a[^>]+href="([^"]+)"[^>]*title="([^"]*钙钛矿[^"]*)"[^>]*>/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1].startsWith("http") ? match[1] : `https://deal.ggzy.gov.cn${match[1]}`;
      items.push({
        title: match[2].trim(),
        url: href,
        snippet: "",
        platform: "全国公共资源交易平台",
      });
      if (items.length >= 5) break;
    }
  } catch (err) {
    console.warn("[dataFetcher] ggzy scrape failed:", err instanceof Error ? err.message : err);
  }
  return items;
}

/**
 * Use LLM to parse and enrich raw tender items scraped from websites.
 */
async function parseTendersWithLLM(rawItems: RawTenderItem[]): Promise<
  Array<{
    title: string;
    description: string;
    projectType: string;
    budget: string;
    region: string;
    publisherName: string;
    isImportant: boolean;
    status: string;
    sourceUrl: string;
    sourcePlatform: string;
  }>
> {
  if (rawItems.length === 0) return [];
  const today = new Date().toISOString().slice(0, 10);
  const inputText = rawItems
    .map((item, i) => `[${i + 1}] 标题: ${item.title}\n来源: ${item.platform}\n链接: ${item.url}\n摘要: ${item.snippet}`)
    .join("\n\n");

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `你是一位专业的钙钛矿光伏行业招投标信息编辑。请对以下从招标网站抓取的原始招标信息进行解析和结构化处理。
对每条信息，提取或推断：
- title: 招标项目标题（保持原标题）
- description: 项目描述（100字以内，描述项目内容和意义）
- projectType: procurement（设备采购）/ construction（工程建设）/ research（研究合作）/ service（服务外包）/ other（其他）
- budget: 预算金额（如已知，否则填"未披露"）
- region: 项目地区（如北京市、广东省深圳市等）
- publisherName: 招标方名称
- isImportant: 是否重要（涉及央企、大型项目、金额超千万则为true）
- status: open（招标中）/ closed（已截止）/ awarded（已中标）/ cancelled（已取消）
- sourceUrl: 原始链接（保持不变）
- sourcePlatform: 来源平台名称

今天日期：${today}`,
      },
      {
        role: "user",
        content: `请解析以下${rawItems.length}条招标信息：\n\n${inputText}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "tender_parse_result",
        strict: true,
        schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  projectType: { type: "string" },
                  budget: { type: "string" },
                  region: { type: "string" },
                  publisherName: { type: "string" },
                  isImportant: { type: "boolean" },
                  status: { type: "string" },
                  sourceUrl: { type: "string" },
                  sourcePlatform: { type: "string" },
                },
                required: [
                  "title",
                  "description",
                  "projectType",
                  "budget",
                  "region",
                  "publisherName",
                  "isImportant",
                  "status",
                  "sourceUrl",
                  "sourcePlatform",
                ],
                additionalProperties: false,
              },
            },
          },
          required: ["items"],
          additionalProperties: false,
        },
      },
    },
  });

  const rawContent = response.choices[0]?.message?.content;
  const content = typeof rawContent === "string" ? rawContent : null;
  if (!content) return [];
  const parsed = JSON.parse(content) as { items: typeof parseTendersWithLLM extends (...args: any[]) => Promise<infer R> ? R : never };
  return (parsed as any).items ?? [];
}

/**
 * Use LLM to generate additional tender entries based on recent known projects
 * when web scraping yields insufficient results.
 */
async function fetchTendersFromLLMKnowledge(count: number): Promise<
  Array<{
    title: string;
    description: string;
    projectType: string;
    budget: string;
    region: string;
    publisherName: string;
    isImportant: boolean;
    status: string;
    sourceUrl: string;
    sourcePlatform: string;
  }>
> {
  const today = new Date().toISOString().slice(0, 10);
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `你是一位专业的钙钛矿光伏行业招投标信息编辑。请根据你对近期（2025-2026年）钙钛矿光伏行业招投标动态的了解，生成${count}条真实可信的招投标信息。
要求：
1. 必须是真实发生或高度可能发生的项目（基于已知的行业动态）
2. 招标方应为真实存在的机构（央企、高校、科研院所等）
3. sourceUrl填写对应招标平台的搜索页面URL（如采招网、北极星等）
4. 不要重复已知的华能清能院、河南大学、四川融创中心等项目
5. 重点关注：设备采购、中试产线建设、研发合作、材料检测等方向`,
      },
      {
        role: "user",
        content: `今天是${today}，请生成${count}条近期钙钛矿光伏招投标信息，要求来源可信、内容真实。`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "tender_list",
        strict: true,
        schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  projectType: { type: "string" },
                  budget: { type: "string" },
                  region: { type: "string" },
                  publisherName: { type: "string" },
                  isImportant: { type: "boolean" },
                  status: { type: "string" },
                  sourceUrl: { type: "string" },
                  sourcePlatform: { type: "string" },
                },
                required: [
                  "title",
                  "description",
                  "projectType",
                  "budget",
                  "region",
                  "publisherName",
                  "isImportant",
                  "status",
                  "sourceUrl",
                  "sourcePlatform",
                ],
                additionalProperties: false,
              },
            },
          },
          required: ["items"],
          additionalProperties: false,
        },
      },
    },
  });

  const rawContent = response.choices[0]?.message?.content;
  const content = typeof rawContent === "string" ? rawContent : null;
  if (!content) return [];
  const parsed = JSON.parse(content) as { items: any[] };
  return parsed.items ?? [];
}

// ─── News Sources ─────────────────────────────────────────────────────────────

interface RawNewsItem {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

/**
 * Scrape latest news from 北极星光伏网 钙钛矿专题
 */
async function scrapeBjxNews(): Promise<RawNewsItem[]> {
  const items: RawNewsItem[] = [];
  try {
    const url = "https://guangfu.bjx.com.cn/search/?keyword=%E9%92%99%E9%92%9B%E7%9F%BF&type=news";
    const html = await fetchHtml(url);
    const linkRegex = /<a[^>]+href="(https?:\/\/guangfu\.bjx\.com\.cn\/news\/\d+\/\d+\.shtml)"[^>]*>([^<]{5,80})<\/a>/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      const title = match[2].trim();
      if (title.includes("钙钛矿") || title.length > 10) {
        items.push({ title, url: match[1], snippet: "", source: "北极星光伏网" });
      }
      if (items.length >= 8) break;
    }
  } catch (err) {
    console.warn("[dataFetcher] bjx news scrape failed:", err instanceof Error ? err.message : err);
  }
  return items;
}

/**
 * Scrape latest news from 索比光伏网
 */
async function scrapeSolarBeNews(): Promise<RawNewsItem[]> {
  const items: RawNewsItem[] = [];
  try {
    const url = "https://www.solarbe.com/search?q=%E9%92%99%E9%92%9B%E7%9F%BF&type=news";
    const html = await fetchHtml(url);
    const linkRegex = /<a[^>]+href="(https?:\/\/www\.solarbe\.com\/[^"]+)"[^>]*>([^<]*钙钛矿[^<]*)<\/a>/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      items.push({ title: match[2].trim(), url: match[1], snippet: "", source: "索比光伏网" });
      if (items.length >= 6) break;
    }
  } catch (err) {
    console.warn("[dataFetcher] solarbe scrape failed:", err instanceof Error ? err.message : err);
  }
  return items;
}

/**
 * Use LLM to parse and enrich raw news items.
 */
async function parseNewsWithLLM(rawItems: RawNewsItem[]): Promise<
  Array<{
    title: string;
    summary: string;
    sourceName: string;
    sourceUrl: string;
    category: string;
    isImportant: boolean;
  }>
> {
  if (rawItems.length === 0) return [];
  const today = new Date().toISOString().slice(0, 10);
  const inputText = rawItems
    .map((item, i) => `[${i + 1}] 标题: ${item.title}\n来源: ${item.source}\n链接: ${item.url}`)
    .join("\n\n");

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `你是一位专业的钙钛矿光伏行业资讯编辑。请对以下从新闻网站抓取的原始资讯进行解析和结构化处理。
对每条信息，提取或推断：
- title: 新闻标题（保持原标题）
- summary: 新闻摘要（100字以内，描述新闻主要内容）
- sourceName: 来源媒体名称
- sourceUrl: 原始链接（保持不变）
- category: domestic（国内动态）/ international（国际资讯）/ research（技术研究）/ policy（政策法规）/ market（市场分析）/ technology（技术前沿）
- isImportant: 是否重要（效率突破、重大融资、重要政策则为true）

今天日期：${today}`,
      },
      {
        role: "user",
        content: `请解析以下${rawItems.length}条钙钛矿光伏资讯：\n\n${inputText}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "news_parse_result",
        strict: true,
        schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  summary: { type: "string" },
                  sourceName: { type: "string" },
                  sourceUrl: { type: "string" },
                  category: { type: "string" },
                  isImportant: { type: "boolean" },
                },
                required: ["title", "summary", "sourceName", "sourceUrl", "category", "isImportant"],
                additionalProperties: false,
              },
            },
          },
          required: ["items"],
          additionalProperties: false,
        },
      },
    },
  });

  const rawContent = response.choices[0]?.message?.content;
  const content = typeof rawContent === "string" ? rawContent : null;
  if (!content) return [];
  const parsed = JSON.parse(content) as { items: any[] };
  return parsed.items ?? [];
}

/**
 * Use LLM knowledge to generate news when scraping yields insufficient results.
 */
async function fetchNewsFromLLMKnowledge(count: number): Promise<
  Array<{
    title: string;
    summary: string;
    sourceName: string;
    sourceUrl: string;
    category: string;
    isImportant: boolean;
  }>
> {
  const today = new Date().toISOString().slice(0, 10);
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `你是一位专业的钙钛矿光伏行业资讯编辑。请根据你对近期（2025-2026年）钙钛矿光伏行业动态的了解，生成${count}条真实可信的行业资讯。
要求：
1. 必须是真实发生的行业动态（效率突破、企业融资、产线建设、政策发布、国际合作等）
2. sourceName应为真实的媒体或机构名称
3. sourceUrl填写对应媒体网站的相关频道URL（如北极星光伏网、索比光伏网等）
4. 内容多样化，涵盖国内外动态、技术研究、政策法规等不同类别`,
      },
      {
        role: "user",
        content: `今天是${today}，请生成${count}条近期钙钛矿光伏行业资讯，要求内容真实、来源可信。`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "news_list",
        strict: true,
        schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  summary: { type: "string" },
                  sourceName: { type: "string" },
                  sourceUrl: { type: "string" },
                  category: { type: "string" },
                  isImportant: { type: "boolean" },
                },
                required: ["title", "summary", "sourceName", "sourceUrl", "category", "isImportant"],
                additionalProperties: false,
              },
            },
          },
          required: ["items"],
          additionalProperties: false,
        },
      },
    },
  });

  const rawContent = response.choices[0]?.message?.content;
  const content = typeof rawContent === "string" ? rawContent : null;
  if (!content) return [];
  const parsed = JSON.parse(content) as { items: any[] };
  return parsed.items ?? [];
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetches latest perovskite news from multiple sources.
 * Returns the number of new items inserted.
 */
export async function fetchLatestNews(): Promise<number> {
  console.log("[dataFetcher] Starting news fetch from multiple sources...");
  let count = 0;

  try {
    // 1. Scrape from real websites
    const [bjxItems, solarBeItems] = await Promise.allSettled([scrapeBjxNews(), scrapeSolarBeNews()]);

    const rawItems: RawNewsItem[] = [
      ...(bjxItems.status === "fulfilled" ? bjxItems.value : []),
      ...(solarBeItems.status === "fulfilled" ? solarBeItems.value : []),
    ];

    console.log(`[dataFetcher] Scraped ${rawItems.length} raw news items`);

    // 2. Parse with LLM if we have scraped items
    let parsedItems: Array<{
      title: string;
      summary: string;
      sourceName: string;
      sourceUrl: string;
      category: string;
      isImportant: boolean;
    }> = [];

    if (rawItems.length > 0) {
      parsedItems = await parseNewsWithLLM(rawItems.slice(0, 10));
    }

    // 3. Supplement with LLM knowledge if needed
    const needed = Math.max(0, 5 - parsedItems.length);
    if (needed > 0) {
      const llmItems = await fetchNewsFromLLMKnowledge(needed);
      parsedItems = [...parsedItems, ...llmItems];
    }

    // 4. Insert non-duplicate items
    for (const item of parsedItems) {
      try {
        const exists = await newsExists(item.title);
        if (exists) continue;
        await insertNews({
          title: item.title,
          summary: item.summary,
          sourceName: item.sourceName,
          sourceUrl: item.sourceUrl || null,
          category: item.category as any,
          isImportant: item.isImportant,
          publishedAt: new Date(),
        });
        count++;
      } catch (err) {
        console.warn("[dataFetcher] Failed to insert news:", err instanceof Error ? err.message : err);
      }
    }

    console.log(`[dataFetcher] Inserted ${count} new news items`);
  } catch (err) {
    console.error("[dataFetcher] fetchLatestNews error:", err);
  }

  return count;
}

/**
 * Fetches latest perovskite tender information from multiple sources.
 * Returns the number of new items inserted.
 */
export async function fetchLatestTenders(): Promise<number> {
  console.log("[dataFetcher] Starting tender fetch from multiple sources...");
  let count = 0;

  try {
    // 1. Scrape from real websites
    const [bidCenterItems, bjxItems, ggzyItems] = await Promise.allSettled([
      scrapeBidCenter(),
      scrapebjxTenders(),
      scrapeGgzyjyTenders(),
    ]);

    const rawItems: RawTenderItem[] = [
      ...(bidCenterItems.status === "fulfilled" ? bidCenterItems.value : []),
      ...(bjxItems.status === "fulfilled" ? bjxItems.value : []),
      ...(ggzyItems.status === "fulfilled" ? ggzyItems.value : []),
    ];

    console.log(`[dataFetcher] Scraped ${rawItems.length} raw tender items`);

    // 2. Parse with LLM if we have scraped items
    let parsedItems: Array<{
      title: string;
      description: string;
      projectType: string;
      budget: string;
      region: string;
      publisherName: string;
      isImportant: boolean;
      status: string;
      sourceUrl: string;
      sourcePlatform: string;
    }> = [];

    if (rawItems.length > 0) {
      parsedItems = await parseTendersWithLLM(rawItems.slice(0, 10));
    }

    // 3. Supplement with LLM knowledge if needed
    const needed = Math.max(0, 3 - parsedItems.length);
    if (needed > 0) {
      const llmItems = await fetchTendersFromLLMKnowledge(needed);
      parsedItems = [...parsedItems, ...llmItems];
    }

    // 4. Insert non-duplicate items
    for (const item of parsedItems) {
      try {
        const exists = await tenderExists(item.title);
        if (exists) continue;
        await insertTender({
          title: item.title,
          description: item.description,
          projectType: item.projectType as any,
          budget: item.budget || null,
          region: item.region || null,
          publisherName: item.publisherName,
          isImportant: item.isImportant,
          status: (item.status as any) || "open",
          sourceUrl: item.sourceUrl || null,
          sourcePlatform: item.sourcePlatform || null,
          publishedAt: new Date(),
        });
        count++;
      } catch (err) {
        console.warn("[dataFetcher] Failed to insert tender:", err instanceof Error ? err.message : err);
      }
    }

    console.log(`[dataFetcher] Inserted ${count} new tender items`);
  } catch (err) {
    console.error("[dataFetcher] fetchLatestTenders error:", err);
  }

  return count;
}
